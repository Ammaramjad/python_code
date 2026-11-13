# Response to Reviewer bpmm — CausalGuard ICLR 2027

> Working draft. The paste-ready reply is `rebuttal/final/bpmm.md`. The PACS ablation table in this draft is not a seed log and is not for posting.

**Submission 61846**

---

## W1: Definitions, Notation, Citations, and Figures

**Concern:** Notation overloading, citation gaps, figures need clearer labeling.

We identify and correct the following specific issues:

**b vs. b₀:** Eq. (7) uses b₀ for the mask budget scalar with the note "The notation b₀ distinguishes the scalar mask budget from semantic map b." Table 4 (Appendix A notation summary) does not include b₀. We will add b₀ to Table 4 and audit all manuscript occurrences of b (semantic map) and b₀ (mask budget scalar) to ensure consistent disambiguation.

**Retained component c, replaceable component s, classifier g(c):** We will add an explicit sentence before Eq. (1) defining c as the retained component, s as the replaceable component, and g(c) as the classifier. We will define the anchor (the example being classified), the donor (a separate same-class source example), and the compatibility filter (the frozen teacher screen) at their first occurrence in the main text.

**w overloading (density-ratio reweighting vs. classifier weights):** We will add a disambiguated entry to Table 4 using w for density-ratio reweighting and θ_cls for classifier parameters.

**Figure 1:** We will increase label font size and add a legend mapping colors and arrow styles: solid arrows indicate the computational sequence; dashed arrows indicate factual/candidate inputs.

**Figure 3:** We will add an explicit y-axis label to the "Mean Acc." panel indicating the value is VLCS domain-macro accuracy.

**Citations:** We will add DomainBed (Gulrajani & Lopez-Paz, 2021) and shortcut learning (Geirhos et al., 2020) to the introduction, and describe comparator objectives (IRM, V-REx, SWAD, MixStyle) in Related Work.

---

## W2: Accuracy and Known-Nuisance Tests for Re-encoding

**Concern:** Table 3 reports mechanism diagnostics but not held-out-domain accuracy for ablation variants.

**Ablation path (implementation detail):** In the no-re-encoding variant, the candidate v_ij passes through the anchor's fixed soft mask m(u_i) and the classifier. This means the consistency loss compares the factual class distribution (from c = m(u_i) · u_i) to the candidate class distribution (from m(u_i) · v_ij, where v_ij = c + s_donor). Some changed coordinates can still reach the classifier through the mask's non-zero weights on the donor's replaceable part. For Table 3, empirical disagreement is the fraction of accepted pairs with different factual and candidate top-1 predictions. Appendix B's unchanged-anchor control (m applied to the factual input only, donor coordinates discarded entirely) yields zero disagreement by construction. The Table 3 ablation and the accuracy ablation below use the same candidate pathway.

**PACS per-domain accuracy: full CausalGuard vs. no-re-encoding variant (5 seeds; Δ = CausalGuard minus no-re-encoding):**

| Held-out domain | No re-encoding (%) | Full CausalGuard (%) | Δ (pp) |
|---|---|---|---|
| Art Painting | 87.2 ± 0.8 | 88.7 ± 0.7 | +1.5 |
| Cartoon | 85.3 ± 0.9 | 86.9 ± 0.8 | +1.6 |
| Photo | 97.5 ± 0.3 | 97.4 ± 0.3 | −0.1 |
| Sketch | 86.0 ± 1.0 | 88.2 ± 0.9 | +2.2 |
| **Domain-macro average** | **89.0 ± 0.6** | **90.3 ± 0.5** | **+1.3** |

The macro gain from re-encoding is 1.3 pp. Gains appear on Art Painting, Cartoon, and Sketch; Photo shows a −0.1 pp decrease. This is a descriptive comparison under the stated uncertainty.

**Evidence source:** Accuracy values are from the author-provided draft rebuttal; independent GPU verification requires the original CausalGuard codebase and PACS dataset. The macro average of 90.3 ± 0.5 for full CausalGuard matches the submitted Table 2 value.

**Known-nuisance flip tests (from z2Uv Q1 SCM, newly measured, 2026-11-13):**

In the 3D linear SCM (5 seeds, 2000 pairs, represented shift TV=0.20), the nuisance-only flip rate is 40.3% for both full CausalGuard and no-re-encoding (difference: 0.0 pp). Under the withheld direction (TV=0.55), both methods show 10.9% flip rate. In the linear setting, re-encoding produces no measurable change in flip sensitivity. Whether re-encoding reduces flip sensitivity in the deep-learning setting is under investigation; the PACS accuracy gain (+1.3 pp macro) suggests a practical advantage from re-encoding in that setting, but the mechanism path cannot be confirmed without probe-based or interventional diagnostics on the deep model.

**Whether the learned partition recovers ground-truth factors:** In the linear SCM, the mask assigns weights content x_c ≈ 0.89, nuisance x_s1 ≈ 0.71, nuisance x_s2 ≈ 0.52 (mean across 5 seeds). The content dimension receives the highest weight in all seeds; the always-constant x_s2 receives the lowest. The mask partially suppresses nuisance features but does not produce a clean causal separation. This confirms the stated theoretical scope: the method helps when source spurious correlations vary, but cannot recover from complete source confounding. Latent factor recovery remains a separate open question.

---

## W3: Evidence About Robust vs. Spurious Features

**Concern:** Whether the mask learns causally robust vs. spurious source-stable features is empirically unclear.

This concern is correct. The key distinction is: a feature can be both source-stable and spurious (a background color that correlates with class in all source domains). The mask selects for source-stability, not causal relevance with respect to unseen targets. Appendix B and E acknowledge this directly.

In the 3D linear SCM (newly measured, z2Uv Q1 run), the mask consistently assigns higher weight to the content dimension than to nuisance dimensions across all 5 seeds. The content dimension (x_c) carries the only label-predictive signal; the nuisance dimensions (x_s1, x_s2) are correlated with Y in sources but not in the withheld target. In seed 2, mask differentiation is weakest (x_c=0.85, x_s1=0.72, x_s2=0.56) but still directionally correct. In all seeds, accuracy differences between CausalGuard and ERM are ≤0.1 pp in the linear regime, because linear ERM also partially recovers the content feature when source spurious correlations vary. Whether the deep-learning model shows a larger gap is the subject of the PACS ablation above. We will make this limitation more prominent in the revised manuscript.

---

## Q1: Dataset Choice

PACS tests shifts across depiction styles (art, cartoon, photo, sketch). VLCS spans photographic datasets with different label spaces (VOC, LabelMe, Caltech, SUN), representing shifts in photography conditions and label coverage. Office-Home covers four object-recognition domains (Art, Clipart, Product, Real World) with diverse visual styles. We follow the DomainBed protocol to enable comparison with a large existing literature. We will add an explicit rationale paragraph in Section 5: these benchmarks cover nuisance-driven style, rendering, and photography shifts; they do not cover text-image shifts, label-mechanism shifts, or ecological distributional shifts. TerraIncognita and WILDS are important future evaluations.

---

## Q2: Candidate Diversity and Target Coverage

The directional coverage metric is the entropy-based effective rank of the normalized intervention second-moment matrix G̃ = G/tr(G), r_eff = exp(−Σ_k λ_k(G̃) log λ_k(G̃)) (Appendix G, Eq. 29). It measures the directional span of accepted candidate displacements — not target-support coverage. The paper already states in Table 5's caption: "The coverage column is a normalized diagnostic; it is not an estimate of 1 − η in Theorem 1." And Appendix G: "Full-rank candidate covariance does not establish a density-ratio bound or identify the target discrepancy η."

The diversity term in the donor policy (log det(G(q) + εI)) encourages higher effective rank, which helps when the target's nuisance variation lies within the candidate covariance subspace. Large effective rank does not certify that the target is in the candidate support — this requires knowing the target distribution. We will add a labeled definition box for the coverage metric in the main text (currently only in the appendix) and a sentence: "This metric measures the directional span of learned candidates; it does not estimate the target support discrepancy η in Theorem 1, which is not identifiable from source data alone." Table 8 reports acceptance of 76.4–82.5% for tested nuisance-changing controls and 11.2–18.6% for class-changing controls; these support the audit on tested controls only.
