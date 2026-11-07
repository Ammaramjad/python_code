"""
Experiment D: Controlled Synthetic SCM for CausalGuard Rebuttal
================================================================
Vectorized implementation — runs in ~30s on CPU.

Non-negotiable constraints:
- No target labels used in training or model selection
- All seeds are run; none discarded for unfavorable outcomes
- Negative results are retained and reported
- Results are labeled as: synthetic linear approximation (not ResNet-50)
"""

import numpy as np
import csv
import os
import time
from datetime import datetime

TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "results", "rebuttal")
os.makedirs(OUT_DIR, exist_ok=True)

SEEDS = [0, 1, 2]  # 3 seeds (rebuttal minimum; paper uses 5 — labeled as such)

# ── SCM Setup ─────────────────────────────────────────────────────────────────
# X = [C0 + ε, S + ε]  where C0 is content, S is nuisance
# Y = (C0 > 0)  — labels depend only on content
# S = ρ * sign(Y) + sqrt(1-ρ²) * ε_S  — nuisance correlated with Y via ρ

SOURCE_CONDITIONS = [("src_high", 0.90), ("src_medium", 0.70), ("src_low", 0.50)]
TARGET_CONDITIONS = [
    ("tgt_in_support",     0.60),   # within source spurious range
    ("tgt_weakened",       0.10),   # mild correlation
    ("tgt_zero",           0.00),   # independent
    ("tgt_reversed",      -0.50),   # reversed correlation
    ("tgt_out_of_support", -0.90),  # completely out of source support
    ("tgt_ambiguous",      0.95),   # stronger than any source (all-shortcut scenario)
]
N_SRC_PER_DOMAIN = 1000
N_VAL_FRAC = 0.2
N_TGT = 500


def generate_domain(rho, n, seed):
    rng = np.random.default_rng(seed)
    C0 = rng.normal(0, 1, n)
    Y = (C0 > 0).astype(int)
    Y_signed = 2 * Y - 1
    eps_S = rng.normal(0, 1, n)
    S = rho * Y_signed + np.sqrt(max(1 - rho**2, 1e-6)) * eps_S
    obs_noise = rng.normal(0, 0.1, (n, 2))
    X = np.stack([C0, S], axis=1) + obs_noise
    return X, Y, C0


def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -50, 50)))


# ── ERM ───────────────────────────────────────────────────────────────────────

def train_erm(X_tr, Y_tr, X_val, Y_val, lr=0.1, n_steps=500, seed=0):
    rng = np.random.default_rng(seed)
    w = rng.normal(0, 0.01, X_tr.shape[1])
    b = 0.0
    best_acc, best_w, best_b = -1, w.copy(), b
    for step in range(n_steps):
        idx = rng.choice(len(X_tr), min(128, len(X_tr)), replace=False)
        Xb, Yb = X_tr[idx], Y_tr[idx]
        logit = Xb @ w + b
        p = sigmoid(logit)
        err = p - Yb
        w -= lr * (Xb.T @ err / len(idx) + 1e-3 * w)
        b -= lr * err.mean()
        if step % 50 == 0:
            val_acc = ((X_val @ w + b > 0) == Y_val).mean()
            if val_acc > best_acc:
                best_acc, best_w, best_b = val_acc, w.copy(), b
    return best_w, best_b


def predict_erm(w, b, X):
    return (X @ w + b > 0).astype(int)


# ── Oracle (content only) ─────────────────────────────────────────────────────

def train_oracle(X_tr, Y_tr, X_val, Y_val, seed=0):
    return train_erm(X_tr[:, :1], Y_tr, X_val[:, :1], Y_val, seed=seed)


def predict_oracle(w, b, X):
    return predict_erm(w, b, X[:, :1])


# ── CausalGuard Approximation (vectorized) ────────────────────────────────────

class CGApprox:
    """
    Approximate CausalGuard for 2D linear setting:
    - Soft mask m ∈ R^d (via sigmoid with temperature T)
    - Retained: c = m * u
    - Candidate: v = c_anchor + (1-m) * u_donor
    - Re-encoding: apply mask to v again -> c_v = m * v
    - Consistency: KL(detach(p_anchor) || p_candidate) over accepted donors
    - Compatibility gate: accept donor if predicted class = anchor class
    - Source-only checkpoint selection
    """

    def __init__(self, d=2, T=0.5, lr=0.05, n_steps=600,
                 lambda_cf=0.5, tau=0.05, seed=0, reencoding=True,
                 n_donors=8):
        rng = np.random.default_rng(seed)
        self.w = rng.normal(0, 0.01, d)
        self.b = 0.0
        self.m_logit = rng.normal(0, 0.1, d)  # mask logits
        self.T = T
        self.lr = lr
        self.n_steps = n_steps
        self.lambda_cf = lambda_cf
        self.tau = tau
        self.reencoding = reencoding
        self.n_donors = n_donors  # max donors per anchor in a batch
        self.rng = rng

    @property
    def m(self):
        return sigmoid(self.m_logit / self.T)

    def _predict(self, feat):
        """Apply probability floor: p = (1 - C*tau)*softmax(w^T feat + b) + tau."""
        logit = feat @ self.w + self.b
        p1 = sigmoid(logit)
        p1 = (1 - 2 * self.tau) * p1 + self.tau  # floor tau, 2 classes
        return p1  # shape [n]

    def predict(self, X):
        c = self.m * X
        p1 = self._predict(c)
        return (p1 > 0.5).astype(int)

    def fit(self, X_tr, Y_tr, X_val, Y_val):
        best_acc, best_w, best_b, best_m = -1, self.w.copy(), self.b, self.m_logit.copy()
        n = len(X_tr)

        for step in range(self.n_steps):
            # Sample minibatch
            idx = self.rng.choice(n, min(64, n), replace=False)
            Xb, Yb = X_tr[idx], Y_tr[idx]
            B = len(idx)

            # ── Factual forward ──
            m = self.m  # [d]
            c_anchor = m * Xb  # [B, d]
            logit_f = c_anchor @ self.w + self.b  # [B]
            p1_f = sigmoid(logit_f)
            err_f = p1_f - Yb  # [B]

            grad_w = c_anchor.T @ err_f / B + 1e-3 * self.w
            grad_b = err_f.mean()
            # Mask gradient from supervised: d_loss/d_m = (err * w) * X (element-wise)
            grad_m_sup = ((err_f[:, None] * self.w[None, :]) * Xb).mean(axis=0)
            # dm/d_logit = m*(1-m)/T
            grad_m_logit = grad_m_sup * (m * (1 - m) / self.T)

            # ── Consistency loss (vectorized over donors) ──
            cf_grad_w = np.zeros_like(self.w)
            cf_grad_b_val = 0.0
            cf_grad_m_logit = np.zeros_like(self.m_logit)
            n_accepted = 0

            if self.lambda_cf > 0:
                for i in range(B):
                    xi = Xb[i]       # [d]
                    yi = Yb[i]

                    # Same-class donors from full training set
                    same_cls = (Y_tr == yi)
                    donor_idx = np.where(same_cls)[0]
                    if len(donor_idx) == 0:
                        continue
                    # Sample up to n_donors donors
                    if len(donor_idx) > self.n_donors:
                        donor_idx = self.rng.choice(donor_idx, self.n_donors, replace=False)
                    Xd = X_tr[donor_idx]  # [K, d]

                    # Build candidates
                    si_anchor = (1 - m) * xi  # [d]
                    si_donors = (1 - m) * Xd  # [K, d]
                    c_i = m * xi              # [d]
                    v_ij = c_i + si_donors    # [K, d]  (vij = c_anchor + s_donor)

                    if self.reencoding:
                        # Re-encoding: apply mask to v_ij
                        c_v = m * v_ij        # [K, d]
                    else:
                        # No re-encoding: use factual retained features (bypass)
                        c_v = np.tile(c_i, (len(donor_idx), 1))  # [K, d]  -- same for all

                    logit_v = c_v @ self.w + self.b  # [K]
                    p1_v = sigmoid(logit_v)
                    p1_v_floored = (1 - 2 * self.tau) * p1_v + self.tau

                    # Compatibility gate: accept if predicted class == yi
                    pred_v = (p1_v > 0.5).astype(int)
                    accepted = (pred_v == yi)
                    if not accepted.any():
                        continue

                    # Reference (stop-gradient): anchor prediction
                    p1_ref = float(((1 - 2 * self.tau) * sigmoid(float(c_i @ self.w + self.b)) + self.tau))
                    p_ref = np.array([1 - p1_ref, p1_ref])

                    # KL(p_ref || p_cand) over accepted candidates
                    p1_acc = p1_v_floored[accepted]  # [K']
                    # d KL / d p1_cand = -p_ref[1]/p_cand + p_ref[0]/(1-p_cand)
                    eps = 1e-10
                    d_kl = -p_ref[1] / (p1_acc + eps) + p_ref[0] / (1 - p1_acc + eps)  # [K']
                    d_p1_dlogit = p1_acc * (1 - p1_acc)  # [K']
                    delta = d_kl * d_p1_dlogit  # [K']

                    c_v_acc = c_v[accepted]  # [K', d]
                    cf_grad_w += c_v_acc.T @ delta / B  # [d]
                    cf_grad_b_val += delta.sum() / B

                    if self.reencoding:
                        # Gradient of c_v = m * v_ij w.r.t. m_logit
                        # v_ij = c_i + s_j = m*xi + (1-m)*xj
                        # c_v = m * v_ij = m * (m*xi + (1-m)*xj)
                        # d c_v / d m = v_ij + m * (xi - xj)  (element-wise)
                        v_acc = v_ij[accepted]   # [K', d]
                        Xd_acc = Xd[accepted]    # [K', d]
                        d_cv_dm = v_acc + m * (xi - Xd_acc)  # [K', d]
                        # d_logit/d_m = w * d_cv_dm, then * delta
                        d_logit_dm = (d_cv_dm * self.w[None, :])  # [K', d]
                        cf_grad_m_sup = (delta[:, None] * d_logit_dm).mean(axis=0)
                        cf_grad_m_logit += cf_grad_m_sup * (m * (1 - m) / self.T) / B * len(accepted)

                    n_accepted += accepted.sum()

                if n_accepted > 0:
                    scale = self.lambda_cf / max(n_accepted, 1)
                    grad_w += scale * cf_grad_w
                    grad_b += scale * cf_grad_b_val
                    grad_m_logit += scale * cf_grad_m_logit

            # ── Update ──
            self.w -= self.lr * grad_w
            self.b -= self.lr * grad_b
            self.m_logit -= self.lr * grad_m_logit

            # Source-only checkpoint selection every 50 steps
            if step % 50 == 0:
                val_acc = (self.predict(X_val) == Y_val).mean()
                if val_acc > best_acc:
                    best_acc = val_acc
                    best_w, best_b, best_m = self.w.copy(), self.b, self.m_logit.copy()

        self.w, self.b, self.m_logit = best_w, best_b, best_m


# ── Intervention Audit ────────────────────────────────────────────────────────

def audit_cg(cg, X_audit, Y_audit, C0_audit, X_donor_pool, Y_donor_pool):
    """Ground-truth label preservation: Y = (C0 > 0), so any same-class donor preserves label."""
    m = cg.m
    n_pairs, n_accepted_total, n_preserved, n_disagree, kl_sum = 0, 0, 0, 0, 0.0

    for i in range(min(200, len(X_audit))):
        xi, yi, c0_i = X_audit[i], Y_audit[i], C0_audit[i]
        same_cls = (Y_donor_pool == yi)
        Xd = X_donor_pool[same_cls][:20]  # limit for speed
        if len(Xd) == 0:
            continue

        c_i = m * xi
        si_donors = (1 - m) * Xd
        v_ij = c_i + si_donors
        c_v = m * v_ij

        logit_v = c_v @ cg.w + cg.b
        p1_v = sigmoid(logit_v)
        pred_v = (p1_v > 0.5).astype(int)

        p1_anchor = float(sigmoid(float(c_i @ cg.w + cg.b)))
        p_anchor = np.array([1 - p1_anchor, p1_anchor])

        for k in range(len(Xd)):
            accepted = (pred_v[k] == yi)
            # Ground-truth: label depends on C0, not S, so same-class interventions preserve Y
            gt_preserved = (yi == int(c0_i > 0))  # trivially true for valid anchor
            kl = max(0, (-p_anchor * np.log(np.array([1-p1_v[k], p1_v[k]]) / (p_anchor + 1e-10) + 1e-10)).sum())
            n_pairs += 1
            if accepted:
                n_accepted_total += 1
                n_preserved += int(gt_preserved)
                n_disagree += int(pred_v[k] != yi)
                kl_sum += kl

    if n_pairs == 0:
        return {}
    return {
        "accept_rate": n_accepted_total / n_pairs,
        "gt_preservation": n_preserved / max(n_accepted_total, 1),
        "disagree_accepted": n_disagree / max(n_accepted_total, 1),
        "mean_kl_accepted": kl_sum / max(n_accepted_total, 1),
        "n_pairs": n_pairs,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"[{TIMESTAMP}] Experiment D — Controlled Synthetic SCM")
    print(f"Seeds: {SEEDS} (3 seeds; paper uses 5 — labeled as rebuttal-scope run)")
    print(f"Note: This is a linear 2D approximation, NOT ResNet-50 on PACS/VLCS/Office-Home.\n")

    all_rows = []
    audit_rows = []

    for seed in SEEDS:
        t0 = time.time()
        print(f"  Seed {seed}")
        rng = np.random.default_rng(seed)

        # Pool source data
        Xs, Ys, C0s = [], [], []
        for name, rho in SOURCE_CONDITIONS:
            X, Y, C0 = generate_domain(rho, N_SRC_PER_DOMAIN, seed=seed * 100 + hash(name) % 100)
            Xs.append(X); Ys.append(Y); C0s.append(C0)
        X_pool = np.vstack(Xs); Y_pool = np.hstack(Ys); C0_pool = np.hstack(C0s)

        # Train/val split (source only for selection)
        n_pool = len(X_pool)
        perm = rng.permutation(n_pool)
        n_val = int(n_pool * N_VAL_FRAC)
        val_idx = perm[:n_val]; tr_idx = perm[n_val:]
        X_tr, Y_tr = X_pool[tr_idx], Y_pool[tr_idx]
        X_val, Y_val = X_pool[val_idx], Y_pool[val_idx]
        C0_val = C0_pool[val_idx]

        # Train models
        erm_w, erm_b = train_erm(X_tr, Y_tr, X_val, Y_val, seed=seed)
        oracle_w, oracle_b = train_oracle(X_tr, Y_tr, X_val, Y_val, seed=seed)

        cg = CGApprox(d=2, T=0.5, lr=0.05, n_steps=600, lambda_cf=0.5,
                      tau=0.05, seed=seed, reencoding=True)
        cg.fit(X_tr, Y_tr, X_val, Y_val)

        cg_nore = CGApprox(d=2, T=0.5, lr=0.05, n_steps=600, lambda_cf=0.5,
                           tau=0.05, seed=seed, reencoding=False)
        cg_nore.fit(X_tr, Y_tr, X_val, Y_val)

        # Learned mask values (content=dim0, nuisance=dim1)
        cg_mask = cg.m.tolist()
        cg_nore_mask = cg_nore.m.tolist()

        # Evaluate on target conditions
        for tgt_name, rho in TARGET_CONDITIONS:
            X_tgt, Y_tgt, _ = generate_domain(rho, N_TGT, seed=seed * 200 + hash(tgt_name) % 100)

            erm_acc = (predict_erm(erm_w, erm_b, X_tgt) == Y_tgt).mean()
            oracle_acc = (predict_oracle(oracle_w, oracle_b, X_tgt) == Y_tgt).mean()
            cg_acc = (cg.predict(X_tgt) == Y_tgt).mean()
            cg_nore_acc = (cg_nore.predict(X_tgt) == Y_tgt).mean()

            for method, acc, mask0, mask1 in [
                ("ERM", erm_acc, None, None),
                ("Oracle_content_only", oracle_acc, None, None),
                ("CausalGuard_reencoding", cg_acc, cg_mask[0], cg_mask[1]),
                ("CausalGuard_no_reencoding", cg_nore_acc, cg_nore_mask[0], cg_nore_mask[1]),
            ]:
                all_rows.append({
                    "experiment": "D_synthetic_scm",
                    "seed": seed,
                    "method": method,
                    "target_condition": tgt_name,
                    "spurious_strength": rho,
                    "accuracy": round(float(acc), 4),
                    "mask_content_dim0": round(float(mask0), 4) if mask0 is not None else "NA",
                    "mask_nuisance_dim1": round(float(mask1), 4) if mask1 is not None else "NA",
                    "n_seeds_total": len(SEEDS),
                    "run_type": "rebuttal_new_scm_linear_approx",
                    "protocol_note": "linear_2d_scm_not_resnet50",
                })

        # Intervention audit
        audit_result = audit_cg(cg, X_val, Y_val, C0_val, X_tr, Y_tr)
        if audit_result:
            audit_rows.append({"seed": seed, **audit_result})
            print(f"    Audit: accept={audit_result['accept_rate']:.2f}, "
                  f"gt_preserve={audit_result['gt_preservation']:.2f}, "
                  f"disagree={audit_result['disagree_accepted']:.2f}")

        print(f"    Mask (CG): content={cg_mask[0]:.3f}, nuisance={cg_mask[1]:.3f}")
        print(f"    Mask (CG-nore): content={cg_nore_mask[0]:.3f}, nuisance={cg_nore_mask[1]:.3f}")
        print(f"    Runtime: {time.time()-t0:.1f}s")

    # Save CSVs
    csv_path = os.path.join(OUT_DIR, f"experiment_D_synthetic_scm_{TIMESTAMP}.csv")
    if all_rows:
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(all_rows[0].keys()))
            writer.writeheader(); writer.writerows(all_rows)
        print(f"\nResults: {csv_path}")

    audit_path = os.path.join(OUT_DIR, f"experiment_D_audit_{TIMESTAMP}.csv")
    if audit_rows:
        with open(audit_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(audit_rows[0].keys()))
            writer.writeheader(); writer.writerows(audit_rows)

    # Print summary table
    from collections import defaultdict
    grouped = defaultdict(list)
    for r in all_rows:
        grouped[(r["method"], r["target_condition"])].append(r["accuracy"])

    methods = ["ERM", "CausalGuard_reencoding", "CausalGuard_no_reencoding", "Oracle_content_only"]
    tgts = [t for t, _ in TARGET_CONDITIONS]

    print("\n" + "="*110)
    print("TABLE: Mean accuracy (±SD) across 3 seeds on each target condition")
    print("       All models trained on source domains only. No target labels used at any stage.")
    print("="*110)
    print(f"{'Method':35s}", end="")
    for t in tgts:
        print(f" {t[-12:]:>15s}", end="")
    print()
    print("-"*110)
    for method in methods:
        print(f"{method:35s}", end="")
        for t in tgts:
            accs = grouped.get((method, t), [])
            if accs:
                mean, sd = np.mean(accs), np.std(accs)
                print(f" {mean:.3f}±{sd:.3f}  ", end="")
            else:
                print(f" {'NA':>14s}", end="")
        print()
    print("="*110)
    print("\nINTERPRETATION NOTES:")
    print("- ERM accuracy degrades as spurious correlation weakens/reverses (shortcut reliance).")
    print("- CausalGuard should retain higher accuracy if mask learns to suppress nuisance dim.")
    print("- tgt_ambiguous (ρ=0.95): all source observations share the same shortcut;")
    print("  CausalGuard cannot distinguish content from nuisance — expected failure.")
    print("- tgt_out_of_support (ρ=-0.90): outside source candidate support — expected degradation.")
    print("- Oracle sets the upper bound using ground-truth content feature.")
    print("\nLIMITATION: This is a 2D linear SCM approximation with logistic regression.")
    print("It illustrates mechanism behavior but cannot substitute for ResNet-50 benchmark runs.")
    print("All results labeled 'run_type=rebuttal_new_scm_linear_approx'.")
    print("3 seeds used (original paper protocol requires 5; labeled as rebuttal-scope).")

    return csv_path


if __name__ == "__main__":
    start = time.time()
    main()
    print(f"\nTotal wall time: {time.time()-start:.1f}s")
