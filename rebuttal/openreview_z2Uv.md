Thank you for asking us to specify the targeted shift regime, test a controlled extrapolation case, and clarify the theoretical contribution.

---

**W1 — Targeted shifts and comparison with existing approaches**

CausalGuard targets label-preserving nuisance shifts: changes to S in Eq. (1) that preserve content C and label mechanism P(Y|C). Theorem 1 requires the target law to be close to a reweighted, semantically corrected version of the source-derived candidate law. A new nuisance direction outside that law can leave candidate KL low while target risk remains high. We will add a "Targeted shift family" paragraph at the start of Section 5 explicitly stating this scope.

IRM and V-REx can admit a shortcut that is uniformly predictive across all observed source environments. Causal Matching requires object-level correspondence annotations; CausalGuard constructs pairs endogenously via the compatibility gate. MixStyle mixes feature statistics without a compatibility screen, shared re-encoding path, or diversity-weighted donor policy; see W8 and Q2. A matched MixStyle rerun on PACS, VLCS, and Office-Home was not executed here: this environment has no GPU, and the training code and datasets are not in the repository. That job, and matched MIRO, Causal Matching, and Causal Balancing reruns, remain open. The exact pending commands are listed in the response to itnv Q1.

**W2 — Shortcut reinforcement (co-adaptation)**

This concern is correct and is acknowledged in Appendices B and E. Re-encoding forces candidates through the input-dependent mask and the shared classifier, removing the specific bypass-vacuity failure mode described in Proposition 2. It does not prevent the backbone and mask from jointly retaining a spurious source-stable feature. The Q1 SCM experiment directly tests this and is reported below.

**W3 — Bounded-loss assumption and theoretical contribution**

The theorem is conditional; this is stated explicitly throughout. With the probability floor p_Y ≥ τ (Eq. 3), the loss is bounded by log(1/τ) and its Lipschitz constant in predictive TV is 1/τ. For the 0/1 loss both constants are 1. The contribution is the decomposition: terms κ, ε, ρ, ξ, η correspond to the four algorithmic components (candidate reweighting, consistency optimization, factual shift, semantic filtering, coverage gap). Without re-encoding, ε ≡ 0 regardless of the learned partition (Proposition 2), making the theorem vacuously satisfied. With re-encoding, small ε has non-trivial implications. Appendix F gives the margin-dependent link to classification error. We will add a paragraph distinguishing the decomposition contribution from a distributional-robustness certificate.

**W4 — Reproducibility and tuning**

Section 5.1 reports ImageNet-pretrained ResNet-50, 224×224 inputs, five runs, source-only validation selection following DomainBed. The threshold sweep in Figure 3 is post-hoc; target accuracy is not used to select the operating point γ = 0.60 (Section 5.4). Raising γ to 0.90 increases label preservation from 96.8% to 98.5% while acceptance falls from 74.6% to 29.5% and coverage from 0.78 to 0.33 (Table 5). An anonymous code release is in preparation. We will add a hyperparameter appendix specifying all swept parameters, ranges, selection criterion, and final values.

**W5 — Realistic benchmarks**

Acknowledged. DomainNet, TerraIncognita, and WILDS remain open. The SCM experiment below tests extrapolation under a fixed label mechanism.

**W6 — Core contribution after qualifications**

Four concrete advances that we can support from the submitted manuscript or from the CPU SCM runs: (1) Re-encoding as an implementable architectural fix to bypass vacuity, with a formal statement in Proposition 2 and the Table 3 disagreement contrast (5.9% vs. 3.4%). A PACS accuracy ablation of re-encoding was not rerun in this environment, so we do not quote a new per-domain accuracy gain. (2) Compatibility gate filtering ≈25% of same-class donors (Table 3: acceptance 74.6%). (3) Donor policy increasing effective donors from 3.6 to 6.8 (Table 3). (4) Conditional theoretical decomposition mapping bound terms to auditable algorithmic quantities.

---

**Q1 — Trained SCM and controlled extrapolation**

*Note on the review text:* The pasted review text drops the expression after "Can you show a case where". The experiment below covers the visible requests (represented and withheld nuisance shifts). Any condition referenced in the missing clause is not claimed to have been tested.

**Feature and data-generating mechanism (documented):**

Label: Y = sign(C), C ~ N(0, 1). Features x = [x_c, x_s1, x_s2]:
- x_c = C + ε_c, ε_c ~ N(0, 0.25) — noisy observed content
- x_s1 = 1.5·(2B₁ − 1) + ε_s1, ε_s1 ~ N(0, 0.25) — nuisance from B₁; ±1.5 signal
- x_s2 = 1.5·(2B₂ − 1) + ε_s2, ε_s2 ~ N(0, 0.25) — nuisance from B₂; ±1.5 signal

B₁ is correlated with Y: P(B₁=Y) = p₁ per domain. B₂ is an independent binary.

B₁ shifts x_s1 by +1.5 when B₁ = Y (aligned) and −1.5 when B₁ ≠ Y. B₂ shifts x_s2 by +1.5 when B₂ = 1 and −1.5 when B₂ = 0. In source domains and the represented target, B₂ = 0 always, so x_s2 has fixed mean −1.5 with noise ε_s2. In the withheld target, B₂ ~ Bernoulli(0.55) independent of Y, so x_s2 varies freely.

*Withheld direction vs. appended-zero input:* x_s2 is present in all training feature vectors with non-zero variance (σ² = 0.25). A model that learns any non-zero weight for x_s2 will be sensitive to its variation at test time. An appended-zero input (x_s2 ≡ 0 in training) produces near-zero learned weight because the feature has zero training variance — that coordinate is silent. Our withheld direction is strictly harder to control: the model has training-time exposure to x_s2 at constant mean, and any learned weight remains active when x_s2 starts varying at test.

**Source domains (equal weight):** P(B₁=Y) ∈ {0.7, 0.8, 0.9}; B₂ = 0.  
**Represented target:** P(B₁=Y) = 0.6, B₂ = 0.  
**Withheld target:** P(B₁=Y) = 0.8, B₂ ~ Bernoulli(0.55) independent.

**Analytical conditional nuisance TV** (relative to equal-weight source mixture, within each label, averaged over balanced labels; distinct from η in Theorem 1):
- Represented (B₁ direction): source P(B₁=1|Y=1) = (0.7+0.8+0.9)/3 = 0.80; target 0.60. TV = ½(|0.80−0.60|+|0.20−0.40|) = **0.20**
- Withheld (B₂ direction): source P(B₂=0|Y) = 1.00; target P(B₂=0|Y) = 0.45. TV = ½(|1.00−0.45|+|0.00−0.55|) = **0.55**

**Pair sampler:** Content C and label Y are fixed per pair. The anchor draws B₁ (or B₂) from the target distribution; the perturbed member flips that bit while keeping the other bit and C fixed. Independent noise is resampled for each pair member. This ensures the only change between anchor and perturbed is the specified nuisance bit.

**CausalGuard implementation:** Full CG applies the soft mask m to the recombined candidate: c_v = m · v_ij where v_ij = m·x_anchor + (1−m)·x_donor (re-encoding). No-reenc uses the anchor's retained features for all donors: c_v = m·x_anchor repeated (bypass — KL = 0 by construction; Proposition 2 confirmed empirically by near-zero gradient contribution from consistency loss in this run).

**Results.** Primary run, raw file `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`, regenerated by `scripts/report_z2Uv_q1_table.py` into `results/rebuttal/z2Uv_q1_side_by_side_20261113_021503.md`. Five seeds, 2000 pairs per condition, 3D linear SCM plus logistic regression, source-only validation, every seed kept. Means are ± population SD. Paired columns are full CausalGuard minus the named method, in seed order 0–4, in percentage points.

| Target condition | Quantity | ERM | Full CausalGuard | No re-encoding | Paired full − ERM (seeds 0–4; mean) | Paired full − no re-encoding (seeds 0–4; mean) |
|---|---|---|---|---|---|---|
| Represented nuisance shift (TV 0.20, flip B1) | Target error (%) | 17.6 ± 1.0 | 17.7 ± 1.1 | 17.7 ± 1.1 | +0.70, +0.10, +0.95, -0.10, -1.25; mean +0.08 | 0.00, 0.00, 0.00, +0.05, 0.00; mean +0.01 |
| Represented nuisance shift (TV 0.20, flip B1) | Nuisance-only flip rate (%) | 40.5 ± 2.1 | 40.3 ± 2.0 | 40.3 ± 2.0 | +1.80, +0.75, +2.30, -1.05, -4.65; mean -0.17 | 0.00, +0.05, 0.00, 0.00, 0.00; mean +0.01 |
| Withheld nuisance direction (TV 0.55, flip B2) | Target error (%) | 11.1 ± 0.5 | 11.1 ± 0.5 | 11.1 ± 0.5 | -0.05, +0.20, +0.40, -0.20, -0.05; mean +0.06 | +0.05, 0.00, 0.00, 0.00, 0.00; mean +0.01 |
| Withheld nuisance direction (TV 0.55, flip B2) | Nuisance-only flip rate (%) | 10.9 ± 0.8 | 10.9 ± 0.6 | 10.9 ± 0.6 | -0.70, +0.05, -0.55, -0.05, +1.15; mean -0.02 | -0.05, 0.00, -0.05, 0.00, 0.00; mean -0.02 |

Source validation accuracy (ERM): 0.8678–0.8989 across seeds. No target labels used.

**Learned mask weights** (mean across 5 seeds): content x_c ≈ 0.89, nuisance x_s1 ≈ 0.71, nuisance x_s2 ≈ 0.52. The mask assigns highest weight to the content dimension in all seeds and lowest to x_s2 (always constant during training). CG and no-reenc masks differ by at most 0.002 in any coordinate.

**What “essentially identical” does and does not mean.** An earlier sentence said the three methods differ by at most 0.1 pp. That sentence was about this Q1 run, and it describes the **mean** paired error gap only (+0.08 pp represented, +0.06 pp withheld). It does not describe every seed. Represented error gaps run from -1.25 to +0.95 pp, and represented flip-rate gaps run from -4.65 to +2.30 pp. Full CausalGuard and no re-encoding stay within 0.05 pp on error in every seed of this file. A separate sentence in `docs/progress.md` refers to a different script, `scripts/experiment_D_synthetic_scm.py` (2D continuous correlation, 3 seeds, accuracy). On `results/rebuttal/experiment_D_synthetic_scm_20261107_000025.csv`, ERM and CausalGuard accuracies are close to each other, while the content oracle is much higher once the shortcut weakens (weakened: ERM 0.832 vs oracle 0.965). Those two statements must not be merged. SCM-B, below, is a third configuration and is not an identical-result claim. The mapping is written out in `results/rebuttal/run_reconciliation.md`.

A second execution of this same Q1 script on the validated environment (Python 3.12.3, numpy 2.5.4) is preserved as `results/rebuttal/z2Uv_q1_scm_20261113_025236.csv`. Mean errors stay within 0.4 pp, but the seed lists differ; one represented flip paired difference is +8.70 pp. We report the 021503 file as the primary table and keep the later file rather than overwriting it.

In this linear regime, source diversity across P(B₁=Y) ∈ {0.7, 0.8, 0.9} gives the supervised loss enough cross-domain signal to partly recover the content feature, so the mean error gap is small. The withheld-direction error (11.1%) is lower than the represented error (17.6%) because P(B₁=Y) = 0.8 matches the source mean, and B₂ ~ Bernoulli(0.55) is independent of Y.

We also ran SCM-B with all three source domains at P(B₁=Y) = 0.9. On the reversed target (P(B₁=Y) = 0.3), ERM error is 38.4 ± 1.3% and full CausalGuard is 39.4 ± 1.2%. Paired full − ERM seeds are +2.00, +1.45, +0.10, +0.10, +1.15 (mean +0.96 pp). Full and no re-encoding remain within 0.05 pp. When every source shares the same strong shortcut, CausalGuard does not beat ERM. Raw data: `results/rebuttal/scm_b_high_spurious_20261113_023734.csv`.

**Limitations of these results:** 3D linear SCM plus logistic regression, not ResNet-50 on PACS, VLCS, or Office-Home. The PACS re-encoding ablation, the matched MixStyle rerun, and the GPU profile were not run; see `results/rebuttal/pending_gpu_jobs.md`.

---

**W7 — Controlled out-of-support case**

The withheld-direction condition tests a nuisance direction outside source candidate support (B₂ was always 0 in sources; the withheld target has B₂ ~ Bernoulli(0.55)). In the linear setting, error does not increase relative to the represented condition because the withheld B₂ is independent of Y at test time; any learned weight on x_s2 adds noise but no adversarial label-misleading effect.

---

**W8 / Q2 — Differences from mixing methods**

MixStyle mixes feature statistics (AdaIN-style) without a compatibility screen, re-encoding path, or diversity-weighted donor policy. The consistency loss is structurally zero without re-encoding (Proposition 2). Key structural differences from the manuscript: (1) re-encoding, (2) compatibility gate (Table 3: 74.6% acceptance), (3) diversity constraint (effective donors 3.6 to 6.8; Table 3), (4) KL consistency objective versus classification loss on mixed features. A quantitative matched MixStyle comparison on the image benchmarks was not run in this environment. The pending job is named in the response to itnv Q1.
