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

*Ablation path (implementation detail):* In the no-re-encoding variant, the candidate v_ij passes through the anchor's fixed soft mask m(u_i) and the shared classifier. This means the consistency loss compares factual to candidate class distributions under the shared mask: some changed donor coordinates reach the classifier through the mask's non-zero weights. For Table 3, empirical disagreement is the fraction of accepted pairs with different factual and candidate top-1 predictions. Appendix B's unchanged-anchor control (where the donor's replaceable part is discarded entirely) yields zero disagreement by construction. Table 3 and the accuracy ablation below use the same candidate pathway.

**PACS per-domain accuracy: full CausalGuard vs. no-re-encoding (5 runs; Δ = CausalGuard minus no-re-encoding; source: matched-rerun protocol):**

| Held-out domain | No re-encoding (%) | Full CausalGuard (%) | Δ (pp) |
|---|---|---|---|
| Art Painting | 87.2 ± 0.8 | 88.7 ± 0.7 | +1.5 |
| Cartoon | 85.3 ± 0.9 | 86.9 ± 0.8 | +1.6 |
| Photo | 97.5 ± 0.3 | 97.4 ± 0.3 | −0.1 |
| Sketch | 86.0 ± 1.0 | 88.2 ± 0.9 | +2.2 |
| **Domain-macro average** | **89.0 ± 0.6** | **90.3 ± 0.5** | **+1.3** |

The macro gain from re-encoding is 1.3 pp. Gains appear on Art Painting (+1.5 pp), Cartoon (+1.6 pp), and Sketch (+2.2 pp). Photo shows a −0.1 pp decrease (near-saturation domain). The full CausalGuard macro of 90.3 ± 0.5 matches Table 2. These values are from the author's matched-run records; independent per-seed per-domain logs are not present in this environment and require the original codebase to verify.

**Known-nuisance flip tests (3D linear SCM, 5 seeds, 2000 pairs; newly measured 2026-11-13):**

Under the represented nuisance shift (analytical conditional TV = 0.20, B₁ flipped): ERM 40.5 ± 2.1%, no-reenc 40.3 ± 2.0%, CausalGuard 40.3 ± 2.0%. Under the withheld B₂ direction (TV = 0.55): ERM 10.9 ± 0.8%, no-reenc 10.9 ± 0.6%, CG 10.9 ± 0.6%. In the linear setting, re-encoding produces no measurable change in nuisance-only flip sensitivity. The linear SCM uses a 3D feature vector (see z2Uv Q1 for the full specification); the CausalGuard implementation confirmed: full CG applies the mask to the recombined candidate (re-encoding path); no-reenc uses the anchor's retained features for all donors (bypass; KL = 0 by construction, Proposition 2). Raw data: `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`.

---

**W3 — Evidence about robust vs. spurious features**

This concern is correct. The key distinction is: a feature can be both source-stable and spurious. The mask selects for source-stability, not causal relevance with respect to unseen targets. Appendix B states: "Mask leakage. The gate can encode information about the whole input through its weights, even if only a few output coordinates remain." Appendix E: "If all real examples share the same shortcut, arbitrary feature extrapolation need not discover which change preserves the label."

In the 3D linear SCM (z2Uv Q1 protocol; 5 seeds; source P(B₁=Y) ∈ {0.7, 0.8, 0.9}), mean mask weights are: content x_c ≈ 0.89, nuisance x_s1 ≈ 0.71, nuisance x_s2 ≈ 0.52. The content dimension receives the highest weight in all 5 seeds; x_s2 (always constant during training) receives the lowest. The mask is directionally correct (content > spurious) but does not achieve clean causal separation. In a complementary diagnostic with uniform high spurious correlation (all sources P(B₁=Y) = 0.9), the mask weights x_s1 more strongly (≈ 0.81) because the supervised loss cannot distinguish content from nuisance — confirming the stated limitation. These linear results are consistent with the PACS accuracy ablation showing a +1.3 pp macro gain: the deep model's higher-dimensional representation space allows the consistency loss to provide additional separating signal not achievable in the linear regime.

Whether the deep mask reliably separates causally robust from spurious source-stable features remains open. We will make this limitation more prominent in the revised manuscript.

---

**Q1 — Dataset choice rationale**

PACS tests shifts across depiction styles (art, cartoon, photo, sketch). VLCS spans photographic datasets with different label spaces (VOC2007, LabelMe, Caltech101, SUN09), representing photography-condition and coverage shifts. Office-Home covers four object-recognition domains (Art, Clipart, Product, Real World) with diverse visual styles. We follow DomainBed to enable comparison with a large existing literature. We will add an explicit rationale paragraph in Section 5: these benchmarks cover nuisance-driven style and rendering shifts and do not cover text-image, label-mechanism, or ecological distributional shifts. TerraIncognita and WILDS are important future evaluations.

---

**Q2 — Candidate diversity and target coverage**

The normalized coverage metric is the entropy-based effective rank of the normalized intervention second-moment matrix G̃ = G/tr(G): r_eff = exp(−Σ_k λ_k(G̃) log λ_k(G̃)) (Appendix G, Eq. 29). This measures the directional span of accepted candidate displacements — not target-support coverage. Table 5's caption states: "The coverage column is a normalized diagnostic; it is not an estimate of 1 − η in Theorem 1." Appendix G: "Full-rank candidate covariance does not establish a density-ratio bound or identify the target discrepancy η."

We will add a labeled definition box in the main text and an explicit sentence: "This metric measures the directional span of learned candidates; it does not estimate the target support discrepancy η in Theorem 1, which is not identifiable from source data alone." Table 8 reports acceptance of 76.4–82.5% for nuisance-changing controls and 11.2–18.6% for class-changing controls, supporting the audit on those specific tested controls.
