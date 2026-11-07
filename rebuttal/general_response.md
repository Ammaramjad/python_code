# General Response — CausalGuard ICLR 2027 Rebuttal

**Submission 61846**  
**Status:** DRAFT — contains only completed and verified material. Sections marked [PENDING: EXP X] indicate results awaiting experiments on the GPU workstation.

---

## Summary of Revisions

We thank all reviewers for their substantive engagement. We address shared concerns first, then reply individually.

### Common Themes

**1. Comparisons with MixStyle and MIRO (z2Uv-W1,W8; itnv-W1)**

We acknowledge that matched reruns of MixStyle and MIRO under the identical DomainBed protocol are missing from the submitted paper and are the most important empirical gap. We are preparing matched reruns (Experiment C, same ResNet-50 backbone, same ImageNet pretrain checkpoint, same source-only selection rule, same step budget). [PENDING: EXP C — results will be added here when available]

Regarding the distinction from MixStyle specifically: MixStyle interpolates feature statistics (mean and variance) in feature space and does not apply a re-encoding path. Our re-encoding passes the recombined feature through the same mask and classifier as factual features. Without re-encoding, consistency over discarded coordinates is identically zero regardless of the learned partition (Proposition 2). We test this directly in Table 3 (no-re-encoding variant). [PENDING: EXP B — accuracy comparison for this ablation]

**2. Per-domain results (itnv-W3)**

Table 2 reports only dataset-level aggregates. Per-domain values (per held-out domain × per seed) are defined in Appendix J and will be reported for all three datasets. [PENDING: EXP A — requires original logs or reruns]

**3. Broader benchmarks (itnv-W2; z2Uv-W5)**

We acknowledge PACS/VLCS/Office-Home are saturated benchmarks. WILDS is explicitly noted in the paper as "a relevant future extension, not a completed evaluation." We are estimating compute cost for TerraIncognita. [PENDING: EXP broader]

**4. Computational overhead (itnv-W5)**

We provide analytical scaling in Appendix H. Measured wall-clock training and inference times for ERM, SWAD, and CausalGuard under identical conditions are being measured. [PENDING: EXP E]

**5. The 82.37 accuracy value**

This value appears in Figure 3c and Table 5 (threshold sweep) and in Table 7 (temperature sweep). It represents the per-sweep peak of the VLCS domain-macro mean, evaluated at γ=0.60 and Tm=0.5 respectively. The Table 2 value of 81.2±0.4 is the five-run mean at the selected configuration, while the sweep panels are descriptive reports of a range of settings. We will add an explicit note in the manuscript clarifying this aggregation. We note that the sweep peak at 82.37 is consistent with the upper end of the 81.2±0.4 interval at ≈2 SD above the mean, and that the threshold sweep explicitly states "accuracy from the sweep is reported descriptively and does not define the source-validation selection criterion."

**Authors' acknowledgment of limitations**

The paper explicitly states the following limitations; we will make them more prominent in the revision:
- "It does not establish latent causal identification or unrestricted out-of-distribution robustness." (Abstract)
- "The learned partition is operational, and robustness extends only to the tested shifts and the assumptions stated in the analysis." (Section 1)
- "These results motivate evaluating stability jointly with intervention quality; low consistency alone cannot certify unrestricted transfer." (Section 6)

---

## Manuscript Changes Prepared

1. **Notation table** (Table 4): Add `b0` for mask budget scalar (currently mentioned in text but not in table). Distinguish `b` (semantic map) from `b0` (budget parameter) throughout.

2. **Section 5.2**: Add explicit note that the 82.37 in sweep figures corresponds to the per-sweep VLCS domain-macro peak at the selected configuration, and that it is distinct from the five-run mean in Table 2.

3. **Section 4 / Appendix K.2**: Clarify the actual τ value used in executed runs. [Requires author input — we note that Appendix K.2 states "the hypothetical probability floor is valid only for class count C < 100 and is not an asserted setting of the benchmark runs," which suggests τ may not have been used in executed runs. This must be clarified and the theoretical claims qualified accordingly if τ=0.]

4. **Section 5.1**: Add explicit dataset choice rationale — these benchmarks follow the DomainBed standard protocol, enabling comparison with a large body of published results. We acknowledge they do not represent all types of distribution shift.

5. **Appendix J**: Complete the per-domain table (EXP A results when available).
