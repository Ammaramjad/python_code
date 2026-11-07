# Response to Reviewer bpmm — CausalGuard ICLR 2027

**Submission 61846**  
**Status:** DRAFT — only completed and verified evidence is included. Items marked [PENDING] await experiments on the GPU workstation.

---

## W1: Clear Definitions, Notation, Citations, and Figures

**Concern:** Notation overloading, citation gaps, figures need clearer labeling.

**Response:**

**Notation issues identified and corrected:**

1. **b vs. b0 conflict:** Eq. 7 uses b0 for the mask budget scalar, with the note "The notation b0 distinguishes the scalar mask budget from semantic map b." However, Table 4 (Appendix A, the notation summary) does not include b0. We will add a row for b0 in Table 4 and audit the manuscript for all uses of b (semantic map) vs. b0 (mask budget scalar) to ensure they are always disambiguated.

2. **Optimization reference p̄ vs. teacher t:** These two are carefully distinguished in the text (Appendix A: "The optimization reference p̄ is distinct from the compatibility teacher t.") but Figure 1 uses "compatibility teacher" and "optimization reference" in separate boxes — this is correct and should be retained. We will add explicit labels to the main text first occurrence of each symbol.

3. **w: weight function vs. classifier weight:** The paper uses w for the density-ratio reweighting function in the theory section and implicitly for classifier weights in the method section. These should be disambiguated in the notation table.

4. **Figures:** Figure 1 (architecture) uses small text in diagram boxes. We will increase font size and add a legend explicitly mapping colors/arrow styles to their meaning (solid = computational sequence; dashed = factual/candidate inputs).

**Manuscript changes prepared:**
- Revised Table 4 with b0, explicit w disambiguation, and all appendix-introduced symbols
- Figure 1 revised with larger labels
- Figure 3: add explicit y-axis label for "Mean Acc." panel showing this is VLCS domain-macro

---

## W2: Accuracy-Based Re-encoding Ablations

**Concern:** Table 3 reports mechanism diagnostics but not held-out-domain accuracy for ablation variants. The re-encoding ablation effect on accuracy is not reported.

**Response:**

This is correct. Table 3 does not include accuracy. Table 2 includes "Uniform accepted donors," "Filtered, no diversity," and "Unfiltered diverse donors" as variants but does not explicitly include "No re-encoding" as a row in the accuracy table.

We are running Experiment B to provide the missing accuracy comparison.

[PENDING: EXP B — table will be inserted here with format:]

| Variant | PACS | VLCS | Office-Home | Disagree ↓ | Eff. donors |
|---|---|---|---|---|---|
| Full CausalGuard | 90.3±0.5 (orig) | 81.2±0.4 (orig) | 75.6±0.5 (orig) | 3.4±0.5 | 6.8±0.4 |
| No re-encoding (bypass) | — | — | — | 5.9±0.7 | 6.7±0.5 |

**Definition of "No re-encoding" for the accuracy table:** The no-re-encoding variant uses the factual retained features cϕ(ui) for the consistency loss denominator, making the KL identically zero (a computational bypass as in Proposition 2). All other components (compatibility gate, donor policy, supervised loss) are held fixed. The accuracy reported for this variant in Experiment B will be from an independent training run, not derived from the Table 3 numbers.

We note that Table 3 shows disagreement of 5.9% for no-re-encoding vs. 3.4% for full CausalGuard. This is mechanistically informative but does not directly address whether the re-encoding improves accuracy. Experiment B provides that direct comparison.

---

## W3: Evidence About Robust vs. Spurious Features

**Concern:** Whether the mask learns causally robust vs. spurious source-stable features is empirically unclear.

**Response:**

This concern is correct and is acknowledged in multiple appendix sections. The key distinction is: a feature can be both source-stable and spurious (a background color that happens to correlate with class in all source domains). The mask selects for stability within the source distribution, not for causal relevance with respect to unseen targets.

Appendix B states: "Mask leakage. The gate can encode information about the whole input through its weights, even if only a few output coordinates remain. Probe-based and controlled-intervention diagnostics are therefore necessary even when masks look sharply binary."

Appendix E: "If all real examples share the same shortcut, arbitrary feature extrapolation need not discover which change preserves the label."

**Synthetic SCM evidence (Experiment D — completed):**

In a 2D linear SCM with known ground truth (content=dim0, nuisance=dim1, spurious sources with ρ ∈ {0.90, 0.70, 0.50}):

| Seed | CG content mask (dim0) | CG nuisance mask (dim1) | Mask discriminates? |
|---|---|---|---|
| 0 | 0.920 | 0.838 | Partial (content weighted higher) |
| 1 | 0.908 | 0.793 | Partial |
| 2 | 0.532 | 0.408 | Minimal |

**Findings:**
- In 2 of 3 seeds, the mask weights content (dim0) > nuisance (dim1), consistent with learning to suppress spurious correlation.
- In 1 of 3 seeds, the mask barely differentiates the two dimensions (0.53 vs. 0.41) — the method fails to identify the content feature.
- The accuracy difference between CG and ERM is small in all cases because the linear ERM also partially recovers the content feature when sources have varying spurious strengths.
- The **ambiguous condition** (all sources ρ=0.95) causes CausalGuard to collapse to the shortcut (accuracy=1.00 on matching target, but would fail on reversed target). This is the observational ambiguity case from Appendix E.

**Conclusion:** The mask does not reliably separate robust from spurious features, particularly when source diversity is insufficient. This confirms the theoretical scope: the method helps when source spurious correlations vary (providing inductive signal), but cannot recover from complete source confounding. We will make this limitation more prominent in the revised manuscript.

[PENDING: EXP D on deep learning backbone — will provide richer diagnostics including feature probe analysis]

---

## W4: Dataset Rationale

**Concern:** The choice of PACS, VLCS, Office-Home is not explicitly motivated.

**Response:**

We will add an explicit rationale paragraph at the start of Section 5:

> "We evaluate on PACS, VLCS, and Office-Home following the DomainBed benchmark protocol (Gulrajani & Lopez-Paz, 2021). These benchmarks provide (1) multiple held-out-domain conditions per dataset, enabling per-domain diagnostic analysis; (2) a large body of published results enabling comparison under a shared protocol; and (3) domain shifts driven by style, rendering, and photography conditions — a subset of the nuisance-driven shifts that CausalGuard targets. They do not represent text-image shifts, label-mechanism shifts, or the ecological distributional shifts in WILDS. We acknowledge this limitation and note TerraIncognita and WILDS as important future evaluations."

---

## W5: Coverage Metric Definition and Connection to Theorem

**Concern:** The coverage metric in Figure 3 is not formally defined or connected to the theorem.

**Response:**

We acknowledge this needs clearer exposition. The normalized coverage metric is defined in Appendix G (Eq. 29):

> G̃ = G / tr(G), reff = exp(−Σk λk(G̃) log λk(G̃))

This is the entropy-based effective rank of the normalized intervention second-moment matrix. It measures **directional span** of the candidate displacements, not **target-support coverage** in the theorem's sense.

The paper already states explicitly in Table 5's caption: "The coverage column is a normalized diagnostic; it is not an estimate of 1 − η in Theorem 1." And Appendix G: "Full-rank candidate covariance does not establish a density-ratio bound or identify the target discrepancy η."

The connection to the theorem is indirect: the diversity term in the donor policy (log det(G(q)+εI)) encourages higher effective rank, which helps when the target's nuisance variation is captured within the candidate covariance subspace. But large effective rank does not certify that the target is in the support — this requires knowing the target distribution, which is unavailable.

**Manuscript change:** We will add a labeled definition box for the coverage metric in the main text (currently only in appendix), and add an explicit sentence: "This metric measures the directional span of learned candidates; it does not estimate the target support discrepancy η in Theorem 1, which is not identifiable from source data alone."

**Controlled geometry experiment:** [PENDING: Phase 5 coverage geometry experiment — holding average displacement energy fixed while varying directional span, evaluating on withheld nuisance directions]
