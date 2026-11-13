# Complete Rebuttal — CausalGuard ICLR 2027
**Submission 61846**

This file combines all three individual reviewer replies for cross-checking.
The three standalone files (`z2Uv.md`, `itnv.md`, `bpmm.md`) are the paste-ready versions.

---

# Response to Reviewer z2Uv

Thank you for asking us to specify the targeted shift regime, test a controlled extrapolation case, and clarify the theoretical contribution.

**W1 — Targeted shifts and comparison with existing approaches**

CausalGuard targets label-preserving nuisance shifts: changes to S in Eq. (1) that preserve content C and label mechanism P(Y|C). Theorem 1 requires the target law to be close to a reweighted, semantically corrected version of the source-derived candidate law. A new nuisance direction outside that law can leave candidate KL low while target risk remains high. We will add a "Targeted shift family" paragraph at the start of Section 5 explicitly stating this scope.

IRM and V-REx can admit a shortcut that is uniformly predictive across all observed source environments. Causal Matching requires object-level correspondence annotations; CausalGuard constructs pairs endogenously via the compatibility gate. MixStyle mixes feature statistics without a compatibility screen, shared re-encoding path, or diversity-weighted donor policy; see W8 and Q2. Quantitative per-domain comparisons with ERM, SWAD, and MixStyle are in the response to itnv Q1. Matched MIRO, Causal Matching, and Causal Balancing reruns require the original code and datasets not present in this environment and remain open.

**W2 — Shortcut reinforcement (co-adaptation)**

This concern is correct and is acknowledged in Appendices B and E. Re-encoding forces candidates through the input-dependent mask and the shared classifier, removing the specific bypass-vacuity failure mode described in Proposition 2. It does not prevent the backbone and mask from jointly retaining a spurious source-stable feature. The Q1 SCM experiment directly tests this and is reported below.

**W3 — Bounded-loss assumption and theoretical contribution**

The theorem is conditional; this is stated explicitly throughout. With the probability floor p_Y ≥ τ (Eq. 3), the loss is bounded by log(1/τ) and its Lipschitz constant in predictive TV is 1/τ. For the 0/1 loss both constants are 1. The contribution is the decomposition: terms κ, ε, ρ, ξ, η correspond to the four algorithmic components (candidate reweighting, consistency optimization, factual shift, semantic filtering, coverage gap). Without re-encoding, ε ≡ 0 regardless of the learned partition (Proposition 2), making the theorem vacuously satisfied. With re-encoding, small ε has non-trivial implications. Appendix F gives the margin-dependent link to classification error. We will add a paragraph distinguishing the decomposition contribution from a distributional-robustness certificate.

**W4 — Reproducibility and tuning**

Section 5.1 reports ImageNet-pretrained ResNet-50, 224×224 inputs, five runs, source-only validation selection following DomainBed. The threshold sweep in Figure 3 is post-hoc; target accuracy is not used to select the operating point γ = 0.60 (Section 5.4). Raising γ to 0.90 increases label preservation from 96.8% to 98.5% while acceptance falls from 74.6% to 29.5% and coverage from 0.78 to 0.33 (Table 5). An anonymous code release is in preparation. We will add a hyperparameter appendix specifying all swept parameters, ranges, selection criterion, and final values.

**W5 — Realistic benchmarks**

Acknowledged. DomainNet, TerraIncognita, and WILDS remain open. The SCM experiment below tests extrapolation under a fixed label mechanism.

**W6 — Core contribution after qualifications**

Four concrete advances: (1) Re-encoding as an implementable architectural fix to bypass vacuity, with a formal statement in Proposition 2 and an empirical effect in Table 3 (disagreement 5.9% vs. 3.4%) and the per-domain PACS accuracy ablation in the response to bpmm W2 (+1.3 pp macro). (2) Compatibility gate filtering ≈25% of same-class donors (Table 3: acceptance 74.6%). (3) Donor policy increasing effective donors from 3.6 to 6.8 (Table 3). (4) Conditional theoretical decomposition mapping bound terms to auditable algorithmic quantities.

**Q1 — Trained SCM and controlled extrapolation**

*Note on the review text:* The pasted review text drops the expression after "Can you show a case where". The experiment below covers the visible requests (represented and withheld nuisance shifts). Any condition referenced in the missing clause is not claimed to have been tested.

**Feature and data-generating mechanism (documented):**

Label: Y = sign(C), C ~ N(0, 1). Features x = [x_c, x_s1, x_s2]:
- x_c = C + ε_c, ε_c ~ N(0, 0.25) — noisy observed content
- x_s1 = 1.5·(2B₁ − 1) + ε_s1, ε_s1 ~ N(0, 0.25) — nuisance from B₁
- x_s2 = 1.5·(2B₂ − 1) + ε_s2, ε_s2 ~ N(0, 0.25) — nuisance from B₂

B₁ shifts x_s1 by ±1.5 aligned/anti-aligned with Y. B₂ shifts x_s2 by ±1.5 independently. In source domains and the represented target, B₂ = 0 always (x_s2 fixed mean −1.5, with noise). In the withheld target, B₂ ~ Bernoulli(0.55) independent of Y.

*Withheld direction vs. appended-zero input:* x_s2 is present in all training feature vectors with non-zero variance (σ² = 0.25). A model that learns any non-zero weight for x_s2 will be sensitive to its variation at test time. An appended-zero input (x_s2 ≡ 0 in training) produces near-zero learned weight because the feature has zero training variance. Our withheld direction is strictly harder to control.

Source domains (equal weight): P(B₁=Y) ∈ {0.7, 0.8, 0.9}; B₂ = 0.
Represented target: P(B₁=Y) = 0.6, B₂ = 0.
Withheld target: P(B₁=Y) = 0.8, B₂ ~ Bernoulli(0.55) independent.

**Analytical conditional nuisance TV** (relative to equal-weight source mixture; distinct from η in Theorem 1):
- Represented (B₁): source P(B₁=1|Y=1) = 0.80; target 0.60. TV = ½(|0.80−0.60|+|0.20−0.40|) = **0.20**
- Withheld (B₂): source P(B₂=0|Y) = 1.00; target 0.45. TV = ½(|1.00−0.45|+|0.00−0.55|) = **0.55**

**Pair sampler:** C and Y fixed per pair; anchor draws B₁ (or B₂) from target distribution; perturbed member flips that bit; noise resampled independently per member.

**Results (5 seeds, 2000 pairs per condition; 3D linear SCM + logistic regression; source-only validation; all seeds reported; newly measured 2026-11-13):**

| Target condition | TV (analytic) | ERM error (%) | No re-enc error (%) | CausalGuard error (%) | ERM flips (%) | CG flips (%) | No re-enc flips (%) |
|---|---|---|---|---|---|---|---|
| Represented nuisance shift | 0.20 | 17.6 ± 1.0 | 17.7 ± 1.1 | 17.7 ± 1.1 | 40.5 ± 2.1 | 40.3 ± 2.0 | 40.3 ± 2.0 |
| Withheld nuisance direction | 0.55 | 11.1 ± 0.5 | 11.1 ± 0.5 | 11.1 ± 0.5 | 10.9 ± 0.8 | 10.9 ± 0.6 | 10.9 ± 0.6 |

Per-seed CG−ERM differences (pp): Represented [+0.70, +0.10, +0.95, −0.10, −1.25], mean +0.08. Withheld [−0.05, +0.20, +0.40, −0.20, −0.05], mean +0.06. Per-seed CG−no-reenc: all ≤ 0.05 pp, mean +0.01 pp both conditions.

Mask weights (mean, 5 seeds): x_c ≈ 0.89, x_s1 ≈ 0.71, x_s2 ≈ 0.52. CG and no-reenc masks differ by < 0.002 in all coordinates, confirming that the consistency loss provides negligible additional mask gradient in the linear regime.

All three methods perform essentially identically in this 3D linear SCM (pairwise differences ≤ 0.1 pp on average). This is an honest result consistent with the paper's stated scope. In the linear regime, source domain diversity (P(B₁=Y) ∈ {0.7, 0.8, 0.9}) provides sufficient cross-domain inconsistency signal for the supervised loss alone to partially recover the content feature. CausalGuard's theoretical advantage is expected in deep nonlinear architectures where the supervised loss alone cannot disentangle source-specific shortcuts.

We also ran SCM-B with all three sources at P(B₁=Y) = 0.9 (uniform high spurious — Appendix E ambiguous case). On an ERM-adversarial reversed target (P(B₁=Y) = 0.3), ERM achieves 38.4 ± 1.3% error and CausalGuard 39.4 ± 1.2% (CG marginally worse, mean CG−ERM = +1.0 pp). CG and no-reenc remain identical (0.0 pp). This confirms the stated limitation: when source confounding is complete, neither supervised nor consistency loss can recover the causal feature (Appendix E). Raw data: `results/rebuttal/scm_b_high_spurious_20261113_023734.csv`.

**W7:** The withheld-direction condition tests a B₂ direction outside source candidate support. Error does not increase catastrophically because B₂ is independent of Y at the withheld target.

**W8 / Q2:** MixStyle mixes feature statistics without re-encoding, compatibility screen, or diversity constraint. Without re-encoding, consistency loss ≡ 0 (Proposition 2). Structural differences: (1) re-encoding, (2) compatibility gate (74.6% acceptance vs. 100%), (3) diversity constraint (effective donors 3.6→6.8), (4) KL consistency vs. classification loss on mixed features. Per-domain comparison: itnv Q1.

---

# Response to Reviewer itnv

Thank you for requesting a closer baseline, individual domain results, broader shift evidence, and measured computational cost.

**Q1 — Direct competitors**

Protocol: same ImageNet-pretrained ResNet-50, held-out-domain DomainBed splits, source-only validation, training budget. 20 trials per method; selection by mean source-validation accuracy. MixStyle: official implementation, α swept on source validation. ERM and SWAD macro averages match Table 2. Matched MIRO, Causal Matching, and Causal Balancing reruns remain open; MIRO uses a frozen pretrained reference beyond ImageNet initialization.

**PACS (mean ± SD, 5 runs):**

| Domain | ERM (%) | SWAD (%) | MixStyle (%) | CausalGuard (%) | Δ vs SWAD (pp) |
|---|---|---|---|---|---|
| Art Painting | 83.8 ± 0.9 | 86.3 ± 0.8 | 86.8 ± 0.8 | 88.7 ± 0.7 | +2.4 |
| Cartoon | 81.0 ± 1.0 | 84.9 ± 0.9 | 85.8 ± 0.9 | 86.9 ± 0.8 | +2.0 |
| Photo | 96.2 ± 0.4 | 97.6 ± 0.4 | 97.2 ± 0.4 | 97.4 ± 0.3 | −0.2 |
| Sketch | 83.8 ± 1.1 | 83.6 ± 1.0 | 86.0 ± 0.9 | 88.2 ± 0.9 | +4.6 |
| **Macro** | **86.2 ± 0.7** | **88.1 ± 0.6** | **88.9 ± 0.6** | **90.3 ± 0.5** | **+2.2** |

**VLCS:**

| Domain | ERM (%) | SWAD (%) | MixStyle (%) | CausalGuard (%) | Δ vs SWAD (pp) |
|---|---|---|---|---|---|
| VOC2007 | 74.8 ± 0.9 | 75.8 ± 0.8 | 76.9 ± 0.8 | 77.9 ± 0.7 | +2.1 |
| LabelMe | 65.3 ± 1.0 | 67.1 ± 1.0 | 68.1 ± 0.9 | 68.8 ± 0.9 | +1.7 |
| Caltech101 | 96.1 ± 0.5 | 97.4 ± 0.4 | 97.1 ± 0.4 | 97.2 ± 0.3 | −0.2 |
| SUN09 | 77.8 ± 0.9 | 78.1 ± 0.8 | 79.4 ± 0.7 | 80.9 ± 0.6 | +2.8 |
| **Macro** | **78.5 ± 0.6** | **79.6 ± 0.5** | **80.4 ± 0.5** | **81.2 ± 0.4** | **+1.6** |

**Office-Home:**

| Domain | ERM (%) | SWAD (%) | MixStyle (%) | CausalGuard (%) | Δ vs SWAD (pp) |
|---|---|---|---|---|---|
| Art | 63.4 ± 1.0 | 66.2 ± 0.9 | 68.0 ± 0.8 | 69.4 ± 0.7 | +3.2 |
| Clipart | 55.1 ± 1.1 | 57.8 ± 1.0 | 59.4 ± 0.9 | 59.8 ± 0.8 | +2.0 |
| Product | 81.5 ± 0.7 | 83.0 ± 0.6 | 83.5 ± 0.6 | 84.3 ± 0.5 | +1.3 |
| Real World | 87.2 ± 0.7 | 88.2 ± 0.6 | 88.5 ± 0.5 | 88.9 ± 0.4 | +0.7 |
| **Macro** | **71.8 ± 0.8** | **73.8 ± 0.7** | **74.9 ± 0.6** | **75.6 ± 0.5** | **+1.8** |

CausalGuard trails SWAD on PACS Photo (−0.2 pp) and VLCS Caltech101 (−0.2 pp); all other per-domain conditions show gains.

**Q2:** DomainNet, TerraIncognita, iWildCam remain open. We will add a statement in Section 5 that submitted benchmarks cover style and rendering shifts only.

**Q3:** Per-domain results in Q1. Domain-macro follows Appendix J: D⁻¹ Σ_d a_{bdr} per run, mean and SD over 5 runs.

**Q4:** Source-validation risk for checkpoint selection only. Frozen audit observables (acceptance, donor concentration, disagreement) do not use target information. κ, ρ, η remain unknown for unseen target. We will add a "Practical guide to the theorem" summary box.

**Q5 — Measured computational overhead** (RTX 4090, FP16, batch 32, 5,000 steps):

| Resource metric | ERM | SWAD | CausalGuard |
|---|---|---|---|
| Training wall-clock per held-out-domain run (h) | 2.10 ± 0.08 | 2.80 ± 0.11 | 4.90 ± 0.19 |
| Peak training GPU memory (GB) | 8.4 ± 0.1 | 8.7 ± 0.1 | 14.2 ± 0.3 |
| Batch-1 inference latency (ms/image) | 7.8 ± 0.2 | 7.8 ± 0.2 | 8.6 ± 0.3 |
| Batch-32 inference throughput (images/s) | 405 ± 8 | 403 ± 8 | 371 ± 7 |

1.75× training time vs. SWAD; 1.63× peak memory; +0.8 ms batch-1 latency; −32 images/s throughput. Donor construction is training-only; inference uses backbone, mask, and classifier only.

---

# Response to Reviewer bpmm

Thank you for identifying the presentation issues and asking for an accuracy ablation of re-encoding.

**W1 — Definitions, related work, and figures**

We correct: (1) b₀ (mask budget scalar) missing from Table 4 — will add and audit all b/b₀ occurrences. (2) w overloading — will introduce θ_cls for classifier parameters in Table 4. (3) Define c (retained), s (replaceable), g(c) (classifier), anchor, donor, compatibility filter explicitly before Eq. (1). (4) Figure 1: increase font size, add legend (solid = computational sequence; dashed = factual/candidate). (5) Figure 3: explicit y-axis label on "Mean Acc." panel. (6) Add DomainBed and shortcut-learning citations; describe comparator objectives in Related Work.

**W2 — Accuracy and known-nuisance tests**

*Ablation path:* In the no-reenc variant, the candidate v_ij passes through the anchor's fixed soft mask m(u_i) and the shared classifier. The consistency loss compares factual to candidate distributions under this shared mask. Table 3 and the accuracy ablation below use the same candidate pathway.

**PACS per-domain: full CausalGuard vs. no-re-encoding (5 runs; Δ = CG minus no-reenc):**

| Held-out domain | No re-encoding (%) | CausalGuard (%) | Δ (pp) |
|---|---|---|---|
| Art Painting | 87.2 ± 0.8 | 88.7 ± 0.7 | +1.5 |
| Cartoon | 85.3 ± 0.9 | 86.9 ± 0.8 | +1.6 |
| Photo | 97.5 ± 0.3 | 97.4 ± 0.3 | −0.1 |
| Sketch | 86.0 ± 1.0 | 88.2 ± 0.9 | +2.2 |
| **Macro** | **89.0 ± 0.6** | **90.3 ± 0.5** | **+1.3** |

Macro gain from re-encoding: 1.3 pp. Gains on Art Painting, Cartoon, Sketch; −0.1 pp on Photo (near-saturation).

Known-nuisance flip tests (3D linear SCM, 5 seeds, 2000 pairs, newly measured): flip rates 40.3–40.5% (represented, TV=0.20) and 10.9% (withheld, TV=0.55), all essentially equal across ERM, no-reenc, and CausalGuard. Re-encoding produces no measurable flip-rate change in the linear setting. Raw data: `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`.

**W3:** The mask selects for source-stability, not causal relevance. Linear SCM mask weights (5 seeds): x_c ≈ 0.89, x_s1 ≈ 0.71, x_s2 ≈ 0.52 — directionally correct but not cleanly separated. Uniform-high-spurious diagnostic increases x_s1 weight to ≈ 0.81 (supervised loss cannot separate; Appendix E). PACS +1.3 pp gain suggests deep model benefits from the consistency loss that the linear regime does not. Latent factor recovery remains open.

**Q1:** PACS (style), VLCS (photography conditions), Office-Home (object-recognition domains). DomainBed protocol for comparable literature. Section 5 rationale paragraph to be added.

**Q2:** Coverage = entropy-based effective rank of G̃ (Appendix G, Eq. 29); measures directional span, not target support. Table 5 caption and Appendix G already state this. Will add definition box in main text.
