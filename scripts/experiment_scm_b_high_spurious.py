"""
Experiment SCM-B: High-Uniform-Spurious Sources
================================================
Motivation: The z2Uv Q1 SCM (experiment_z2Uv_q1_scm.py) uses source spurious
correlations P(B1=Y) ∈ {0.7, 0.8, 0.9}, which vary across sources. This variation
provides supervised inductive bias for ERM to partially separate content from nuisance
(cross-domain inconsistency signal). Result: CausalGuard ≈ ERM in that regime.

This experiment asks: when does the consistency loss from re-encoding provide
measurable additional signal?

Hypothesis: When all source domains share the same high spurious correlation
(ambiguous case from Appendix E), the supervised loss alone cannot distinguish
content from nuisance. The consistency loss from re-encoding — which penalizes
predictions that change when the nuisance changes — should provide additional
separating signal, yielding a larger advantage for full CausalGuard over no-reenc/ERM.

This is NOT the z2Uv Q1 protocol. It is a separate diagnostic SCM-B designed to
characterize the conditions under which re-encoding helps, as a complement to the
z2Uv Q1 result. Both experiments are reported; neither replaces the other.

SCM-B specification:
  Sources (3 domains, equal weight): P(B1=Y) = 0.9 all three (high, uniform spurious)
  Represented target:   P(B1=Y) = 0.3  (reversed spurious — ERM should fail)
  Withheld target:      P(B1=Y) = 0.9, B2 ~ Bernoulli(0.55) independent
  B2 = 0 in all source domains

Feature mechanism: same as z2Uv Q1 (3D features, B1→x_s1, B2→x_s2, MU=1.5, sigma=0.5)

Expected behavior:
  - ERM learns strong reliance on x_s1 (since P(B1=Y)=0.9 uniformly across all sources)
  - On the reversed target (P(B1=Y)=0.3), ERM fails badly because x_s1 now anti-predicts Y
  - Full CausalGuard's consistency loss penalizes prediction changes from nuisance
    interventions, which should reduce reliance on x_s1
  - No-reenc's consistency loss = 0 by construction (Proposition 2 bypass vacuity),
    so no-reenc ≈ ERM in this setting too
  - If the hypothesis holds: CG error < no-reenc error < ERM error on reversed target

Protocol: 5 seeds, 2000 eval pairs, same training budget and hyperparameters as z2Uv Q1.
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

SEEDS = [0, 1, 2, 3, 4]
N_EVAL_PAIRS = 2000
N_SRC_PER_DOMAIN = 1500
N_VAL_FRAC = 0.2
MU = 1.5
SIGMA_C = 0.5
SIGMA_S = 0.5

# SCM-B: ALL sources have P(B1=Y) = 0.9 (high, uniform)
SOURCE_DOMAINS_B = [
    ("src_high_A", 0.9),
    ("src_high_B", 0.9),
    ("src_high_C", 0.9),
]

TARGET_CONDITIONS_B = [
    # name, P(B1=Y), P(B2=1), flip_var, description
    ("reversed",  0.3,  0.0, "B1", "ERM-adversarial: reversed spurious"),
    ("withheld",  0.9,  0.55, "B2", "withheld B2 direction (same B1 as sources)"),
    ("in_dist",   0.9,  0.0, "B1", "in-distribution (same as source, sanity check)"),
]


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -50, 50)))


def sample_domain(n, p_b1_eq_y, p_b2_eq_1, rng):
    C = rng.standard_normal(n)
    Y = (C > 0).astype(int)
    u1 = rng.random(n)
    B1 = np.where(Y == 1, (u1 < p_b1_eq_y).astype(int), (u1 >= p_b1_eq_y).astype(int))
    B2 = (rng.random(n) < p_b2_eq_1).astype(int)
    x_c  = C + rng.normal(0, SIGMA_C, n)
    x_s1 = MU * (2*B1 - 1) + rng.normal(0, SIGMA_S, n)
    x_s2 = MU * (2*B2 - 1) + rng.normal(0, SIGMA_S, n)
    return np.stack([x_c, x_s1, x_s2], axis=1), Y, C, B1, B2


def sample_nuisance_only_pairs(n_pairs, p_b1_eq_y, p_b2_eq_1, flip_var, rng):
    C = rng.standard_normal(n_pairs)
    Y = (C > 0).astype(int)
    u1 = rng.random(n_pairs)
    B1_a = np.where(Y==1, (u1 < p_b1_eq_y).astype(int), (u1 >= p_b1_eq_y).astype(int))
    B2_a = (rng.random(n_pairs) < p_b2_eq_1).astype(int)

    B1_p = (1 - B1_a) if flip_var == "B1" else B1_a.copy()
    B2_p = (1 - B2_a) if flip_var == "B2" else B2_a.copy()

    def make_X(B1, B2):
        x_c  = C + rng.normal(0, SIGMA_C, n_pairs)
        x_s1 = MU * (2*B1 - 1) + rng.normal(0, SIGMA_S, n_pairs)
        x_s2 = MU * (2*B2 - 1) + rng.normal(0, SIGMA_S, n_pairs)
        return np.stack([x_c, x_s1, x_s2], axis=1)

    return make_X(B1_a, B2_a), make_X(B1_p, B2_p), Y


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
            va = ((X_val @ w + b > 0) == Y_val).mean()
            if va > best_acc:
                best_acc, best_w, best_b = va, w.copy(), b
    return best_w, best_b


def predict_erm(w, b, X):
    return (X @ w + b > 0).astype(int)


class CGLinear:
    def __init__(self, d=3, T=0.5, lr=0.05, n_steps=1000, lambda_cf=0.5,
                 tau=0.05, seed=0, reencoding=True, n_donors=8, wd=1e-3):
        rng = np.random.default_rng(seed)
        self.w = rng.normal(0, 0.01, d)
        self.b = 0.0
        self.m_logit = rng.normal(0, 0.1, d)
        self.T = T; self.lr = lr; self.n_steps = n_steps
        self.lambda_cf = lambda_cf; self.tau = tau
        self.reencoding = reencoding; self.n_donors = n_donors; self.wd = wd
        self.rng = rng; self.d = d

    @property
    def m(self):
        return sigmoid(self.m_logit / self.T)

    def predict(self, X):
        return (self.m * X @ self.w + self.b > 0).astype(int)

    def fit(self, X_tr, Y_tr, X_val, Y_val):
        n = len(X_tr)
        best_acc = -1
        best_state = (self.w.copy(), self.b, self.m_logit.copy())
        bs = min(64, n)

        for step in range(self.n_steps):
            idx = self.rng.choice(n, bs, replace=False)
            Xb, Yb = X_tr[idx], Y_tr[idx]
            m = self.m
            c_anchor = m * Xb
            logit_f = c_anchor @ self.w + self.b
            p_f = sigmoid(logit_f)
            err_f = p_f - Yb

            grad_w = c_anchor.T @ err_f / bs + self.wd * self.w
            grad_b = err_f.mean()
            grad_m = ((err_f[:, None] * self.w[None, :]) * Xb).mean(axis=0) * (m*(1-m)/self.T)

            cf_gw = np.zeros_like(self.w); cf_gb = 0.0; cf_gm = np.zeros_like(self.m_logit)
            n_acc = 0

            if self.lambda_cf > 0:
                for i in range(bs):
                    xi, yi = Xb[i], Yb[i]
                    same = np.where(Y_tr == yi)[0]
                    if not len(same): continue
                    didx = self.rng.choice(same, min(self.n_donors, len(same)), replace=False)
                    Xd = X_tr[didx]
                    c_i = m * xi
                    v_ij = c_i + (1-m) * Xd
                    c_v = m * v_ij if self.reencoding else np.tile(c_i, (len(didx),1))
                    logit_v = c_v @ self.w + self.b
                    p1_v = (1 - 2*self.tau) * sigmoid(logit_v) + self.tau
                    gate = ((logit_v > 0).astype(int) == yi)
                    if not gate.any(): continue
                    p1_ref = float((1-2*self.tau)*sigmoid(float(c_i @ self.w + self.b))+self.tau)
                    p_ref = np.array([1-p1_ref, p1_ref])
                    eps = 1e-10
                    p1_a = p1_v[gate]
                    d_kl = -p_ref[1]/(p1_a+eps) + p_ref[0]/(1-p1_a+eps)
                    delta = d_kl * p1_a * (1-p1_a)
                    cv_a = c_v[gate]
                    cf_gw += cv_a.T @ delta / bs; cf_gb += delta.sum() / bs
                    if self.reencoding:
                        va = v_ij[gate]; Xda = Xd[gate]
                        d_cv = va + m*(xi - Xda)
                        cf_gm += ((delta[:, None] * d_cv * self.w[None,:]).mean(axis=0)
                                  * (m*(1-m)/self.T) / bs * gate.sum())
                    n_acc += gate.sum()

                if n_acc > 0:
                    sc = self.lambda_cf / max(n_acc,1)
                    grad_w += sc*cf_gw; grad_b += sc*cf_gb; grad_m += sc*cf_gm

            self.w -= self.lr*grad_w; self.b -= self.lr*grad_b; self.m_logit -= self.lr*grad_m

            if step % 100 == 0:
                va = (self.predict(X_val) == Y_val).mean()
                if va > best_acc:
                    best_acc = va
                    best_state = (self.w.copy(), self.b, self.m_logit.copy())

        self.w, self.b, self.m_logit = best_state


def err(pred, Y): return float((pred != Y).mean()) * 100
def flip(a, b):   return float((a != b).mean()) * 100


def main():
    print(f"[{TIMESTAMP}] SCM-B: High-Uniform-Spurious Sources")
    print("Source: P(B1=Y)=0.9 all three domains (uniform, no cross-domain diversity)")
    print("This is a diagnostic complement to z2Uv Q1 SCM, NOT the z2Uv Q1 protocol.")
    print()

    per_seed = defaultdict(lambda: defaultdict(list))
    raw_rows = []

    for seed in SEEDS:
        t0 = time.time()
        print(f"  Seed {seed} ...", flush=True)
        base_rng = np.random.default_rng(seed)

        Xs, Ys = [], []
        for dom_name, p_b1 in SOURCE_DOMAINS_B:
            dom_rng = np.random.default_rng(seed*1000 + hash(dom_name)%1000)
            X, Y, _, _, _ = sample_domain(N_SRC_PER_DOMAIN, p_b1, 0.0, dom_rng)
            Xs.append(X); Ys.append(Y)
        X_pool = np.vstack(Xs); Y_pool = np.concatenate(Ys)

        perm = base_rng.permutation(len(X_pool))
        n_val = int(len(X_pool)*N_VAL_FRAC)
        val_idx, tr_idx = perm[:n_val], perm[n_val:]
        X_tr, Y_tr = X_pool[tr_idx], Y_pool[tr_idx]
        X_val, Y_val = X_pool[val_idx], Y_pool[val_idx]

        erm_w, erm_b = train_erm(X_tr, Y_tr, X_val, Y_val, seed=seed)
        src_val_acc = float((predict_erm(erm_w, erm_b, X_val) == Y_val).mean())

        cg = CGLinear(d=3, T=0.5, lr=0.05, n_steps=1000, lambda_cf=0.5,
                      tau=0.05, seed=seed, reencoding=True)
        cg.fit(X_tr, Y_tr, X_val, Y_val)

        cg_nore = CGLinear(d=3, T=0.5, lr=0.05, n_steps=1000, lambda_cf=0.5,
                           tau=0.05, seed=seed, reencoding=False)
        cg_nore.fit(X_tr, Y_tr, X_val, Y_val)

        print(f"    Src val acc={src_val_acc:.3f} | "
              f"mask_cg={[round(x,3) for x in cg.m.tolist()]} | "
              f"mask_nore={[round(x,3) for x in cg_nore.m.tolist()]}")

        for (cname, p_b1_tgt, p_b2_tgt, flip_var, desc) in TARGET_CONDITIONS_B:
            er = np.random.default_rng(seed*10000 + hash(cname)%10000)
            X_tgt, Y_tgt, _, _, _ = sample_domain(N_EVAL_PAIRS, p_b1_tgt, p_b2_tgt, er)

            pe = predict_erm(erm_w, erm_b, X_tgt)
            pf = cg.predict(X_tgt)
            pn = cg_nore.predict(X_tgt)

            e_erm = err(pe, Y_tgt); e_full = err(pf, Y_tgt); e_nore = err(pn, Y_tgt)

            pr = np.random.default_rng(seed*20000 + hash(cname)%20000)
            Xa, Xp, Yp = sample_nuisance_only_pairs(N_EVAL_PAIRS, p_b1_tgt, p_b2_tgt, flip_var, pr)
            fl_e = flip(predict_erm(erm_w,erm_b,Xa), predict_erm(erm_w,erm_b,Xp))
            fl_f = flip(cg.predict(Xa), cg.predict(Xp))
            fl_n = flip(cg_nore.predict(Xa), cg_nore.predict(Xp))

            per_seed[cname]["err_erm"].append(e_erm)
            per_seed[cname]["err_full"].append(e_full)
            per_seed[cname]["err_nore"].append(e_nore)
            per_seed[cname]["flip_erm"].append(fl_e)
            per_seed[cname]["flip_full"].append(fl_f)
            per_seed[cname]["flip_nore"].append(fl_n)

            raw_rows.append({
                "experiment": "SCM_B",
                "seed": seed, "condition": cname, "description": desc,
                "src_val_acc_erm": round(src_val_acc, 4),
                "err_erm": round(e_erm,2), "err_full": round(e_full,2), "err_nore": round(e_nore,2),
                "flip_erm": round(fl_e,2), "flip_full": round(fl_f,2), "flip_nore": round(fl_n,2),
                "diff_full_vs_erm": round(e_full-e_erm,2), "diff_full_vs_nore": round(e_full-e_nore,2),
                "mask_cg_xc": round(float(cg.m[0]),4),
                "mask_cg_xs1": round(float(cg.m[1]),4),
                "mask_cg_xs2": round(float(cg.m[2]),4),
                "mask_nore_xc": round(float(cg_nore.m[0]),4),
                "mask_nore_xs1": round(float(cg_nore.m[1]),4),
                "mask_nore_xs2": round(float(cg_nore.m[2]),4),
            })

        print(f"    Runtime: {time.time()-t0:.1f}s")

    csv_path = os.path.join(OUT_DIR, f"scm_b_high_spurious_{TIMESTAMP}.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(raw_rows[0].keys()))
        writer.writeheader(); writer.writerows(raw_rows)
    print(f"\nRaw results: {csv_path}")

    print("\n" + "="*90)
    print("TABLE: SCM-B Results (High-Uniform Spurious; P(B1=Y)=0.9 all sources)")
    print("="*90)
    for (cname, _, _, _, desc) in TARGET_CONDITIONS_B:
        d = per_seed[cname]
        def ms(k): v=np.array(d[k]); return f"{v.mean():.1f}±{v.std():.1f}"
        print(f"\nCondition: {cname} — {desc}")
        print(f"  ERM error:    {ms('err_erm')}%  |  ERM flips:    {ms('flip_erm')}%")
        print(f"  No-reenc:     {ms('err_nore')}%  |  No-reenc flips: {ms('flip_nore')}%")
        print(f"  CausalGuard:  {ms('err_full')}%  |  CG flips:     {ms('flip_full')}%")
        diffs = np.array(d['diff_full_vs_erm'])
        print(f"  CG-ERM diff:  {diffs.mean():+.1f}pp (seeds: {[round(x,1) for x in diffs.tolist()]})")
        dnore = np.array(d['diff_full_vs_nore'])
        print(f"  CG-nore diff: {dnore.mean():+.1f}pp (seeds: {[round(x,1) for x in dnore.tolist()]})")

    return csv_path


if __name__ == "__main__":
    start = time.time()
    main()
    print(f"\nTotal wall time: {time.time()-start:.1f}s")
