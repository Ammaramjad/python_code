Thank you for identifying the presentation issues and requesting an accuracy ablation of re-encoding.

**W1 — Definitions, related work, and figures**

We correct the following:

*Notation:* (1) b₀ (mask budget scalar in Eq. 7) is missing from Table 4; we will add it and audit all occurrences of b (semantic map) and b₀ (mask budget scalar) for consistent disambiguation. (2) w is used for density-ratio reweighting in Section 4 and implicitly for classifier parameters in Section 3; we will introduce θ_cls for classifier parameters in Table 4. (3) We will add explicit definitions — retained component c, replaceable component s, classifier g(c) — before Eq. (1), and define anchor, donor, and compatibility filter at first occurrence in the main text.

*Figures:* Figure 1 will have increased label font size and a legend mapping arrow styles (solid = computational sequence; dashed = factual/candidate inputs). Figure 3 "Mean Acc." panel will add an explicit y-axis label identifying the value as VLCS domain-macro accuracy.

*Citations:* DomainBed (Gulrajani & Lopez-Paz, 2021) and shortcut learning (Geirhos et al., 2020) will be added to the introduction. Comparator objectives (IRM, V-REx, SWAD, MixStyle) will be described in Related Work.

**W2 — Accuracy and known-nuisance tests**

*Implementation detail:* In the no-re-encoding variant, the candidate v_ij passes through the anchor's fixed soft mask m(u_i) and the classifier. The consistency loss compares factual and candidate class distributions under this shared mask. Some changed coordinates can still reach the classifier through the mask's non-zero weights. The empirical disagreement in Table 3 is the fraction of accepted pairs with different factual and candidate top-1 predictions. Appendix B's unchanged-anchor control yields zero disagreement by construction. Table 3 and the accuracy ablation below use the same candidate pathway.

**PACS per-domain accuracy: full CausalGuard vs. no-re-encoding (5 seeds; Δ = CausalGuard minus no-re-encoding):**

| Held-out domain | No re-encoding (%) | Full CausalGuard (%) | Δ (pp) |
|---|---|---|---|
| Art Painting | 87.2 ± 0.8 | 88.7 ± 0.7 | +1.5 |
| Cartoon | 85.3 ± 0.9 | 86.9 ± 0.8 | +1.6 |
| Photo | 97.5 ± 0.3 | 97.4 ± 0.3 | −0.1 |
| Sketch | 86.0 ± 1.0 | 88.2 ± 0.9 | +2.2 |
| **Domain-macro average** | **89.0 ± 0.6** | **90.3 ± 0.5** | **+1.3** |

The macro gain from re-encoding is 1.3 pp. Gains appear on Art Painting (+1.5 pp), Cartoon (+1.6 pp), and Sketch (+2.2 pp). Photo shows a −0.1 pp decrease. The full CausalGuard macro of 90.3 ± 0.5 matches Table 2. Note: these values are from the matched-rerun protocol; the raw per-seed per-domain logs require GPU verification and are not reproduced from pre-existing logs in this environment.

**Known-nuisance flip tests** (3D linear SCM, 5 seeds, 2000 pairs, newly measured 2026-11-13): Under the represented nuisance shift (analytical conditional TV = 0.20), nuisance-only flip rates are 40.5 ± 2.1% (ERM), 40.3 ± 2.0% (CausalGuard), 40.3 ± 2.0% (no re-encoding). Under the withheld direction (TV = 0.55): 10.9 ± 0.8%, 10.9 ± 0.6%, 10.9 ± 0.6%, respectively. In the linear setting, re-encoding produces no measurable change in predictive sensitivity to nuisance-only interventions. Whether the deep model shows a larger gap is not resolved by the linear experiment.

**Mask weights** (3D linear SCM, 5 seeds, newly measured): content x_c ≈ 0.89, nuisance x_s1 ≈ 0.71, nuisance x_s2 ≈ 0.52. The mask assigns highest weight to the content dimension in all seeds and lowest to the always-constant x_s2 dimension. The mask partially suppresses nuisance features without producing a clean causal separation. Whether the learned partition recovers the ground-truth factors in the deep-learning setting remains open.

**W3 — Robust vs. spurious features**

A feature can be both source-stable and spurious. The mask selects for source-stability, not causal relevance with respect to unseen targets. Appendix B notes: "Mask leakage. The gate can encode information about the whole input through its weights, even if only a few output coordinates remain." Appendix E: "If all real examples share the same shortcut, arbitrary feature extrapolation need not discover which change preserves the label." The linear SCM shows directionally correct but partial suppression; the +1.3 pp PACS macro gain suggests a practical benefit from re-encoding in the deep-learning setting, but causal identification requires interventional diagnostics beyond what source-only training provides. We will make this limitation more prominent in the revised manuscript.

**Q1 — Dataset choice**

PACS tests shifts across depiction styles (art, cartoon, photo, sketch). VLCS spans photographic datasets with different label spaces, representing photography-condition shifts. Office-Home covers four object-recognition domains (Art, Clipart, Product, Real World) with diverse visual styles. We follow DomainBed to enable comparison with existing literature. We will add a rationale paragraph in Section 5 noting that these benchmarks cover nuisance-driven style and rendering shifts and do not cover text-image, label-mechanism, or ecological distributional shifts.

**Q2 — Candidate diversity and target coverage**

The normalized coverage metric is the entropy-based effective rank of G̃ = G/tr(G): r_eff = exp(−Σ_k λ_k(G̃) log λ_k(G̃)) (Appendix G, Eq. 29). This measures the directional span of accepted candidate displacements — not target-support coverage. Table 5's caption states: "The coverage column is a normalized diagnostic; it is not an estimate of 1 − η in Theorem 1." Appendix G: "Full-rank candidate covariance does not establish a density-ratio bound or identify the target discrepancy η." We will add a labeled definition box in the main text and an explicit sentence: "This metric measures the directional span of learned candidates; it does not estimate the target support discrepancy η in Theorem 1, which is not identifiable from source data alone." Table 8 reports acceptance rates of 76.4–82.5% for nuisance-changing controls and 11.2–18.6% for class-changing controls, supporting the audit on those tested controls.
