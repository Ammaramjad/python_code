# Reviewer Concern Matrix — CausalGuard Submission 61846

**Date:** 2026-11-06  
**Note:** Reviewer comment files were not found in the workspace. This matrix is constructed from the concern descriptions provided in the research brief. The concern descriptions are attributed to reviewers z2Uv, itnv, and bpmm. If the actual review text is recovered, this matrix must be updated to reflect verbatim concerns.

---

## Reviewer z2Uv

### W1: Intended Shifts and Comparison with Existing Approaches

| Field | Content |
|---|---|
| **Concern** | The paper does not clearly specify which shift families the method targets, and the comparison with existing approaches (MixStyle, MIRO, causal matching) is incomplete. |
| **Paper evidence** | Section 3.1 defines nuisance interventions as "alter S while retaining content and label-generating noise." Limitations section explicitly states "robustness extends only to the tested shifts and the assumptions stated in the analysis." Related work (Section 2) acknowledges matched comparisons with causal matching and MIRO "remain important." |
| **Executable evidence** | None available (no code or logs). |
| **Missing experiment** | Experiment C: Matched MixStyle and MIRO reruns. |
| **Planned artifact** | `results/rebuttal/experiment_C_matched_competitors.csv` |
| **Current status** | PENDING — blocked by missing code, datasets, and GPU. |

### W2: Joint Backbone–Mask Failure

| Field | Content |
|---|---|
| **Concern** | The learned mask and backbone can co-adapt so that the mask retains a spurious feature that happens to be stable across the source domains but is not causally relevant. The re-encoding path removes a computational tautology but cannot prevent this failure mode. |
| **Paper evidence** | Appendix B explicitly discusses "mask leakage" and "a second collapse pathway." Section 6 (Limitations): "An operational mask is coordinate-dependent and can carry information through its gating function." Paper correctly states: "Re-encoding removes one architectural source of vacuity; it does not guarantee that optimization learns the correct factors." |
| **Executable evidence** | None available. |
| **Missing experiment** | Experiment D: Synthetic SCM with observationally ambiguous sources. |
| **Planned artifact** | `results/rebuttal/experiment_D_synthetic_scm.csv` |
| **Current status** | PENDING — blocked by missing GPU. Can be run on CPU for small-scale synthetic version. |

### W3: Bounded-Loss Assumption and Theoretical Contribution

| Field | Content |
|---|---|
| **Concern** | The theorem assumes a Lipschitz-bounded loss and conditional on κ, ρ, ξ, η which are not identified from source data. The theoretical contribution beyond standard risk transfer bounds is unclear. |
| **Paper evidence** | Section 4 explicitly states these "are assumptions or audit targets, not automatically observed." Appendix C "What can be measured" section correctly identifies which terms are estimable vs. not. The novelty claim is the decomposition and connection to the specific algorithmic audit, not the mathematical technique. |
| **Executable evidence** | None available. The probability floor τ issue (D2 above) may further weaken the theoretical claims if τ was not used in executed runs. |
| **Missing experiment** | None — this is an exposition and scoping correction, not primarily an empirical gap. Need to clarify the τ setting used in executed runs. |
| **Planned artifact** | `rebuttal/response_z2Uv.md` — precise explanation of theorem scope and what it contributes beyond generic transfer bounds. |
| **Current status** | Addressable in rebuttal text. Requires clarification of actual τ value from authors. |

### W4: Reproducibility and Tuning

| Field | Content |
|---|---|
| **Concern** | No code is released. It is unclear how hyperparameters (γ, β, λcf, τ, Tm, qmax, ρq) were selected without target labels. The tuning budget and its protocol are undisclosed. |
| **Paper evidence** | Section 5.1: "source-only selection following DomainBed." Appendix I states the threshold sweep "is descriptive; target accuracy is not used to select its operating point." Figure 3c includes accuracy at each threshold, which is consistent with post-hoc reporting of a fixed selection criterion. |
| **Executable evidence** | None available. |
| **Missing experiment** | Phase 5 hyperparameter sensitivity — small neighborhood around the source-selected configuration. |
| **Planned artifact** | `results/rebuttal/hyperparameter_sensitivity.csv` |
| **Current status** | PENDING — blocked by missing code/GPU. Rebuttal must honestly describe the actual selection protocol used. |

### W5: Realistic Benchmarks

| Field | Content |
|---|---|
| **Concern** | PACS, VLCS, and Office-Home are saturated benchmarks. WILDS or TerraIncognita would better demonstrate practical relevance. |
| **Paper evidence** | Section 5.1 explicitly notes "WILDS is a relevant future extension, not a completed evaluation reported here." |
| **Executable evidence** | None available. |
| **Missing experiment** | Phase 5 broader benchmark (TerraIncognita or WILDS task). |
| **Planned artifact** | `results/rebuttal/broader_benchmark.csv` |
| **Current status** | PENDING — blocked by missing code/GPU/datasets. |

### W6: Remaining Contribution After Qualifications

| Field | Content |
|---|---|
| **Concern** | After accounting for all stated limitations and conditional assumptions, what concrete advance does CausalGuard provide? |
| **Paper evidence** | The method provides: (i) an architectural solution to bypass vacuity (re-encoding); (ii) a theoretically motivated and empirically implemented validity–coverage trade-off; (iii) a component-wise diagnostic framework; (iv) explicitly qualified claims. These are genuine contributions even if not universal robustness. |
| **Executable evidence** | None available. The ablation Table 3 provides mechanistic evidence if the numbers are correct. |
| **Missing experiment** | Experiment B: Re-encoding ablation verification. |
| **Planned artifact** | `results/rebuttal/experiment_B_reencoding_ablation.csv` |
| **Current status** | PENDING. |

### W7: Controlled Synthetic Extrapolation Case

| Field | Content |
|---|---|
| **Concern** | A controlled case where the target shift is intentionally outside candidate support should be reported. This directly tests the stated scope limitation. |
| **Paper evidence** | Appendix E explicitly describes "a test where the target intervention is intentionally outside the training candidate support." The paper calls for this but does not report it as a completed experiment. |
| **Executable evidence** | None available. |
| **Missing experiment** | Experiment D variant 4: target variation intentionally outside candidate support. |
| **Planned artifact** | `results/rebuttal/experiment_D_out_of_support.csv` |
| **Current status** | PENDING — blocked by missing GPU. CPU-feasible for small synthetic. |

### W8: Differences from Mixing Methods

| Field | Content |
|---|---|
| **Concern** | CausalGuard's feature recombination is superficially similar to MixStyle and other feature mixing methods. The key distinctions (re-encoding, compatibility filtering, diversity) need quantitative validation. |
| **Paper evidence** | Section 2 clearly distinguishes: "MixStyle mixes feature statistics... CausalGuard instead examines endogenous feature recombination, a shared re-encoding path, and constrained donor weights." Table 3 shows no-re-encoding and uniform-donors as ablations. |
| **Executable evidence** | None available. |
| **Missing experiment** | Experiment C: MixStyle matched rerun under identical protocol. |
| **Planned artifact** | `results/rebuttal/experiment_C_mixstyle.csv` |
| **Current status** | PENDING. |

---

## Reviewer itnv

### W1: Matched Modern Competitors

| Field | Content |
|---|---|
| **Concern** | The paper does not include matched reruns of MixStyle and MIRO under the identical evaluation protocol. Published leaderboard numbers cannot substitute for matched reruns. |
| **Paper evidence** | Section 2: "direct matched comparisons with causal matching and MIRO remain important." Appendix J: "Future comparisons should include matched causal matching, MixStyle, and MIRO configurations." |
| **Executable evidence** | None. |
| **Missing experiment** | Experiment C. |
| **Planned artifact** | `results/rebuttal/experiment_C_matched_competitors.csv` |
| **Current status** | PENDING. |

### W2: Broader Benchmarks

| Field | Content |
|---|---|
| **Concern** | PACS/VLCS/Office-Home are standard but limited. TerraIncognita and WILDS evaluations are needed. |
| **Paper evidence** | WILDS acknowledged as "relevant future extension." |
| **Missing experiment** | Phase 5 broader benchmark. |
| **Current status** | PENDING. |

### W3: Per-Domain Results

| Field | Content |
|---|---|
| **Concern** | Only dataset-level aggregates are reported. Per held-out domain results for PACS (art, cartoon, photo, sketch), VLCS (VOC, LabelMe, Caltech, SUN), and Office-Home (Art, Clipart, Product, Real) are missing. |
| **Paper evidence** | Appendix J specifies the aggregation protocol: D⁻¹Σd abdr per run, then mean and SD over runs. Per-domain values abdr should be preserved "reporting domain-wise values and the selected checkpoint for each run." |
| **Missing experiment** | Experiment A: Recover per-domain results. |
| **Planned artifact** | `results/rebuttal/experiment_A_per_domain.csv` |
| **Current status** | PENDING — requires original logs. |

### W4: Practical Interpretation of the Conditional Theorem

| Field | Content |
|---|---|
| **Concern** | Theorem 1 is conditional on κ, ρ, ξ, η which are not identified from source data alone. What is the practical takeaway for a practitioner? |
| **Paper evidence** | Appendix C "What can be measured" and Appendix D explicitly address this. The theorem "should be used to structure experiments and failure analysis, not to report a numerical deployment certificate." |
| **Missing experiment** | None — exposition clarification needed. |
| **Current status** | Addressable in rebuttal text. |

### W5: Measured Computational Overhead

| Field | Content |
|---|---|
| **Concern** | The paper acknowledges extra per-epoch work but provides no wall-clock measurements. Training throughput comparison with ERM and SWAD is missing. |
| **Paper evidence** | Appendix H provides analytical scaling (O(BaJd) for candidate construction) but explicitly states "These are analytical scaling statements, not measured wall times." Section 5.1: "matching epochs alone does not establish equal wall-clock cost." |
| **Missing experiment** | Experiment E: Measured efficiency. |
| **Planned artifact** | `results/rebuttal/experiment_E_efficiency.csv` |
| **Current status** | PENDING — blocked by missing code/GPU. |

---

## Reviewer bpmm

### W1: Clear Definitions, Notation, Citations, and Figures

| Field | Content |
|---|---|
| **Concern** | Some notation is overloaded (b for both mask budget and semantic map b), citations may be incomplete, figures need clearer labeling. |
| **Paper evidence** | Table 4 (Appendix A) provides a notation table. The b/b0 distinction is documented: "The notation b0 distinguishes the scalar mask budget from semantic map b." However this only appears in Eq. 7 discussion, not in Table 4. |
| **Missing experiment** | None — manuscript revision needed. |
| **Planned artifact** | Revised notation table and manuscript changes. |
| **Current status** | Addressable in manuscript revision. |

### W2: Accuracy-Based Re-encoding Ablations

| Field | Content |
|---|---|
| **Concern** | Table 3 reports mechanism diagnostics (acceptance, preservation, disagreement, donor count) but not held-out-domain accuracy for the ablation variants. The re-encoding ablation effect on accuracy is not directly reported. |
| **Paper evidence** | Table 2 includes "No re-encoding" as a row? No — Table 2 only includes "Uniform accepted donors" and "Filtered, no diversity" and "Unfiltered diverse donors" as variants, not explicitly "no re-encoding." Table 3 diagnostics do not include accuracy. |
| **Missing experiment** | Experiment B: Accuracy comparison full vs. no-re-encoding CausalGuard. |
| **Planned artifact** | `results/rebuttal/experiment_B_reencoding_accuracy.csv` |
| **Current status** | PENDING — blocked by missing code/GPU. |

### W3: Evidence About Robust vs. Spurious Features

| Field | Content |
|---|---|
| **Concern** | Whether the mask learns to retain causally robust features or spurious source-stable features is empirically unclear. The method cannot distinguish these without interventional ground truth. |
| **Paper evidence** | Appendix B and E explicitly acknowledge this limitation. Appendix E: "If all real examples share the same shortcut, arbitrary feature extrapolation need not discover which change preserves the label." |
| **Missing experiment** | Experiment D: Synthetic SCM with known ground truth. |
| **Planned artifact** | `results/rebuttal/experiment_D_spurious_vs_robust.csv` |
| **Current status** | PENDING — blocked by GPU but synthetic version is CPU-feasible. |

### W4: Dataset Rationale

| Field | Content |
|---|---|
| **Concern** | The choice of PACS, VLCS, Office-Home is not explicitly motivated relative to the method's assumptions. Why these benchmarks? |
| **Paper evidence** | Section 5.1 cites DomainBed protocol. No explicit rationale for dataset choice. |
| **Missing experiment** | None — manuscript clarification needed. |
| **Current status** | Addressable in rebuttal text. |

### W5: Qualified Explanation and Test of Coverage

| Field | Content |
|---|---|
| **Concern** | The coverage metric (normalized directional coverage, Figure 3) is not formally defined or connected to the theorem. What does it measure and what does it not measure? |
| **Paper evidence** | Appendix G explicitly states: "Full-rank candidate covariance does not establish a density-ratio bound or identify the target discrepancy η." Table 5 notes "coverage column is a normalized diagnostic; it is not an estimate of 1 − η." Appendix G defines the effective rank via entropy of normalized eigenvalues. |
| **Missing experiment** | Phase 5: Controlled coverage geometry experiment. |
| **Planned artifact** | `results/rebuttal/coverage_geometry.csv` |
| **Current status** | PENDING. |

---

## Priority Matrix

| Experiment | Reviewer | Priority | GPU Required | Status |
|---|---|---|---|---|
| A: Per-domain results | itnv-W3 | HIGH | Required (or logs) | PENDING |
| B: Re-encoding ablation accuracy | bpmm-W2, z2Uv-W6 | HIGH | Required | PENDING |
| C: MixStyle/MIRO matched | itnv-W1, z2Uv-W1,W8 | HIGH | Required | PENDING |
| D: Synthetic SCM | z2Uv-W2,W7, bpmm-W3 | HIGH | CPU-feasible | PENDING |
| E: Efficiency measurement | itnv-W5 | MEDIUM | Required | PENDING |
| Broader benchmarks | itnv-W2, z2Uv-W5 | MEDIUM | Required | PENDING |
| Hyperparameter sensitivity | z2Uv-W4 | LOW | Required | PENDING |
| Coverage geometry | bpmm-W5 | LOW | Required | PENDING |
| Manuscript/theory corrections | z2Uv-W3, bpmm-W1 | HIGH | None | ADDRESSABLE NOW |
