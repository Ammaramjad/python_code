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
