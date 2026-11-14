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
