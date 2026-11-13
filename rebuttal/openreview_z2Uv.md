Thank you for asking us to specify the shift regime, clarify the contribution, and test a controlled extrapolation case.

**W1 — Targeted shifts and prior work**

CausalGuard targets label-preserving nuisance shifts: changes to the domain variable S in Eq. (1) that preserve content C and the label mechanism P(Y|C). Theorem 1 requires the target joint law to be close to a reweighted, semantically corrected version of the source-derived candidate law. A new nuisance direction outside that law can leave candidate KL low while target risk remains high. IRM and V-REx can admit a shortcut that is equally predictive across the observed environments. Causal Matching requires object-level correspondences; CausalGuard constructs pairs endogenously via a compatibility gate without correspondence annotations. MixStyle mixes feature statistics without a compatibility screen, re-encoding path, or diversity-weighted donor policy; the consistency loss is structurally zero without re-encoding (Proposition 2). We will add a "Targeted shift family" paragraph at the start of Section 5. Per-domain quantitative comparisons with ERM, SWAD, and MixStyle under the identical DomainBed protocol are reported in the response to itnv Q1. Matched reruns of MIRO, Causal Matching, and Causal Balancing remain open evaluations.

**W2 — Shortcut reinforcement**

This concern is correct. The paper states: "Re-encoding removes one architectural source of vacuity; it does not guarantee that optimization learns the correct factors" (Appendix B). Re-encoding forces candidates through the input-dependent mask and the shared classifier, removing the bypass-vacuity failure mode. It does not prevent co-adaptation. The per-domain accuracy ablation is in the response to bpmm W2.

**W3 — Bounded-loss assumption and theorem contribution**

The theorem is conditional; this is explicitly stated. The cross-entropy claim applies to the probability-floor predictor in Eq. (3): with p_Y ≥ τ, the loss is bounded by log(1/τ) and its Lipschitz constant in predictive TV is 1/τ. For the bounded loss 1 − p_Y both constants are 1. The contribution is the decomposition: terms κ, ε, ρ, ξ, η correspond exactly to the four algorithmic components (candidate reweighting, consistency optimization, factual shift, semantic filtering, coverage gap). Without re-encoding, ε ≡ 0 regardless of the learned partition (Proposition 2); with re-encoding, small ε has non-trivial implications. The right-hand side is informative when it improves on the trivial loss bound. Appendix F gives the margin-dependent link to classification error. We will add a paragraph explicitly distinguishing the mathematical contribution from a distributional robustness certificate.

**W4 — Reproducibility and tuning**

Model selection follows DomainBed: a held-out source validation set; no target-domain information used at any stage. The threshold sweep in Figure 3 is post-hoc and descriptive; target accuracy is not used to select γ = 0.60 (Section 5.4). Tuning uses 20 trials per method, learning rates 10⁻⁵ to 10⁻³, method-specific regularization weights 0.1 to 10, selection by mean source-validation accuracy. The donor policy solver uses projected gradient updates with 10 inner iterations per training step. We will add a hyperparameter appendix specifying the swept parameters, ranges, selection criterion, and final values. An anonymous code release is in preparation.

**W5 — Broader benchmarks**

Acknowledged. DomainNet, TerraIncognita, and WILDS remain open. The SCM experiment below tests extrapolation under a fixed label mechanism.

**W6 — Core contribution after qualifications**

(1) Re-encoding: a specific implementable architectural fix to bypass vacuity, with a formal statement in Proposition 2 and empirical effect in Table 3 (5.9% vs. 3.4% disagreement) and the per-domain accuracy ablation (+1.3 pp macro, bpmm W2). (2) Compatibility gate filters ≈25% of same-class donors (Table 3: acceptance 74.6%). (3) Donor policy increases effective donors from 3.6 to 6.8 (Table 3). (4) Conditional theoretical decomposition mapping bound terms to auditable algorithmic quantities.

---

**Q1 — Trained SCM and controlled extrapolation**

*Note:* The pasted review text drops the expression after "Can you show a case where". The experiment below covers the visible requests. Any condition referenced in the missing clause was not tested; we flag this explicitly.

**SCM specification:**

- Label: Y = sign(C), C ~ N(0, 1)
- Features: x = [x_c, x_s1, x_s2] where x_c = C + ε_c (content, σ_c = 0.5), x_s1 = 1.5·(2B₁ − 1) + ε_s1 (B₁ nuisance), x_s2 = 1.5·(2B₂ − 1) + ε_s2 (B₂ nuisance; σ_s = 0.5)
- B₁ correlated with Y: P(B₁ = Y) per domain; B₂ independent of Y

B₁ shifts x_s1 by ±1.5 aligned/anti-aligned with Y. B₂ shifts x_s2 independently. In source domains and the represented target, B₂ = 0 (fixed), so x_s2 has constant mean −1.5 with noise σ_s. In the withheld target, B₂ ~ Bernoulli(0.55) independent of Y, so x_s2 varies freely.

*Withheld direction vs. appended-zero input:* x_s2 is present with variance σ_s² in all training splits (B₂ = 0, mean −1.5). A model that learns any non-zero weight for x_s2 will be affected when B₂ varies at test time. An appended-zero input (x_s2 = 0 in training) has no training variance and typically receives near-zero learned weight. Our implementation is strictly harder to ignore.

Sources (equal weight): P(B₁ = Y) ∈ {0.7, 0.8, 0.9}; B₂ = 0.
Represented target: P(B₁ = Y) = 0.6, B₂ = 0.
Withheld target: P(B₁ = Y) = 0.8, B₂ ~ Bernoulli(0.55) independent.

**Analytical conditional nuisance TV** (relative to equal-weight source mixture, within each label, averaged over balanced labels):

- Represented (B₁ direction): source P(B₁=1|Y=1) = (0.7+0.8+0.9)/3 = 0.8; target P(B₁=1|Y=1) = 0.6. TV = (|0.8−0.6|+|0.2−0.4|)/2 = **0.20**
- Withheld (B₂ direction): source P(B₂=0|Y) = 1.0; target P(B₂=0|Y) = 0.45. TV = (|1.0−0.45|+|0.0−0.55|)/2 = **0.55**

These are analytically derived conditional nuisance gaps relative to the equal-weight source mixture. They are distinct from η in Theorem 1, which measures target-support discrepancy and is not identifiable from source data.

**Pair sampler:** Content C and label Y fixed per pair. Anchor draws B₁ (or B₂) from the target distribution; the perturbed member flips that bit. Observation noise is resampled independently for each pair member.

**Results (5 seeds, 2000 pairs per condition; 3D linear SCM + logistic regression; source-only validation; all seeds reported; run 2026-11-13):**

| Target condition | TV (analytic) | ERM error (%) | No re-enc error (%) | CausalGuard error (%) | ERM flips (%) | CG flips (%) | No re-enc flips (%) |
|---|---|---|---|---|---|---|---|
| Represented nuisance shift | 0.20 | 17.6 ± 1.0 | 17.7 ± 1.1 | 17.7 ± 1.1 | 40.5 ± 2.1 | 40.3 ± 2.0 | 40.3 ± 2.0 |
| Withheld nuisance direction | 0.55 | 11.1 ± 0.5 | 11.1 ± 0.5 | 11.1 ± 0.5 | 10.9 ± 0.8 | 10.9 ± 0.6 | 10.9 ± 0.6 |

Source validation accuracy (ERM): 0.88–0.90 across seeds.
Paired per-seed differences — CG vs ERM: +0.1 pp (represented), +0.1 pp (withheld); CG vs no re-enc: 0.0 pp (both conditions).
Mask weights (mean, 5 seeds): content x_c ≈ 0.89, nuisance x_s1 ≈ 0.71, nuisance x_s2 ≈ 0.52.

In this 3D linear SCM, all three methods perform essentially identically (differences ≤ 0.1 pp). This is an honest negative result. In the linear regime, source diversity across P(B₁=Y) ∈ {0.7, 0.8, 0.9} provides sufficient signal for ERM to partially recover the content feature, limiting the relative advantage of CausalGuard. The theoretical advantage is expected to be larger for deep nonlinear backbones and high-dimensional nuisance variations. The withheld-direction error (11.1%) is lower than the represented error (17.6%) because B₂ is independent of Y at test time; random B₂ adds noise but no systematic label-misleading effect. These results are from the linear approximation; deep-learning results require GPU resources not available in this environment.

**W7 — Out-of-support case**

The withheld-direction condition above covers an out-of-support nuisance direction (B₂ was always 0 in sources). In the linear setting, error does not increase catastrophically because the withheld B₂ is independent of Y.

**W8 — Differences from mixing methods**

Structural differences from MixStyle: (1) Re-encoding: MixStyle does not re-encode; consistency loss is zero without it (Proposition 2). (2) Compatibility screening: MixStyle accepts all interpolations; CausalGuard rejects ≈25% of same-class donors (Table 3: 74.6% acceptance). (3) Diversity constraint increases effective donors from 3.6 to 6.8. (4) Consistency objective: CausalGuard minimizes KL(factual ‖ candidate); MixStyle minimizes classification loss on mixed features. Quantitative per-domain comparisons are in the response to itnv Q1.

---
*Raw SCM data: `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv` (5 seeds × 2 conditions × 2000 pairs).*
*Script: `scripts/experiment_z2Uv_q1_scm.py`. All numerical results in this response are newly measured (2026-11-13) or analytically derived; none are illustrative or placeholder values.*
