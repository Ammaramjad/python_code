# Combined rebuttal

Regenerated from `rebuttal/final/z2Uv.md`, `rebuttal/final/itnv.md`, and `rebuttal/final/bpmm.md`. Paste each reviewer file as its own OpenReview comment.

---

## Reviewer z2Uv

Source: `rebuttal/final/z2Uv.md`

Thank you for asking us to specify the targeted shift regime, test a controlled extrapolation case, and clarify the theoretical contribution.

---

**W1 — Targeted shifts and comparison with existing approaches**

CausalGuard targets label-preserving nuisance shifts: changes to S in Eq. (1) that preserve content C and label mechanism P(Y|C). Theorem 1 requires the target law to be close to a reweighted, semantically corrected version of the source-derived candidate law. A new nuisance direction outside that law can leave candidate KL low while target risk remains high. We will add a "Targeted shift family" paragraph at the start of Section 5 explicitly stating this scope.

IRM and V-REx can admit a shortcut that is uniformly predictive across all observed source environments. Causal Matching requires object-level correspondence annotations; CausalGuard constructs pairs endogenously via the compatibility gate. MixStyle mixes feature statistics without a compatibility screen, shared re-encoding path, or diversity-weighted donor policy; see W8 and Q2. A matched MixStyle comparison on PACS, VLCS, and Office-Home has not been run. Matched comparisons with MIRO, Causal Matching, and Causal Balancing have not been run either.

**W2 — Shortcut reinforcement (co-adaptation)**

This concern is correct and is acknowledged in Appendices B and E. Re-encoding forces candidates through the input-dependent mask and the shared classifier, removing the specific bypass-vacuity failure mode described in Proposition 2. It does not prevent the backbone and mask from jointly retaining a spurious source-stable feature. The linear SCM below is a controlled test of that retention. It is not a ResNet result.

**W3 — Bounded-loss assumption and theoretical contribution**

The theorem is conditional; this is stated explicitly throughout. No numerical probability floor was recovered for the ResNet-50 runs. This repository contains no original experiment config, training log, or checkpoint metadata that records τ. Appendix K.2 of the submitted manuscript says the hypothetical probability floor is valid only for class count C < 100 and is not an asserted setting of the benchmark runs.

Eq. (3) writes the C-class floor p(u) = (1 − Cτ) softmax(h_ψ(c_ϕ(u))) + τ·1. The linear SCM implements the two-class case of that formula, (1 − 2τ) sigmoid(logit) + τ, which is Eq. (3) when C = 2 and the positive-class probability is a sigmoid. The constant used by that script is not a recovered benchmark setting, and this reply does not state a numerical value of τ.

For a predictor satisfying p_y ≥ τ, cross-entropy is bounded by log(1/τ) and is 1/τ-Lipschitz in predictive total variation. For the 0/1 loss both constants are 1. The contribution is the decomposition: the terms κ, ε, ρ, ξ, and η correspond to candidate reweighting, consistency optimization, the factual shift, semantic filtering, and the coverage gap. In the linear ablation, the unchanged-anchor bypass repeats the anchor's retained features for every donor, so the consistency term compares a distribution with itself and its KL is identically zero. That zero-KL statement is limited to this bypass. With re-encoding, small ε has non-trivial implications. Appendix F gives the margin-dependent link to classification error. We will add a paragraph distinguishing the decomposition contribution from a distributional-robustness certificate.

**W4 — Reproducibility and tuning**

Section 5.1 of the submitted manuscript reports ImageNet-pretrained ResNet-50, 224×224 inputs, five runs, and source-only validation selection following DomainBed. The threshold sweep in Figure 3 is post-hoc; target accuracy is not used to select the operating point γ = 0.60 (Section 5.4). As reported in manuscript Table 5, raising γ to 0.90 increases label preservation from 96.8% to 98.5% while acceptance falls from 74.6% to 29.5% and coverage from 0.78 to 0.33. An anonymous code release is in preparation. We will add a hyperparameter appendix specifying all swept parameters, ranges, selection criterion, and final values.

**W5 — Realistic benchmarks**

Acknowledged. DomainNet, TerraIncognita, and WILDS remain open. The SCM experiment below tests extrapolation under a fixed label mechanism.

**W6 — Core contribution after qualifications**

Four concrete advances that we can support from the submitted manuscript or from the linear SCM: (1) Re-encoding as an implementable architectural fix to bypass vacuity, with a formal statement in Proposition 2 and the manuscript Table 3 disagreement contrast (5.9% vs. 3.4% on accepted pairs). A PACS held-out accuracy ablation of re-encoding has not been run, so we do not quote an accuracy change. (2) Compatibility gate filtering ≈25% of same-class donors (Table 3: acceptance 74.6%). (3) Donor policy increasing effective donors from 3.6 to 6.8 (Table 3). (4) Conditional theoretical decomposition mapping bound terms to auditable algorithmic quantities.

---

**Q1 — Trained SCM and controlled extrapolation**

The experiment tests two target conditions under the fixed label mechanism Y = 1{C > 0}:

- Represented nuisance shift. Sources use P(B₁ = Y) ∈ {0.7, 0.8, 0.9} with the training bit B₂ fixed at 0. The target uses P(B₁ = Y) = 0.6 with B₂ fixed at 0. The analytical conditional nuisance total variation of that B₁ shift, relative to the equal-weight source mixture, is 0.20.
- Withheld nuisance direction. The target uses P(B₁ = Y) = 0.8 and draws B₂ ~ Bernoulli(0.55) independent of Y. The bit B₂ is fixed at 0 in every source. The observed coordinate x_s2 is not constant during training: it still carries observation noise. The analytical conditional nuisance total variation of the B₂ shift is 0.55.

The reported quantities are target classification error and the paired prediction flip rate with resampled observation noise.

**Feature and data-generating mechanism:**

C ~ N(0, 1) and Y = 1{C > 0}. Features x = [x_c, x_s1, x_s2], with independent observation noise of standard deviation 0.5 on each coordinate:
- x_c = C + ε_c
- x_s1 = 1.5·(2B₁ − 1) + ε_s1
- x_s2 = 1.5·(2B₂ − 1) + ε_s2

B₁ = 1 gives the +1.5 signal on x_s1, and B₁ = 0 gives the −1.5 signal. P(B₁ = Y) controls how often that bit agrees with the label. It does not set the sign attached to each bit value. B₂ = 1 gives the +1.5 signal on x_s2, and B₂ = 0 gives the −1.5 signal. In every source and in the represented target, the bit B₂ is fixed at 0, so x_s2 has mean −1.5 and still varies through ε_s2. In the withheld target, B₂ ~ Bernoulli(0.55) independent of Y, so the mean of x_s2 moves as well.

x_s2 is present in every training vector and has non-zero variance because of observation noise. A model that learns a non-zero weight on it remains sensitive when B₂ starts to vary. An appended-zero coordinate, fixed at 0 throughout training, would be a different and easier intervention.

**Source domains (equal weight):** P(B₁ = Y) ∈ {0.7, 0.8, 0.9}; bit B₂ = 0.  
**Represented target:** P(B₁ = Y) = 0.6, bit B₂ = 0.  
**Withheld target:** P(B₁ = Y) = 0.8, B₂ ~ Bernoulli(0.55) independent of Y.

**Analytical conditional nuisance TV** (relative to the equal-weight source mixture, within each label, averaged over balanced labels; distinct from η in Theorem 1):
- Represented (B₁ direction): source P(B₁ = 1 | Y = 1) = (0.7 + 0.8 + 0.9) / 3 = 0.80; target 0.60. TV = ½(|0.80 − 0.60| + |0.20 − 0.40|) = **0.20**
- Withheld (B₂ direction): source P(B₂ = 0 | Y) = 1.00; target P(B₂ = 0 | Y) = 0.45. TV = ½(|1.00 − 0.45| + |0.00 − 0.55|) = **0.55**

**Pair sampler.** Each pair holds latent content C, label Y, and the unflipped nuisance bit fixed. Observation noise is drawn independently for the anchor and for the perturbed member, on all three coordinates x_c, x_s1, and x_s2. The named bit is flipped as well: B₁ on the represented target and B₂ on the withheld target. The metric is the paired prediction flip rate with resampled observation noise: the fraction of pairs whose predicted label changes. The nuisance bit is not the only input that changes.

**Linear ablation.** Full CausalGuard applies the soft mask to the recombined candidate. The no-re-encoding arm is the unchanged-anchor bypass: every donor's candidate content is the anchor's retained features. The consistency KL in that arm is identically zero because both arguments are the anchor prediction. Manuscript Table 3 reports 5.9% accepted-pair disagreement for no re-encoding, so that column is not this zero-disagreement bypass. Table 3 disagreement, this flip rate, and held-out accuracy are three different quantities.

**Results.** Five seeds, 2,000 pairs per condition, 3D linear SCM with logistic regression, source-only validation, every seed kept. Means are ± population standard deviation. Paired columns are full CausalGuard minus the named method, in seed order 0–4, in percentage points. The mean of those five differences is listed separately from the seeds.

| Target condition | Quantity | ERM | Full CausalGuard | Unchanged-anchor bypass | Paired full − ERM (seeds 0–4; mean) | Paired full − bypass (seeds 0–4; mean) |
|---|---|---|---|---|---|---|
| Represented nuisance shift (TV 0.20, B1 flipped) | Target error (%) | 17.6 ± 1.0 | 17.7 ± 1.1 | 17.7 ± 1.1 | +0.70, +0.10, +0.95, -0.10, -1.25; mean +0.08 | 0.00, 0.00, 0.00, +0.05, 0.00; mean +0.01 |
| Represented nuisance shift (TV 0.20, B1 flipped) | Paired prediction flip rate with resampled observation noise (%) | 40.5 ± 2.1 | 40.3 ± 2.0 | 40.3 ± 2.0 | +1.80, +0.75, +2.30, -1.05, -4.65; mean -0.17 | 0.00, +0.05, 0.00, 0.00, 0.00; mean +0.01 |
| Withheld nuisance direction (TV 0.55, B2 flipped) | Target error (%) | 11.1 ± 0.5 | 11.1 ± 0.5 | 11.1 ± 0.5 | -0.05, +0.20, +0.40, -0.20, -0.05; mean +0.06 | +0.05, 0.00, 0.00, 0.00, 0.00; mean +0.01 |
| Withheld nuisance direction (TV 0.55, B2 flipped) | Paired prediction flip rate with resampled observation noise (%) | 10.9 ± 0.8 | 10.9 ± 0.6 | 10.9 ± 0.6 | -0.70, +0.05, -0.55, -0.05, +1.15; mean -0.02 | -0.05, 0.00, -0.05, 0.00, 0.00; mean -0.02 |

Source validation accuracy for ERM spans 0.8678–0.8989 across seeds. No target labels were used.

**Learned mask weights** (mean across 5 seeds): x_c ≈ 0.89, x_s1 ≈ 0.71, x_s2 ≈ 0.52. In every seed the largest weight is on x_c and the smallest is on x_s2. During training the bit B₂ is fixed at 0, so x_s2 has a fixed mean and only observation noise; the coordinate is not a constant. Full CausalGuard and the unchanged-anchor bypass differ by at most 0.002 in any mask coordinate. The analytical total variations, 0.20 and 0.55, are properties of the data law. They are not the learned coverage gap η.

Mean paired target-error differences, full CausalGuard minus ERM, are +0.08 percentage points on the represented target and +0.06 percentage points on the withheld target. Those means are small. The seeds are not: the represented differences are +0.70, +0.10, +0.95, −0.10, and −1.25 percentage points, and the represented flip-rate differences run from −4.65 to +2.30. The withheld error differences are −0.05, +0.20, +0.40, −0.20, and −0.05. Full CausalGuard and the unchanged-anchor bypass stay within 0.05 percentage points on error in every seed.

Source diversity across P(B₁ = Y) ∈ {0.7, 0.8, 0.9} gives the supervised loss a cross-domain signal on the content feature, so the mean error gap on these two targets is small. The withheld-target error (11.1%) is lower than the represented-target error (17.6%) because P(B₁ = Y) = 0.8 matches the source mean, and the withheld B₂ draw is independent of Y.

A separate configuration sets every source to P(B₁ = Y) = 0.9. On the reversed target, P(B₁ = Y) = 0.3, ERM error is 38.4 ± 1.3% and full CausalGuard is 39.4 ± 1.2%. The paired seed differences, full minus ERM, are +2.00, +1.45, +0.10, +0.10, and +1.15 (mean +0.96 percentage points). The mean mask weight on x_s1 rises to about 0.81. When every source shares that shortcut, CausalGuard does not reduce error relative to ERM.

**Limitations.** These results are from a 3D linear model with logistic regression. They are not ResNet-50 results on PACS, VLCS, or Office-Home. Per-domain image results, a matched MixStyle comparison, the PACS re-encoding accuracy ablation, and GPU timing have not been run.

---

**W7 — Controlled out-of-support case**

The withheld condition uses a nuisance bit that is fixed at 0 in every source and is drawn as Bernoulli(0.55) on the target. In this linear setting, target error does not rise relative to the represented condition. The withheld bit is independent of Y, so a learned weight on x_s2 adds noise and does not reverse the label.

---

**W8 / Q2 — Differences from mixing methods**

MixStyle mixes feature statistics without a compatibility screen, a re-encoding path, or a diversity-weighted donor policy. In the linear ablation, the unchanged-anchor bypass makes the consistency KL identically zero. The manuscript differences we can cite are: (1) re-encoding, (2) the compatibility gate (Table 3: 74.6% acceptance), (3) the diversity constraint (effective donors 3.6 to 6.8; Table 3), and (4) a KL consistency objective rather than a classification loss on mixed features. A matched MixStyle comparison on the image benchmarks has not been run.

---

## Reviewer itnv

Source: `rebuttal/final/itnv.md`

Thank you for requesting a closer baseline, individual domain results, broader shift evidence, and measured computational cost.

---

**Q1 — Direct competitors**

The submitted manuscript reports dataset-macro accuracy only (Table 2): ERM 86.2 ± 0.7 / 78.5 ± 0.6 / 71.8 ± 0.8 and CausalGuard 90.3 ± 0.5 / 81.2 ± 0.4 / 75.6 ± 0.5 on PACS, VLCS, and Office-Home. Those macros are manuscript figures. The per-seed, per-domain logs are not in this repository.

We do not post a per-domain ERM, SWAD, MixStyle, or CausalGuard table.

These requested experiments are still open, and this reply contains none of their figures: per-domain results on PACS, VLCS, and Office-Home; a matched MixStyle comparison; the PACS re-encoding accuracy ablation; and GPU training time, peak memory, and inference timing.

What remains to be run, and has not been started:

- MixStyle from the official implementation, with α chosen on source validation only, ImageNet ResNet-50, DomainBed held-out splits, source-only checkpoint selection, and the same step budget as the submitted runs, on PACS, VLCS, and Office-Home.
- The same protocol for MIRO, Causal Matching, and Causal Balancing. MIRO uses a frozen pretrained reference beyond ImageNet initialization and will be labeled as such if it is run.

The controlled linear SCM in the response to z2Uv Q1 compares ERM, full CausalGuard, and the unchanged-anchor bypass on target error and on the paired prediction flip rate with resampled observation noise, including paired seed differences. That comparison is not a substitute for the image-benchmark rerun.

---

**Q2 — Broader benchmarks**

DomainNet, TerraIncognita, and iWildCam remain open evaluations. The SCM experiment in the response to z2Uv Q1 tests a represented B₁ shift and a withheld B₂ direction under a fixed label mechanism. We will add an explicit statement in Section 5 that the submitted benchmarks cover style, rendering, and photography shifts and do not cover text-image, label-mechanism, or ecological distributional shifts.

---

**Q3 — Individual held-out domains**

Per-domain accuracies are not available. The manuscript reports dataset macros (Table 2) under the Appendix J aggregation: the domain-macro score D⁻¹ Σ_d a_{bdr} for each run, then the mean and standard deviation over runs. We do not fill the missing per-domain table.

---

**Q4 — Practical interpretation of Theorem 1**

Source-validation risk is used only for checkpoint selection. A frozen source audit can flag low acceptance, concentrated donor weights, and high disagreement on accepted interventions. Those quantities are observable from source data without target labels. The target-dependent quantities κ, ρ, and η remain unknown for an unseen target. The candidate directional coverage metric (Appendix G) measures the directional span of accepted candidates and does not estimate 1 − η. The theorem's practical role is structured failure analysis: low acceptance or concentrated weights signal a potentially unfavourable validity–coverage trade-off. We will add a summary box in the revision.

---

**Q5 — Computational overhead**

GPU training time, peak memory, and inference latency have not been measured. We do not quote those figures.

At deployment the manuscript uses the backbone, learned mask, and classifier only. Donor construction, compatibility screening, and the donor policy solver are training-only. That architectural statement is not a measured latency.

---

## Reviewer bpmm

Source: `rebuttal/final/bpmm.md`

Thank you for identifying the presentation issues and asking for an accuracy ablation of re-encoding.

---

**W1 — Definitions, related work, and figures**

We correct the following specific issues:

*b vs. b₀ notation:* Eq. (7) uses b₀ for the mask budget scalar and states "The notation b₀ distinguishes the scalar mask budget from semantic map b." Table 4 (Appendix A) does not include b₀. We will add b₀ to Table 4 and audit all manuscript occurrences to ensure consistent disambiguation.

*w overloading:* w is used for density-ratio reweighting in Section 4 and implicitly for classifier parameters in Section 3. We will introduce θ_cls for classifier parameters and add both to Table 4.

*Structural variable definitions:* We will define the retained component c, replaceable component s, and classifier g(c) explicitly before Eq. (1). We will define anchor (the example being classified), donor (a separate same-class source example), and compatibility filter (the frozen teacher screen) at first occurrence in the main text.

*Figure 1:* Increased label font size; legend mapping arrow styles — solid arrows: computational sequence; dashed arrows: factual/candidate inputs.

*Figure 3:* Explicit y-axis label on the "Mean Acc." panel identifying the value as VLCS domain-macro accuracy.

*Citations:* DomainBed (Gulrajani & Lopez-Paz, 2021) and shortcut learning (Geirhos et al., 2020) will be added to the introduction. Comparator method objectives (IRM, V-REx, SWAD, MixStyle) will be described in Related Work with explicit comparisons.

---

**W2 — Accuracy and known-nuisance tests for the re-encoding ablation**

Table 3 and held-out accuracy answer different questions. The manuscript Table 3 figures of 5.9% (no re-encoding) and 3.4% (full model) are prediction disagreement: the fraction of accepted pairs whose factual top-1 prediction and candidate top-1 prediction differ. They are not held-out domain accuracy.

The linear ablation uses a third quantity, the paired prediction flip rate with resampled observation noise. Each pair holds latent content C, label Y, and the unflipped nuisance bit fixed. Observation noise is drawn independently on all three input coordinates for both pair members, and the named nuisance bit is flipped. That rate is not Table 3 disagreement and not held-out accuracy.

In this linear ablation the no-re-encoding arm is the unchanged-anchor bypass: candidate content is the anchor's retained features, so the consistency KL is identically zero and factual and candidate predictions agree. Manuscript Table 3's 5.9% disagreement is not zero, so that column is not this bypass. We do not have the training code that produced Table 3.

**PACS accuracy ablation:** not run. This reply contains no PACS accuracy delta. Table 2's full-model PACS macro, 90.3 ± 0.5, is a manuscript number for the full model. It is not an ablation result.

**Paired prediction flip rate with resampled observation noise (3D linear SCM, 5 seeds, 2000 pairs):**

Under the represented B₁ shift (analytical conditional TV = 0.20): ERM 40.5 ± 2.1%, unchanged-anchor bypass 40.3 ± 2.0%, CausalGuard 40.3 ± 2.0%. The mean paired full − ERM gap is −0.17 percentage points. The five seeds are +1.80, +0.75, +2.30, −1.05, and −4.65. Under the withheld B₂ direction (TV = 0.55): ERM 10.9 ± 0.8%, bypass 10.9 ± 0.6%, CausalGuard 10.9 ± 0.6% (mean paired full − ERM −0.02 percentage points). The seed-level withheld gaps are not all equal to that mean. Full CausalGuard and the bypass stay within 0.05 percentage points on target error in every seed. Mean target-error differences versus ERM are +0.08 percentage points (represented) and +0.06 percentage points (withheld). The side-by-side seeds are in the response to z2Uv Q1.

---

**W3 — Evidence about robust vs. spurious features**

This concern is correct. A feature can be both source-stable and spurious. The mask selects for source stability, not for causal relevance on an unseen target. Appendix B states: "Mask leakage. The gate can encode information about the whole input through its weights, even if only a few output coordinates remain." Appendix E: "If all real examples share the same shortcut, arbitrary feature extrapolation need not discover which change preserves the label."

In the 3D linear SCM (five seeds; source P(B₁ = Y) ∈ {0.7, 0.8, 0.9}), mean mask weights are x_c ≈ 0.89, x_s1 ≈ 0.71, and x_s2 ≈ 0.52. In every seed the content coordinate receives the highest weight and x_s2 the lowest. The bit B₂ is fixed at 0 during training, so x_s2 has mean −1.5 and still varies through observation noise. The mask ranks the coordinates in the right direction and does not separate them cleanly. Mean target-error differences versus ERM are +0.08 percentage points (represented) and +0.06 percentage points (withheld). Individual represented seeds run from −1.25 percentage points to +0.95 percentage points. When every source is set to P(B₁ = Y) = 0.9, the reversed-target paired gap is +0.96 percentage points (CausalGuard has higher error than ERM) and the mask weight on x_s1 rises to about 0.81. That is the Appendix E failure case on this linear model. The PACS held-out accuracy ablation has not been run, so this reply reports no image-benchmark accuracy change.

Whether the deep mask separates robust features from spurious source-stable features remains open. We will state that limitation in the revised manuscript.

---

**Q1 — Dataset choice rationale**

PACS tests shifts across depiction styles (art, cartoon, photo, sketch). VLCS spans photographic datasets with different label spaces (VOC2007, LabelMe, Caltech101, SUN09), representing photography-condition and coverage shifts. Office-Home covers four object-recognition domains (Art, Clipart, Product, Real World) with diverse visual styles. We follow DomainBed to enable comparison with a large existing literature. We will add an explicit rationale paragraph in Section 5: these benchmarks cover nuisance-driven style and rendering shifts and do not cover text-image, label-mechanism, or ecological distributional shifts. TerraIncognita and WILDS are important future evaluations.

---

**Q2 — Candidate diversity and target coverage**

The normalized coverage metric is the entropy-based effective rank of the normalized intervention second-moment matrix G̃ = G/tr(G): r_eff = exp(−Σ_k λ_k(G̃) log λ_k(G̃)) (Appendix G, Eq. 29). This measures the directional span of accepted candidate displacements. It does not measure target-support coverage. Table 5's caption states: "The coverage column is a normalized diagnostic; it is not an estimate of 1 − η in Theorem 1." Appendix G: "Full-rank candidate covariance does not establish a density-ratio bound or identify the target discrepancy η."

We will add a labeled definition box in the main text and an explicit sentence: "This metric measures the directional span of learned candidates; it does not estimate the target support discrepancy η in Theorem 1, which is not identifiable from source data alone." Table 8 reports acceptance of 76.4–82.5% for nuisance-changing controls and 11.2–18.6% for class-changing controls, supporting the audit on those specific tested controls.

