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
