# Combined rebuttal

Regenerated from `rebuttal/final/z2Uv.md`, `rebuttal/final/itnv.md`, and `rebuttal/final/bpmm.md`. Paste each reviewer file as its own OpenReview comment.

---

## Reviewer z2Uv

Source: `rebuttal/final/z2Uv.md`

Thank you for asking us to specify the targeted shift regime, test a controlled extrapolation case, and clarify the theoretical contribution.

---

**W1 — Targeted shifts and comparison with existing approaches**

CausalGuard targets label-preserving nuisance shifts: changes to S in Eq. (1) that preserve content C and label mechanism P(Y|C). Theorem 1 requires the target law to be close to a reweighted, semantically corrected version of the source-derived candidate law. A new nuisance direction outside that law can leave candidate KL low while target risk remains high. We will add a "Targeted shift family" paragraph at the start of Section 5 explicitly stating this scope.

IRM and V-REx can admit a shortcut that is uniformly predictive across all observed source environments. Causal Matching requires object-level correspondence annotations; CausalGuard constructs pairs endogenously via the compatibility gate. MixStyle mixes feature statistics without a compatibility screen, shared re-encoding path, or diversity-weighted donor policy; see W8 and Q2. A matched MixStyle rerun on PACS, VLCS, and Office-Home was not executed here: this environment has no GPU, and the training code and datasets are not in the repository. That job, and matched MIRO, Causal Matching, and Causal Balancing reruns, remain open. The exact pending commands are listed in the response to itnv Q1.

**W2 — Shortcut reinforcement (co-adaptation)**

This concern is correct and is acknowledged in Appendices B and E. Re-encoding forces candidates through the input-dependent mask and the shared classifier, removing the specific bypass-vacuity failure mode described in Proposition 2. It does not prevent the backbone and mask from jointly retaining a spurious source-stable feature. The Q1 SCM experiment directly tests this and is reported below.

**W3 — Bounded-loss assumption and theoretical contribution**

The theorem is conditional; this is stated explicitly throughout. No numerical probability floor was recovered for the ResNet-50 runs. This repository contains no original experiment config, training log, or checkpoint metadata that records τ, and `scripts/run_manifest_pacs.yaml` leaves `tau` null. Appendix K.2, as quoted from the submitted manuscript in `docs/paper_code_discrepancies.md`, says the hypothetical probability floor is valid only for class count C < 100 and is not an asserted setting of the benchmark runs.

Eq. (3) writes the C-class floor p(u) = (1 − Cτ) softmax(h_ψ(c_ϕ(u))) + τ·1. The linear SCM implements the two-class case of that formula: `_prob_floored` in `scripts/experiment_z2Uv_q1_scm.py` returns (1 − 2τ) sigmoid(logit) + τ, which is Eq. (3) when C = 2 and the positive-class probability is a sigmoid. The constant passed into the linear scripts is a script default. It is not a recovered benchmark setting, and this reply does not treat it as the value of τ used in the paper.

For a predictor satisfying p_y ≥ τ, cross-entropy is bounded by log(1/τ) and is 1/τ-Lipschitz in predictive total variation. For the 0/1 loss both constants are 1. The contribution is the decomposition: the terms κ, ε, ρ, ξ, and η correspond to candidate reweighting, consistency optimization, the factual shift, semantic filtering, and the coverage gap. Without re-encoding, ε ≡ 0 regardless of the learned partition (Proposition 2), making the theorem vacuously satisfied. With re-encoding, small ε has non-trivial implications. Appendix F gives the margin-dependent link to classification error. We will add a paragraph distinguishing the decomposition contribution from a distributional-robustness certificate.

**W4 — Reproducibility and tuning**

Section 5.1 of the submitted manuscript reports ImageNet-pretrained ResNet-50, 224×224 inputs, five runs, and source-only validation selection following DomainBed. The threshold sweep in Figure 3 is post-hoc; target accuracy is not used to select the operating point γ = 0.60 (Section 5.4). As reported in manuscript Table 5, raising γ to 0.90 increases label preservation from 96.8% to 98.5% while acceptance falls from 74.6% to 29.5% and coverage from 0.78 to 0.33. An anonymous code release is in preparation. We will add a hyperparameter appendix specifying all swept parameters, ranges, selection criterion, and final values.

**W5 — Realistic benchmarks**

Acknowledged. DomainNet, TerraIncognita, and WILDS remain open. The SCM experiment below tests extrapolation under a fixed label mechanism.

**W6 — Core contribution after qualifications**

Four concrete advances that we can support from the submitted manuscript or from the CPU SCM runs: (1) Re-encoding as an implementable architectural fix to bypass vacuity, with a formal statement in Proposition 2 and the Table 3 disagreement contrast (5.9% vs. 3.4%). A PACS accuracy ablation of re-encoding was not rerun in this environment, so we do not quote a new per-domain accuracy gain. (2) Compatibility gate filtering ≈25% of same-class donors (Table 3: acceptance 74.6%). (3) Donor policy increasing effective donors from 3.6 to 6.8 (Table 3). (4) Conditional theoretical decomposition mapping bound terms to auditable algorithmic quantities.

---

**Q1 — Trained SCM and controlled extrapolation**

*Note on the review text:* The full z2Uv review is not available. The OpenReview forum for submission 61846 (https://openreview.net/forum?id=ky7kbAn5Fb) returned HTTP 403 from this environment, and the repository has no review PDF. The copied question ends at "Can you show a case where". The mathematical condition after those words was not recovered, and this experiment does not claim to test it.

The experiment tests the two target conditions implemented in `scripts/experiment_z2Uv_q1_scm.py`, under the fixed label mechanism Y = sign(C):

- Represented nuisance shift. Sources use P(B₁ = Y) ∈ {0.7, 0.8, 0.9} with B₂ = 0. The target uses P(B₁ = Y) = 0.6 with B₂ = 0. The analytical conditional nuisance total variation of that B₁ shift, relative to the equal-weight source mixture, is 0.20.
- Withheld nuisance direction. The target uses P(B₁ = Y) = 0.8 and B₂ ~ Bernoulli(0.55) independent of Y. B₂ is fixed at 0 in every source, so this coordinate is constant during training. Its analytical conditional nuisance total variation is 0.55.

The reported quantities are target classification error and the nuisance-only flip rate.

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

A second execution of this same Q1 script on the validated environment (Python 3.12.3, numpy 2.5.4) is preserved as `results/rebuttal/z2Uv_q1_scm_20261113_025236.csv`. Mean errors stay within 0.4 pp, but the seed lists differ; one represented flip paired difference is +8.70 pp. The 021503 file is primary because it is the first complete five-seed execution of this script and the input to `scripts/report_z2Uv_q1_table.py`. The later file is kept in the evidence index and is not averaged into the table. SCM-B, `results/rebuttal/scm_b_high_spurious_20261113_023734.csv`, is also kept there as a separate configuration.

In this linear regime, source diversity across P(B₁=Y) ∈ {0.7, 0.8, 0.9} gives the supervised loss enough cross-domain signal to partly recover the content feature, so the mean error gap is small. The withheld-direction error (11.1%) is lower than the represented error (17.6%) because P(B₁=Y) = 0.8 matches the source mean, and B₂ ~ Bernoulli(0.55) is independent of Y.

We also ran SCM-B with all three source domains at P(B₁=Y) = 0.9. On the reversed target (P(B₁=Y) = 0.3), ERM error is 38.4 ± 1.3% and full CausalGuard is 39.4 ± 1.2%. Paired full − ERM seeds are +2.00, +1.45, +0.10, +0.10, +1.15 (mean +0.96 pp). Full and no re-encoding remain within 0.05 pp. When every source shares the same strong shortcut, CausalGuard does not beat ERM. Raw data: `results/rebuttal/scm_b_high_spurious_20261113_023734.csv`.

**Limitations of these results:** 3D linear SCM plus logistic regression, not ResNet-50 on PACS, VLCS, or Office-Home. The PACS re-encoding ablation, the matched MixStyle rerun, and the GPU profile were not run; see `results/rebuttal/pending_gpu_jobs.md`.

---

**W7 — Controlled out-of-support case**

The withheld-direction condition tests a nuisance direction outside source candidate support (B₂ was always 0 in sources; the withheld target has B₂ ~ Bernoulli(0.55)). In the linear setting, error does not increase relative to the represented condition because the withheld B₂ is independent of Y at test time; any learned weight on x_s2 adds noise but no adversarial label-misleading effect.

---

**W8 / Q2 — Differences from mixing methods**

MixStyle mixes feature statistics (AdaIN-style) without a compatibility screen, re-encoding path, or diversity-weighted donor policy. The consistency loss is structurally zero without re-encoding (Proposition 2). Key structural differences from the manuscript: (1) re-encoding, (2) compatibility gate (Table 3: 74.6% acceptance), (3) diversity constraint (effective donors 3.6 to 6.8; Table 3), (4) KL consistency objective versus classification loss on mixed features. A quantitative matched MixStyle comparison on the image benchmarks was not run in this environment. The pending job is named in the response to itnv Q1.

---

## Reviewer itnv

Source: `rebuttal/final/itnv.md`

Thank you for requesting a closer baseline, individual domain results, broader shift evidence, and measured computational cost.

---

**Q1 — Direct competitors**

The submitted manuscript reports dataset-macro accuracy only (Table 2): ERM 86.2 ± 0.7 / 78.5 ± 0.6 / 71.8 ± 0.8 and CausalGuard 90.3 ± 0.5 / 81.2 ± 0.4 / 75.6 ± 0.5 on PACS, VLCS, and Office-Home. Those macros are manuscript figures. This repository does not contain the per-seed, per-domain logs, the CausalGuard training code, or the datasets, and this machine has no GPU (`nvidia-smi` is absent; `scripts/verify_gpu.py` fails because PyTorch is not installed).

We therefore do not post a per-domain ERM, SWAD, MixStyle, or CausalGuard table. Draft domain cells are omitted.

These requested experiments are still open, and this reply contains none of their figures: per-domain results on PACS, VLCS, and Office-Home; a matched MixStyle comparison; the PACS re-encoding accuracy ablation; and GPU training time, peak memory, and inference timing.

The matched comparison that is still required, and was not started:

- MixStyle, official implementation, α chosen on source validation only, ImageNet ResNet-50, DomainBed held-out splits, source-only checkpoint selection, same step budget as the submitted runs, on PACS, VLCS, and Office-Home. Intended output: `results/rebuttal/experiment_C_mixstyle.csv`.
- The nine PACS manifest jobs in `scripts/run_manifest_pacs.yaml` (`pacs_erm_seed0` through `pacs_erm_seed2`, `pacs_cg_full_seed0` through `pacs_cg_full_seed2`, `pacs_cg_nore_seed0` through `pacs_cg_nore_seed2`) are all `PENDING`. The manifest does not cover Sketch and leaves several CausalGuard hyperparameters null.
- MIRO, Causal Matching, and Causal Balancing remain open. MIRO uses a frozen pretrained reference beyond ImageNet initialization and will be labeled as such if it is run.

What we did measure on CPU is the controlled SCM comparison in the response to z2Uv Q1 (ERM, full CausalGuard, and no re-encoding, with error, flip rate, and paired seed differences). That is not a substitute for the image-benchmark rerun.

---

**Q2 — Broader benchmarks**

DomainNet, TerraIncognita, and iWildCam remain open evaluations. The SCM experiment in the response to z2Uv Q1 tests represented and withheld nuisance directions under a fixed label mechanism. We will add an explicit statement in Section 5 that the submitted benchmarks cover style, rendering, and photography shifts and do not cover text-image, label-mechanism, or ecological distributional shifts.

---

**Q3 — Individual held-out domains**

Per-domain numbers are not available to post. The manuscript reports dataset macros (Table 2) under the Appendix J aggregation, domain-macro score D⁻¹ Σ_d a_{bdr} per run, then mean and SD over runs. The per-domain breakdown the question asks for is one of the pending GPU jobs in Q1. We do not fill that table from memory or from a draft whose seed logs are absent.

---

**Q4 — Practical interpretation of Theorem 1**

Source-validation risk is used only for checkpoint selection. A frozen source audit can flag low acceptance, concentrated donor weights, and high disagreement on accepted interventions — all observable from source data without target labels. The target-dependent quantities κ, ρ, and η remain unknown for an unseen target; the candidate directional coverage metric (Appendix G) measures directional span of accepted candidates and does not estimate 1 − η. The theorem's practical role is structured failure analysis: low acceptance or concentrated weights signal a potentially unfavourable validity–coverage trade-off. We will add a summary box in the revision.

---

**Q5 — Computational overhead**

No GPU profile was collected. This VM has no NVIDIA device. `scripts/verify_gpu.py` does not reach a timing loop because PyTorch is not installed, and the recovered install script does not add CUDA PyTorch.

The job that is still pending, and whose numbers we do not quote: ResNet-50 on PACS with Sketch held out; mixed FP16; batch size 32; 5,000 steps; 5 runs; donor-bank construction included in training time; inference after 50 warm-up iterations and 200 timed repetitions at batch 1 and batch 32; `torch.cuda.synchronize()` before each timed region. Record training wall-clock, peak GPU memory, batch-1 latency, and batch-32 throughput for ERM, SWAD, and CausalGuard. Intended output: `results/rebuttal/experiment_E_efficiency.csv`.

At deployment the manuscript uses the backbone, learned mask, and classifier only. Donor construction, compatibility screening, and the donor policy solver are training-only. That architectural statement is not a measured latency.

CPU wall times we did record, and which are not GPU profiles: the primary z2Uv Q1 script finishes in well under a minute per the run log, and the 2026-11-13 replication on this VM took 30.5 s. Those times are for the 3D logistic SCM, not ResNet-50.

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

Table 3 and held-out accuracy answer different questions. The manuscript Table 3 figures of 5.9% (no re-encoding) and 3.4% (full model) are prediction disagreement: the fraction of accepted pairs whose factual top-1 prediction and candidate top-1 prediction differ. They are not held-out domain accuracy. Appendix B's unchanged-anchor control, which discards the donor's replaceable part, yields zero disagreement by construction. Whether Table 3's no-re-encoding column used the linear script's bypass (candidate content fixed to the anchor) or a direct candidate path is unresolved, so the script does not identify that column.

**PACS accuracy ablation:** not run. The jobs `pacs_cg_full_seed0`, `pacs_cg_full_seed1`, `pacs_cg_full_seed2`, `pacs_cg_nore_seed0`, `pacs_cg_nore_seed1`, and `pacs_cg_nore_seed2` in `scripts/run_manifest_pacs.yaml` are still `PENDING`. This VM has no GPU and the training code is not in the repository, so this reply contains no PACS accuracy delta. Table 2's full-model PACS macro, 90.3 ± 0.5, is a manuscript number for the full model. It is not an ablation result.

**Known-nuisance flip tests (3D linear SCM, 5 seeds, 2000 pairs; primary CSV `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`):**

These are nuisance-only flip rates on the linear SCM, not Table 3 disagreement and not held-out accuracy. Under the represented nuisance shift (analytical conditional TV = 0.20, B₁ flipped): ERM 40.5 ± 2.1%, no-reenc 40.3 ± 2.0%, CausalGuard 40.3 ± 2.0%. Mean paired full − ERM flip gap is −0.17 pp, but the five seeds are +1.80, +0.75, +2.30, −1.05, −4.65. Under the withheld B₂ direction (TV = 0.55): ERM 10.9 ± 0.8%, no-reenc 10.9 ± 0.6%, CG 10.9 ± 0.6% (mean paired full − ERM −0.02 pp). Mean flip rates match; individual seeds do not. Full versus no re-encoding stays within 0.05 pp on every error seed in this file. The full side-by-side table, including target error, is in the response to z2Uv Q1. In the linear script, full CausalGuard applies the mask to the recombined candidate, and no-re-encoding uses the anchor's retained features for every donor, so that consistency term is identically zero (Proposition 2). Raw data: `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`.

---

**W3 — Evidence about robust vs. spurious features**

This concern is correct. The key distinction is: a feature can be both source-stable and spurious. The mask selects for source-stability, not causal relevance with respect to unseen targets. Appendix B states: "Mask leakage. The gate can encode information about the whole input through its weights, even if only a few output coordinates remain." Appendix E: "If all real examples share the same shortcut, arbitrary feature extrapolation need not discover which change preserves the label."

In the 3D linear SCM (z2Uv Q1 protocol; 5 seeds; source P(B₁=Y) ∈ {0.7, 0.8, 0.9}), mean mask weights are: content x_c ≈ 0.89, nuisance x_s1 ≈ 0.71, nuisance x_s2 ≈ 0.52. The content dimension receives the highest weight in all 5 seeds; x_s2 (always constant during training) receives the lowest. The mask is directionally correct (content above the nuisance coordinates) but does not achieve a clean separation. Mean target-error differences versus ERM are +0.08 pp (represented) and +0.06 pp (withheld); individual represented seeds run from −1.25 pp to +0.95 pp. In SCM-B, with every source at P(B₁=Y) = 0.9, the reversed-target paired gap is +0.96 pp (CausalGuard higher error than ERM) and the mask weight on x_s1 rises to about 0.81. That is the Appendix E failure case on this linear model. The PACS held-out accuracy ablation was not run, so this reply reports no image-benchmark accuracy change.

Whether the deep mask separates causally robust features from spurious source-stable features remains open. We will state that limitation in the revised manuscript.

---

**Q1 — Dataset choice rationale**

PACS tests shifts across depiction styles (art, cartoon, photo, sketch). VLCS spans photographic datasets with different label spaces (VOC2007, LabelMe, Caltech101, SUN09), representing photography-condition and coverage shifts. Office-Home covers four object-recognition domains (Art, Clipart, Product, Real World) with diverse visual styles. We follow DomainBed to enable comparison with a large existing literature. We will add an explicit rationale paragraph in Section 5: these benchmarks cover nuisance-driven style and rendering shifts and do not cover text-image, label-mechanism, or ecological distributional shifts. TerraIncognita and WILDS are important future evaluations.

---

**Q2 — Candidate diversity and target coverage**

The normalized coverage metric is the entropy-based effective rank of the normalized intervention second-moment matrix G̃ = G/tr(G): r_eff = exp(−Σ_k λ_k(G̃) log λ_k(G̃)) (Appendix G, Eq. 29). This measures the directional span of accepted candidate displacements — not target-support coverage. Table 5's caption states: "The coverage column is a normalized diagnostic; it is not an estimate of 1 − η in Theorem 1." Appendix G: "Full-rank candidate covariance does not establish a density-ratio bound or identify the target discrepancy η."

We will add a labeled definition box in the main text and an explicit sentence: "This metric measures the directional span of learned candidates; it does not estimate the target support discrepancy η in Theorem 1, which is not identifiable from source data alone." Table 8 reports acceptance of 76.4–82.5% for nuisance-changing controls and 11.2–18.6% for class-changing controls, supporting the audit on those specific tested controls.

