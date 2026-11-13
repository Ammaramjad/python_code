"""
Experiment: Synthetic SCM per z2Uv Q1 Exact Specification
===========================================================
Implements the protocol described in the z2Uv Q1 rebuttal response:

  - Labels: Y = sign(C), C ~ N(0,1) (latent Gaussian content)
  - Observed content feature: x_c = C + epsilon_c, epsilon_c ~ N(0, sigma_c^2)
  - Two nuisance bits: B1 (correlated with Y per P(B1=Y)), B2 (independent binary)
  - Observed nuisance features:
      x_s1 = mu * (2*B1 - 1) + epsilon_s1   [active in all splits]
      x_s2 = mu * (2*B2 - 1) + epsilon_s2   [B2=0 in sources; varies in withheld target]
  - Full feature vector: x = [x_c, x_s1, x_s2]

Feature mechanism (documented):
  B1 shifts x_s1 by +mu when B1=1 (i.e., B1=Y) and -mu when B1=0 (B1 != Y).
  B2 shifts x_s2 by +mu when B2=1 and -mu when B2=0.
  In source domains, B2=0 always => x_s2 has fixed mean -mu with noise.
  In withheld target, B2 ~ Bernoulli(0.55) independent of Y => x_s2 varies freely.

Withheld-direction nuisance transformation vs. appended-zero input:
  - Our implementation: x_s2 = mu*(2*B2-1) + noise = -mu+noise in training (B2=0 always).
    x_s2 is present in the training feature vector with a *fixed non-zero mean* (-mu).
    When B2 varies at test time, x_s2 changes between +mu and -mu values.
    A model that learned any non-zero weight for x_s2 will be sensitive to this shift
    even if it provides no label-predictive information during training.
  - Appended-zero approach: x_s2=0 always in training, x_s2 != 0 at test time.
    Models typically learn near-zero weights for zero-variance inputs; the B2 direction
    activates a coordinate that was silent during training.
  - Key difference: our withheld direction has training-time variance (noise sigma_s),
    giving models non-trivial exposure to the x_s2 coordinate. The appended-zero approach
    produces a strictly silent coordinate. Our approach is strictly harder for the model
    to ignore because x_s2 is observed with variance sigma_s^2 in all splits.

Three source domains (equal weight):
  P(B1=Y) = 0.7, 0.8, 0.9; B2 = 0 (fixed)

Target conditions:
  Represented: P(B1=Y) = 0.6, B2 = 0
    => Conditional nuisance TV (B1 direction) = 0.20 (analytically derived below)
  Withheld:    P(B1=Y) = 0.8, B2 ~ Bernoulli(0.55) independent
    => Conditional nuisance TV (B2 direction) = 0.55 (analytically derived below)

Analytical conditional nuisance TV derivation:
  TV is (1/2) * sum_b |P_src(B|Y=y) - P_tgt(B|Y=y)|, averaged over balanced labels.

  Represented shift (B1, B2=0 fixed):
    P_src(B1=1|Y=1) = mean(0.7, 0.8, 0.9) = 0.8
    P_tgt(B1=1|Y=1) = 0.6
    TV(Y=1) = (|0.8-0.6| + |0.2-0.4|)/2 = 0.20
    P_src(B1=1|Y=0) = 1-0.8 = 0.2, P_tgt(B1=1|Y=0) = 1-0.6 = 0.4
    TV(Y=0) = (|0.2-0.4| + |0.8-0.6|)/2 = 0.20
    Average conditional nuisance TV = 0.20

  Withheld direction (B2, B1 component same as source mean):
    P_src(B2=0|Y=y) = 1.0 (B2=0 always in sources)
    P_tgt(B2=0|Y=y) = 0.45 (B2 independent of Y)
    TV(any Y) = (|1.0-0.45| + |0.0-0.55|)/2 = 0.55
    Average conditional nuisance TV = 0.55

  These are conditional nuisance gaps relative to the equal-weight source mixture.
  They are analytically derived and distinct from eta in Theorem 1.

Protocol:
  - 5 seeds (per z2Uv Q1 specification)
  - 2000 paired evaluations per target condition
  - Nuisance-only flip pairs: content C and label Y fixed; B1 (or B2) flipped
  - Models: ERM, no-re-encoding ablation, full CausalGuard
  - Source-only validation for checkpoint selection (no target labels used)
  - All seeds run; negative/inconclusive results retained and reported

Limitations:
  - This is a 3D linear synthetic SCM, not ResNet-50 on PACS/VLCS/Office-Home.
  - The CausalGuard "re-encoding" is a linear soft-mask approximation with logistic regression.
  - Results illustrate mechanism behavior under controlled conditions; not benchmark claims.
"""

import numpy as np
import csv
import os
import time
from datetime import datetime
from collections import defaultdict

TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "results", "rebuttal")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Protocol parameters (per z2Uv Q1 spec) ────────────────────────────────────
SEEDS = [0, 1, 2, 3, 4]           # 5 seeds as specified
N_EVAL_PAIRS = 2000                # paired evaluations per condition
N_SRC_PER_DOMAIN = 1500           # training examples per source domain
N_VAL_FRAC = 0.2                  # fraction of source pool for validation

# Feature parameters
MU = 1.5          # nuisance shift magnitude for x_s1, x_s2
SIGMA_C = 0.5     # noise on content feature x_c
SIGMA_S = 0.5     # noise on nuisance features x_s1, x_s2

# Source domains: (name, P(B1=Y))
SOURCE_DOMAINS = [
    ("src_P0.7", 0.7),
    ("src_P0.8", 0.8),
    ("src_P0.9", 0.9),
]

# Target conditions
TARGET_CONDITIONS = [
    # name, P(B1=Y), P(B2=1), flip_var, analytical_TV
    ("represented", 0.6, 0.0, "B1", 0.20),
    ("withheld",    0.8, 0.55, "B2", 0.55),
]


# ── Data generation ────────────────────────────────────────────────────────────

def sample_domain(n, p_b1_eq_y, p_b2_eq_1, rng):
    """
    Generate n examples from a domain with:
      Y = sign(C), C ~ N(0,1)
      B1: P(B1=Y) = p_b1_eq_y  (i.e. P(B1=1|Y=1) = p_b1_eq_y, P(B1=0|Y=0) = p_b1_eq_y)
      B2: Bernoulli(p_b2_eq_1) independent of Y
      x_c = C + N(0, SIGMA_C^2)
      x_s1 = MU*(2*B1-1) + N(0, SIGMA_S^2)
      x_s2 = MU*(2*B2-1) + N(0, SIGMA_S^2)
      x = [x_c, x_s1, x_s2]
    Returns: X [n,3], Y [n], C [n], B1 [n], B2 [n]
    """
    C = rng.standard_normal(n)
    Y = (C > 0).astype(int)

    # B1 correlated with Y
    u1 = rng.random(n)
    B1 = np.where(Y == 1,
                  (u1 < p_b1_eq_y).astype(int),
                  (u1 >= p_b1_eq_y).astype(int))

    # B2 independent
    B2 = (rng.random(n) < p_b2_eq_1).astype(int)

    x_c  = C + rng.normal(0, SIGMA_C, n)
    x_s1 = MU * (2*B1 - 1) + rng.normal(0, SIGMA_S, n)
    x_s2 = MU * (2*B2 - 1) + rng.normal(0, SIGMA_S, n)

    X = np.stack([x_c, x_s1, x_s2], axis=1)
    return X, Y, C, B1, B2


def sample_nuisance_only_pairs(n_pairs, p_b1_eq_y, p_b2_eq_1, flip_var, rng):
    """
    Sample n_pairs nuisance-only pairs: content C and label Y are fixed;
    the specified nuisance bit (B1 or B2) takes both values (0 and 1).
    Each pair has:
      - Same C (and hence same Y)
      - Anchor: original B1, B2
      - Perturbed: B1 flipped (if flip_var='B1') or B2 flipped (if flip_var='B2')
    Returns: X_anchor [n_pairs, 3], X_perturbed [n_pairs, 3], Y [n_pairs]
    """
    C = rng.standard_normal(n_pairs)
    Y = (C > 0).astype(int)

    # B1 correlated with Y (anchor)
    u1 = rng.random(n_pairs)
    B1_anchor = np.where(Y == 1,
                         (u1 < p_b1_eq_y).astype(int),
                         (u1 >= p_b1_eq_y).astype(int))
    # B2 (anchor)
    B2_anchor = (rng.random(n_pairs) < p_b2_eq_1).astype(int)

    if flip_var == "B1":
        B1_pert = 1 - B1_anchor
        B2_pert = B2_anchor.copy()
    else:  # flip B2
        B1_pert = B1_anchor.copy()
        B2_pert = 1 - B2_anchor

    def make_X(B1, B2):
        x_c  = C + rng.normal(0, SIGMA_C, n_pairs)
        x_s1 = MU * (2*B1 - 1) + rng.normal(0, SIGMA_S, n_pairs)
        x_s2 = MU * (2*B2 - 1) + rng.normal(0, SIGMA_S, n_pairs)
        return np.stack([x_c, x_s1, x_s2], axis=1)

    X_anchor    = make_X(B1_anchor, B2_anchor)
    X_perturbed = make_X(B1_pert,   B2_pert)
    return X_anchor, X_perturbed, Y


# ── Sigmoid helper ─────────────────────────────────────────────────────────────

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -50, 50)))


# ── ERM (logistic regression, SGD) ────────────────────────────────────────────

def train_erm(X_tr, Y_tr, X_val, Y_val, seed, lr=0.05, n_steps=1000, wd=1e-3):
    rng = np.random.default_rng(seed)
    d = X_tr.shape[1]
    w = rng.normal(0, 0.01, d)
    b = 0.0
    best_acc, best_w, best_b = -1, w.copy(), 0.0
    bs = min(128, len(X_tr))
    for step in range(n_steps):
        idx = rng.choice(len(X_tr), bs, replace=False)
        Xb, Yb = X_tr[idx], Y_tr[idx]
        p = sigmoid(Xb @ w + b)
        g = p - Yb
        w -= lr * (Xb.T @ g / bs + wd * w)
        b -= lr * g.mean()
        if step % 100 == 0:
            val_acc = ((X_val @ w + b > 0) == Y_val).mean()
            if val_acc > best_acc:
                best_acc, best_w, best_b = val_acc, w.copy(), b
    return best_w, best_b


def predict_erm(w, b, X):
    return (X @ w + b > 0).astype(int)


# ── CausalGuard linear approximation ──────────────────────────────────────────

class CGLinear:
    """
    Linear CausalGuard approximation (3D inputs):
      - Soft mask m = sigmoid(m_logit / T), shape [d]
      - Retained features: c = m * x
      - Candidate: v = c_anchor + (1-m)*x_donor  (same-class donor)
      - Re-encoding: c_v = m * v  (full CausalGuard)
        No-re-encoding: c_v = c_anchor  (bypass; consistency loss is KL(p_anchor||p_anchor)=0)
      - Consistency loss: mean KL(stop_grad(p_anchor) || p_candidate) over accepted donors
      - Compatibility gate: accept donor if pred_class(v) == Y_anchor
      - Source-only validation for checkpoint selection
    """
    def __init__(self, d=3, T=0.5, lr=0.05, n_steps=1000, lambda_cf=0.5,
                 tau=0.05, seed=0, reencoding=True, n_donors=8, wd=1e-3):
        rng = np.random.default_rng(seed)
        self.w = rng.normal(0, 0.01, d)
        self.b = 0.0
        self.m_logit = rng.normal(0, 0.1, d)
        self.T = T
        self.lr = lr
        self.n_steps = n_steps
        self.lambda_cf = lambda_cf
        self.tau = tau
        self.reencoding = reencoding
        self.n_donors = n_donors
        self.wd = wd
        self.rng = rng
        self.d = d

    @property
    def m(self):
        return sigmoid(self.m_logit / self.T)

    def _logit(self, feat):
        return feat @ self.w + self.b

    def _prob_floored(self, logit):
        """Apply probability floor tau (2-class): p = (1-2*tau)*sigmoid(logit) + tau."""
        return (1 - 2 * self.tau) * sigmoid(logit) + self.tau

    def predict(self, X):
        c = self.m * X
        return (self._logit(c) > 0).astype(int)

    def fit(self, X_tr, Y_tr, X_val, Y_val):
        n = len(X_tr)
        best_acc = -1
        best_state = (self.w.copy(), self.b, self.m_logit.copy())
        bs = min(64, n)

        for step in range(self.n_steps):
            idx = self.rng.choice(n, bs, replace=False)
            Xb, Yb = X_tr[idx], Y_tr[idx]
            m = self.m

            # Factual forward
            c_anchor = m * Xb
            logit_f = self._logit(c_anchor)
            p_f = sigmoid(logit_f)
            err_f = p_f - Yb

            grad_w = c_anchor.T @ err_f / bs + self.wd * self.w
            grad_b = err_f.mean()
            grad_m_logit = ((err_f[:, None] * self.w[None, :]) * Xb).mean(axis=0) \
                           * (m * (1 - m) / self.T)

            # Consistency loss
            cf_gw = np.zeros_like(self.w)
            cf_gb = 0.0
            cf_gm = np.zeros_like(self.m_logit)
            n_acc = 0

            if self.lambda_cf > 0:
                for i in range(bs):
                    xi, yi = Xb[i], Yb[i]
                    same = np.where(Y_tr == yi)[0]
                    if len(same) == 0:
                        continue
                    didx = self.rng.choice(same, min(self.n_donors, len(same)), replace=False)
                    Xd = X_tr[didx]

                    c_i = m * xi
                    v_ij = c_i + (1 - m) * Xd  # [K, d]

                    if self.reencoding:
                        c_v = m * v_ij
                    else:
                        c_v = np.tile(c_i, (len(didx), 1))

                    logit_v = self._logit(c_v)
                    p1_v = self._prob_floored(logit_v)
                    gate = ((logit_v > 0).astype(int) == yi)
                    if not gate.any():
                        continue

                    # Reference (stop-gradient)
                    p1_ref = float(self._prob_floored(float(self._logit(c_i))))
                    p_ref = np.array([1 - p1_ref, p1_ref])

                    eps = 1e-10
                    p1_acc = p1_v[gate]
                    d_kl = (-p_ref[1] / (p1_acc + eps) + p_ref[0] / (1 - p1_acc + eps))
                    d_sig = p1_acc * (1 - p1_acc)
                    delta = d_kl * d_sig  # [K']

                    c_v_acc = c_v[gate]
                    cf_gw += c_v_acc.T @ delta / bs
                    cf_gb += delta.sum() / bs

                    if self.reencoding:
                        v_acc = v_ij[gate]
                        Xd_acc = Xd[gate]
                        d_cv_dm = v_acc + m * (xi - Xd_acc)
                        d_logit_dm = d_cv_dm * self.w[None, :]
                        cf_gm += ((delta[:, None] * d_logit_dm).mean(axis=0)
                                  * (m * (1-m) / self.T) / bs * gate.sum())

                    n_acc += gate.sum()

                if n_acc > 0:
                    sc = self.lambda_cf / max(n_acc, 1)
                    grad_w += sc * cf_gw
                    grad_b += sc * cf_gb
                    grad_m_logit += sc * cf_gm

            self.w -= self.lr * grad_w
            self.b -= self.lr * grad_b
            self.m_logit -= self.lr * grad_m_logit

            if step % 100 == 0:
                val_acc = (self.predict(X_val) == Y_val).mean()
                if val_acc > best_acc:
                    best_acc = val_acc
                    best_state = (self.w.copy(), self.b, self.m_logit.copy())

        self.w, self.b, self.m_logit = best_state


# ── Metrics ────────────────────────────────────────────────────────────────────

def error_rate(pred, Y):
    return float((pred != Y).mean()) * 100


def flip_rate(pred_anchor, pred_pert):
    return float((pred_anchor != pred_pert).mean()) * 100


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print(f"[{TIMESTAMP}] z2Uv Q1 Synthetic SCM Experiment")
    print(f"Seeds: {SEEDS}")
    print(f"Eval pairs per condition: {N_EVAL_PAIRS}")
    print(f"Source domains: P(B1=Y) = 0.7, 0.8, 0.9 (B2=0)")
    print(f"Represented target: P(B1=Y)=0.6, B2=0  | analytical TV(B1)=0.20")
    print(f"Withheld target:    P(B1=Y)=0.8, B2~Ber(0.55) | analytical TV(B2)=0.55")
    print()

    # Per-seed results storage
    per_seed = defaultdict(lambda: defaultdict(list))
    # per_seed[condition_name][metric] = [val_s0, val_s1, ...]

    raw_rows = []

    for seed in SEEDS:
        t0 = time.time()
        print(f"  Seed {seed} ...", flush=True)
        base_rng = np.random.default_rng(seed)

        # ── Build source pool ──────────────────────────────────────────────────
        Xs, Ys = [], []
        for dom_name, p_b1 in SOURCE_DOMAINS:
            dom_rng = np.random.default_rng(seed * 1000 + hash(dom_name) % 1000)
            X, Y, _, _, _ = sample_domain(N_SRC_PER_DOMAIN, p_b1, 0.0, dom_rng)
            Xs.append(X); Ys.append(Y)
        X_pool = np.vstack(Xs)
        Y_pool = np.concatenate(Ys)

        # Train/val split (source only — no target data)
        perm = base_rng.permutation(len(X_pool))
        n_val = int(len(X_pool) * N_VAL_FRAC)
        val_idx, tr_idx = perm[:n_val], perm[n_val:]
        X_tr, Y_tr = X_pool[tr_idx], Y_pool[tr_idx]
        X_val, Y_val = X_pool[val_idx], Y_pool[val_idx]

        # Source validation accuracy (reported as diagnostic)
        src_val_acc = None

        # ── Train models ──────────────────────────────────────────────────────
        erm_w, erm_b = train_erm(X_tr, Y_tr, X_val, Y_val, seed=seed)
        src_val_acc = float((predict_erm(erm_w, erm_b, X_val) == Y_val).mean())

        cg_full = CGLinear(d=3, T=0.5, lr=0.05, n_steps=1000, lambda_cf=0.5,
                           tau=0.05, seed=seed, reencoding=True)
        cg_full.fit(X_tr, Y_tr, X_val, Y_val)

        cg_nore = CGLinear(d=3, T=0.5, lr=0.05, n_steps=1000, lambda_cf=0.5,
                           tau=0.05, seed=seed, reencoding=False)
        cg_nore.fit(X_tr, Y_tr, X_val, Y_val)

        print(f"    Src val acc (ERM)={src_val_acc:.3f} | "
              f"mask_full={cg_full.m} | mask_nore={cg_nore.m}")

        # ── Evaluate on each target condition ─────────────────────────────────
        for (cname, p_b1_tgt, p_b2_tgt, flip_var, tv_gap) in TARGET_CONDITIONS:
            eval_rng = np.random.default_rng(seed * 10000 + hash(cname) % 10000)

            # Standard accuracy evaluation
            X_tgt, Y_tgt, _, _, _ = sample_domain(N_EVAL_PAIRS, p_b1_tgt, p_b2_tgt, eval_rng)

            pred_erm_std  = predict_erm(erm_w, erm_b, X_tgt)
            pred_full_std = cg_full.predict(X_tgt)
            pred_nore_std = cg_nore.predict(X_tgt)

            err_erm  = error_rate(pred_erm_std,  Y_tgt)
            err_full = error_rate(pred_full_std, Y_tgt)
            err_nore = error_rate(pred_nore_std, Y_tgt)

            # Nuisance-only flip evaluation (paired)
            pair_rng = np.random.default_rng(seed * 20000 + hash(cname) % 20000)
            X_anc, X_pert, Y_pair = sample_nuisance_only_pairs(
                N_EVAL_PAIRS, p_b1_tgt, p_b2_tgt, flip_var, pair_rng)

            pred_anc_erm   = predict_erm(erm_w,  erm_b, X_anc)
            pred_pert_erm  = predict_erm(erm_w,  erm_b, X_pert)
            pred_anc_full  = cg_full.predict(X_anc)
            pred_pert_full = cg_full.predict(X_pert)
            pred_anc_nore  = cg_nore.predict(X_anc)
            pred_pert_nore = cg_nore.predict(X_pert)

            flip_erm  = flip_rate(pred_anc_erm,  pred_pert_erm)
            flip_full = flip_rate(pred_anc_full, pred_pert_full)
            flip_nore = flip_rate(pred_anc_nore, pred_pert_nore)

            # Paired per-seed difference (CausalGuard full minus ERM, error units)
            diff_full_vs_erm  = err_full - err_erm
            diff_full_vs_nore = err_full - err_nore

            per_seed[cname]["err_erm"].append(err_erm)
            per_seed[cname]["err_full"].append(err_full)
            per_seed[cname]["err_nore"].append(err_nore)
            per_seed[cname]["flip_erm"].append(flip_erm)
            per_seed[cname]["flip_full"].append(flip_full)
            per_seed[cname]["flip_nore"].append(flip_nore)
            per_seed[cname]["diff_full_vs_erm"].append(diff_full_vs_erm)
            per_seed[cname]["diff_full_vs_nore"].append(diff_full_vs_nore)

            raw_rows.append({
                "seed": seed,
                "condition": cname,
                "analytical_tv": tv_gap,
                "flip_var": flip_var,
                "src_val_acc_erm": round(src_val_acc, 4),
                "err_erm":  round(err_erm,  2),
                "err_full": round(err_full, 2),
                "err_nore": round(err_nore, 2),
                "flip_erm":  round(flip_erm,  2),
                "flip_full": round(flip_full, 2),
                "flip_nore": round(flip_nore, 2),
                "diff_full_vs_erm":  round(diff_full_vs_erm,  2),
                "diff_full_vs_nore": round(diff_full_vs_nore, 2),
                "mask_full_xc":  round(float(cg_full.m[0]), 4),
                "mask_full_xs1": round(float(cg_full.m[1]), 4),
                "mask_full_xs2": round(float(cg_full.m[2]), 4),
                "mask_nore_xc":  round(float(cg_nore.m[0]), 4),
                "mask_nore_xs1": round(float(cg_nore.m[1]), 4),
                "mask_nore_xs2": round(float(cg_nore.m[2]), 4),
                "n_eval_pairs": N_EVAL_PAIRS,
                "run_type": "z2Uv_q1_scm_linear_approx",
            })

        print(f"    Runtime: {time.time()-t0:.1f}s")

    # ── Save raw CSV ────────────────────────────────────────────────────────────
    csv_path = os.path.join(OUT_DIR, f"z2Uv_q1_scm_{TIMESTAMP}.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(raw_rows[0].keys()))
        writer.writeheader()
        writer.writerows(raw_rows)
    print(f"\nRaw results: {csv_path}")

    # ── Summary table ───────────────────────────────────────────────────────────
    print("\n" + "="*90)
    print("TABLE: z2Uv Q1 SCM Results — mean ± SD across 5 seeds")
    print("       Errors and flip rates in percent. 2000 eval pairs per condition.")
    print("       Source: 3D linear SCM + logistic regression. NOT ResNet-50 on PACS.")
    print("="*90)

    summary_rows = []
    for (cname, _, _, flip_var, tv_gap) in TARGET_CONDITIONS:
        d = per_seed[cname]

        def ms(key):
            vals = np.array(d[key])
            return f"{vals.mean():.1f} ± {vals.std():.1f}"

        err_erm  = np.array(d["err_erm"])
        err_full = np.array(d["err_full"])
        err_nore = np.array(d["err_nore"])

        print(f"\nCondition: {cname}  (analytical TV={tv_gap:.2f}, flip_var={flip_var})")
        print(f"  ERM error:           {ms('err_erm')}%")
        print(f"  No-reenc error:      {ms('err_nore')}%")
        print(f"  CausalGuard error:   {ms('err_full')}%")
        print(f"  ERM flip rate:       {ms('flip_erm')}%")
        print(f"  No-reenc flip rate:  {ms('flip_nore')}%")
        print(f"  CG flip rate:        {ms('flip_full')}%")
        print(f"  CG vs ERM error diff (paired):  "
              f"{np.array(d['diff_full_vs_erm']).mean():+.1f} pp")
        print(f"  CG vs no-reenc diff (paired):   "
              f"{np.array(d['diff_full_vs_nore']).mean():+.1f} pp")

        summary_rows.append({
            "condition": cname,
            "analytical_tv": tv_gap,
            "err_erm_mean":  round(float(err_erm.mean()),  1),
            "err_erm_sd":    round(float(err_erm.std()),   1),
            "err_nore_mean": round(float(err_nore.mean()), 1),
            "err_nore_sd":   round(float(err_nore.std()),  1),
            "err_full_mean": round(float(err_full.mean()), 1),
            "err_full_sd":   round(float(err_full.std()),  1),
            "flip_erm_mean":  round(float(np.array(d["flip_erm"]).mean()),  1),
            "flip_erm_sd":    round(float(np.array(d["flip_erm"]).std()),   1),
            "flip_full_mean": round(float(np.array(d["flip_full"]).mean()), 1),
            "flip_full_sd":   round(float(np.array(d["flip_full"]).std()),  1),
            "flip_nore_mean": round(float(np.array(d["flip_nore"]).mean()), 1),
            "flip_nore_sd":   round(float(np.array(d["flip_nore"]).std()),  1),
            "diff_full_vs_erm_mean":  round(float(np.array(d["diff_full_vs_erm"]).mean()),  1),
            "diff_full_vs_nore_mean": round(float(np.array(d["diff_full_vs_nore"]).mean()), 1),
        })

    print("\n" + "="*90)
    print("Per-condition summary table (for rebuttal use):")
    print(f"{'Condition':12s} {'TV':6s} {'ERM err':12s} {'No-reenc':12s} {'CG err':12s}"
          f" {'ERM flip':12s} {'CG flip':12s} {'No-reenc flip':14s}")
    for r in summary_rows:
        print(f"{r['condition']:12s} {r['analytical_tv']:.2f}   "
              f"{r['err_erm_mean']:.1f}±{r['err_erm_sd']:.1f}     "
              f"{r['err_nore_mean']:.1f}±{r['err_nore_sd']:.1f}     "
              f"{r['err_full_mean']:.1f}±{r['err_full_sd']:.1f}     "
              f"{r['flip_erm_mean']:.1f}±{r['flip_erm_sd']:.1f}     "
              f"{r['flip_full_mean']:.1f}±{r['flip_full_sd']:.1f}     "
              f"{r['flip_nore_mean']:.1f}±{r['flip_nore_sd']:.1f}")

    sum_path = os.path.join(OUT_DIR, f"z2Uv_q1_scm_summary_{TIMESTAMP}.csv")
    with open(sum_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(summary_rows[0].keys()))
        writer.writeheader()
        writer.writerows(summary_rows)
    print(f"\nSummary: {sum_path}")

    print("\nLIMITATIONS:")
    print("  - 3D linear SCM + logistic regression, NOT ResNet-50 on PACS/VLCS/Office-Home.")
    print("  - The z2Uv Q1 pasted review drops an expression after 'Can you show a case where'.")
    print("    The experiment covers the visible requests (represented and withheld shift)")
    print("    without claiming the missing clause was tested.")
    print("  - Source for all reported numbers: newly measured (this run).")

    return csv_path, sum_path


if __name__ == "__main__":
    start = time.time()
    main()
    print(f"\nTotal wall time: {time.time()-start:.1f}s")
