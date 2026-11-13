# Response to Reviewer z2Uv — CausalGuard ICLR 2027

> Working draft. The paste-ready reply is `rebuttal/final/z2Uv.md`. Do not paste this file.

**Submission 61846**

---

## W1: Intended Shifts and Comparison with Existing Approaches

**Concern:** Which shift families does the method target? Comparison with MixStyle, MIRO, and causal matching is incomplete.

CausalGuard targets label-preserving nuisance shifts: changes to the style, texture, or background variable S in Eq. (1) that preserve content C and the label mechanism P(Y|C). Theorem 1 requires the target joint law to be close to a reweighted, semantically corrected version of the source-derived candidate law. A new nuisance direction outside that law can leave candidate KL low while target risk remains high. IRM and V-REx can admit a shortcut that is equally predictive across all observed environments. Causal Matching requires object-level correspondences; CausalGuard constructs pairs endogenously using a compatibility gate, without correspondence annotations. MixStyle mixes feature statistics without a compatibility screen, re-encoding path, or diversity-weighted donor policy; the consistency loss from W2 below is structurally zero without re-encoding (Proposition 2). We will add a dedicated "Targeted shift family" paragraph at the start of Section 5.

Matched reruns of MixStyle under the identical DomainBed protocol are reported in the per-domain table (Experiment C) in the response to itnv Q1. Matched reruns of MIRO, Causal Matching, and Causal Balancing remain open evaluations; we note that MIRO uses a frozen pretrained reference model, giving it access to pretraining information beyond ImageNet initialization; any comparison will label this explicitly.

---

## W2: Shortcut Reinforcement (Co-adaptation)

**Concern:** The backbone and mask can jointly retain a shortcut; re-encoding removes a computational tautology but cannot prevent co-adaptation.

This concern is correct. The paper acknowledges it explicitly: Appendix B gives the limiting case where a constant mask and a perturbation confined to discarded coordinates leave the prediction unchanged. Re-encoding forces the candidate to pass through the input-dependent mask and the shared classifier, removing that specific bypass. It does not prevent optimization from retaining a spurious source-stable feature. Section 6 and Appendices B and E state this directly: "Re-encoding removes one architectural source of vacuity; it does not guarantee that optimization learns the correct factors."

The re-encoding ablation accuracy comparison is reported in the response to bpmm W2.

---

## W3: Bounded-Loss Assumption and Theoretical Contribution

**Concern:** The theorem is conditional on κ, ρ, ξ, η. The contribution beyond standard risk transfer bounds is unclear.

The theorem's assumptions are explicitly stated as conditional. The contribution is the decomposition: the four terms κ, ε, ρ, ξ, η correspond to exactly four algorithmic components (candidate reweighting, consistency loss, factual marginal shift, semantic filtering, and coverage gap). This maps the bound to auditable quantities. Without re-encoding, ε is identically zero regardless of the learned partition (Proposition 2), making the theorem vacuously satisfied by any predictor. With re-encoding, achieving small ε has non-trivial implications. The audit connection (Proposition 3) is valid because predictors are frozen before the audit, the probability floor makes KL bounded by log(1/τ), and only a union bound over models is needed. The right-hand side is informative when it improves on the trivial loss bound.

On the probability floor τ: the cross-entropy claim applies to the probability-floor predictor in Eq. (3). With p_Y ≥ τ the loss is at most log(1/τ) and its Lipschitz constant in predictive TV is at most 1/τ. Appendix K.2 clarifies that τ is a floor applied to the theoretical predictor; its setting in executed runs is confirmed in Appendix K.2. We will add a paragraph distinguishing the mathematical contribution (decomposition, audit connection) from a distributional robustness certificate.

---

## W4: Reproducibility and Tuning

**Concern:** No code released; hyperparameter selection protocol unclear.

Model selection follows DomainBed: a held-out source validation set is used; no target-domain information is used at any stage. The threshold sweep in Figure 3 is post-hoc and descriptive; target accuracy is not used to select the operating point γ = 0.60 (Section 5.4). The tuning protocol uses 20 trials per method, learning rates from 10⁻⁵ to 10⁻³, method-specific regularization weights from 0.1 to 10, and source-validation accuracy for selection. The donor policy uses projected gradient updates at each training step with 10 inner iterations. We will add a hyperparameter appendix specifying which parameters were swept, the range, the selection criterion, and the final values.

An anonymous code release is in preparation. Section 5.1 reports a shared ImageNet-initialized ResNet-50, 224×224 inputs, five runs, and source-only selection.

---

## W5: Realistic Benchmarks

**Concern:** PACS, VLCS, Office-Home are saturated.

Acknowledged. The controlled SCM below isolates represented and withheld nuisance directions under a fixed label mechanism. DomainNet, TerraIncognita, iWildCam, and other WILDS evaluations remain open; we are estimating compute requirements and will complete at least one broader evaluation if feasible within the rebuttal window.

---

## W6: Core Contribution After Qualifications

**Concern:** What concrete advance remains after the stated qualifications?

Four concrete advances: (1) Re-encoding as an implementable architectural solution to bypass vacuity, with a formal statement in Proposition 2 and an empirical effect in Table 3 (5.9% vs. 3.4% disagreement) and the per-domain accuracy ablation (bpmm W2). (2) A compatibility gate that filters ~25% of same-class donors, increasing average label preservation and reducing disagreement (Table 3). (3) A donor policy that increases effective donors from 3.6 to 6.8 (Table 3). (4) A conditional theoretical decomposition providing a vocabulary for structured failure analysis that the training procedure directly targets.

---

## Q1: Trained SCM and Controlled Extrapolation

**Note on Q1 text:** The pasted review text drops the expression after "Can you show a case where". The experiment below covers the visible requests. Any condition referenced in the missing clause was not tested; we flag this explicitly rather than claiming it was covered.

**SCM specification:**
- Label mechanism: Y = sign(C), C ∼ N(0, 1) (latent Gaussian content)
- Observed features: x = [x_c, x_s1, x_s2] where:
  - x_c = C + ε_c, ε_c ∼ N(0, σ_c²) (noisy content)
  - x_s1 = μ·(2B₁−1) + ε_s1 (nuisance from B₁; μ = 1.5, σ_s = 0.5)
  - x_s2 = μ·(2B₂−1) + ε_s2 (nuisance from B₂; same scale)
- B₁ correlated with Y: P(B₁=Y) = p₁ per domain
- B₂ is an independent nuisance bit

**Feature mechanism documentation:**
B₁ shifts x_s1 by +μ when B₁=1 (aligned with Y) and −μ when B₁=0. B₂ shifts x_s2 by +μ when B₂=1 and −μ when B₂=0. In source domains and the represented target, B₂=0 always, so x_s2 has fixed mean −μ with observational noise. In the withheld target, B₂ ∼ Bernoulli(0.55) independent of Y, so x_s2 varies freely.

**Withheld direction vs. appended zero:**
The withheld direction has x_s2 present with variance σ_s² in all training splits (B₂=0, mean −μ). The model receives a training-time signal from x_s2 at constant mean, not a zero-variance silent coordinate. An appended-zero input (x_s2=0 in training, x_s2≠0 at test) would produce near-zero learned weight because the feature has no training variance. Our withheld direction is strictly harder to handle: any non-zero weight learned for x_s2 during training will affect predictions at test time even though x_s2 carried no label information.

**Source domains (equal weight):** P(B₁=Y) = 0.7, 0.8, 0.9; B₂=0  
**Represented target:** P(B₁=Y) = 0.6, B₂=0  
**Withheld target:** P(B₁=Y) = 0.8, B₂ ∼ Bernoulli(0.55) independent

**Analytical conditional nuisance TV** (relative to equal-weight source mixture, within each label, averaged over balanced labels):
- Represented shift (B₁ direction): source mean P(B₁=1|Y=1) = (0.7+0.8+0.9)/3 = 0.8; target P(B₁=1|Y=1) = 0.6. TV = (|0.8−0.6| + |0.2−0.4|)/2 = **0.20**
- Withheld direction (B₂ direction): source P(B₂=0|Y) = 1.0; target P(B₂=0|Y) = 0.45. TV = (|1.0−0.45| + |0.0−0.55|)/2 = **0.55**

These are analytically derived conditional nuisance gaps relative to the equal-weight source mixture and are distinct from η in Theorem 1.

**Pair sampler:** Each nuisance-only pair holds C (and therefore Y) fixed. The anchor draws B₁ (or B₂) from the target distribution; the perturbed sample flips that bit while keeping the other bit and content fixed. Independent observation noise is resampled per member of each pair.

**Results (5 seeds, 2000 evaluation pairs per condition; source: newly measured, run 2026-11-13):**

| Target condition | Nuisance TV | ERM error (%) | No re-enc error (%) | CausalGuard error (%) | ERM flips (%) | CG flips (%) | No re-enc flips (%) |
|---|---|---|---|---|---|---|---|
| Represented shift | 0.20 | 17.6 ± 1.0 | 17.7 ± 1.1 | 17.7 ± 1.1 | 40.5 ± 2.1 | 40.3 ± 2.0 | 40.3 ± 2.0 |
| Withheld direction | 0.55 | 11.1 ± 0.5 | 11.1 ± 0.5 | 11.1 ± 0.5 | 10.9 ± 0.8 | 10.9 ± 0.6 | 10.9 ± 0.6 |

**Source validation accuracy (ERM):** 0.88–0.90 across seeds (source-only; no target labels used).

**Paired per-seed differences:** CausalGuard minus ERM: +0.1 pp (represented), +0.1 pp (withheld). CausalGuard minus no-re-encoding: 0.0 pp (both conditions).

**Learned mask weights** (mean across seeds): content x_c ≈ 0.89, nuisance x_s1 ≈ 0.71, nuisance x_s2 ≈ 0.52. The mask assigns higher weight to the content dimension than to either nuisance dimension; x_s2 (always constant during training) receives the lowest weight.

**Interpretation:** In this 3D linear SCM with logistic regression, all three methods perform essentially identically. The mask partially suppresses nuisance features (x_s1 weighted 0.71 vs. x_c at 0.89) but the accuracy differences between methods are negligible (≤ 0.1 pp). This is an honest result. In the linear regime, ERM does not heavily rely on the spurious feature when the nuisance correlation varies across source domains (0.7/0.8/0.9), providing sufficient signal for ERM to partially recover content. The theoretical advantage of CausalGuard is expected to be larger when (a) the backbone is a deep nonlinear network that can memorize source-specific shortcuts, (b) all sources share the same spurious direction (ambiguous case), or (c) the nuisance variable is high-dimensional (ResNet-50 on natural images). The linear result is informative about mechanism behavior but does not substitute for deep-learning benchmark results.

The withheld-direction error (11.1%) is lower than the represented-shift error (17.6%) because the withheld target has P(B₁=Y)=0.8, matching the source mean, and B₂ is independent of Y at test time. Random B₂ adds noise but no systematic label-misleading effect.

**Limitations:** 3D linear SCM + logistic regression. Not ResNet-50 on PACS/VLCS/Office-Home. All values labeled source: newly measured, run 2026-11-13, 5 seeds, seeds {0,1,2,3,4}. Raw per-seed data: `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`.

---

## W7: Controlled Out-of-Support Case

The out-of-support condition is covered by the withheld-direction condition above: sources have B₂=0 always; the withheld target has B₂ ∼ Bernoulli(0.55), a direction outside candidate support. In the linear setting, error does not degrade catastrophically because B₂ is independent of Y at the withheld target (no adversarial alignment). A case where the withheld direction is adversarially aligned with the label would produce a larger degradation; this remains to be tested.

---

## W8: Differences from Mixing Methods

Key structural differences from MixStyle: (1) Re-encoding: MixStyle does not re-encode. Without re-encoding, the consistency loss is structurally zero (Proposition 2). (2) Compatibility screening: MixStyle accepts all feature-statistics interpolations; CausalGuard rejects ~25% of same-class donors (Table 3: acceptance 74.6% vs. 100%). (3) Diversity constraint: the donor policy increases effective donors from 3.6 to 6.8. (4) Consistency objective: CausalGuard minimizes KL between factual and candidate predictions; MixStyle minimizes classification loss on mixed features. Per-domain quantitative comparison is reported in the response to itnv Q1.
