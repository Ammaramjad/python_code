Thank you for requesting a closer baseline, individual domain results, broader shift evidence, and measured computational cost.

---

**Q1 — Direct competitors**

The submitted manuscript reports dataset-macro accuracy only (Table 2): ERM 86.2 ± 0.7 / 78.5 ± 0.6 / 71.8 ± 0.8 and CausalGuard 90.3 ± 0.5 / 81.2 ± 0.4 / 75.6 ± 0.5 on PACS, VLCS, and Office-Home. Those macros are manuscript figures. The per-seed, per-domain logs are not in this repository.

We do not post a per-domain ERM, SWAD, MixStyle, or CausalGuard table.

These requested experiments are still open, and this reply contains none of their figures: per-domain results on PACS, VLCS, and Office-Home; a matched MixStyle comparison; the PACS re-encoding accuracy ablation; and GPU training time, peak memory, and inference timing.

What remains to be run, and has not been started:

- MixStyle from the official implementation, with α chosen on source validation only, ImageNet ResNet-50, DomainBed held-out splits, source-only checkpoint selection, and the same step budget as the submitted runs, on PACS, VLCS, and Office-Home.
- The same protocol for MIRO, Causal Matching, and Causal Balancing. MIRO uses a frozen pretrained reference beyond ImageNet initialization and will be labeled as such if it is run.

The controlled linear SCM in the response to z2Uv Q1 compares ERM, full CausalGuard, and the unchanged-anchor bypass on target error and on the paired prediction flip rate with resampled observation noise, including paired seed differences. That comparison is not a substitute for the image-benchmark rerun.

---

**Q2 — Broader benchmarks**

DomainNet, TerraIncognita, and iWildCam remain open evaluations. The SCM experiment in the response to z2Uv Q1 tests a represented B₁ shift and a withheld B₂ direction under a fixed label mechanism. We will add an explicit statement in Section 5 that the submitted benchmarks cover style, rendering, and photography shifts and do not cover text-image, label-mechanism, or ecological distributional shifts.

---

**Q3 — Individual held-out domains**

Per-domain accuracies are not available. The manuscript reports dataset macros (Table 2) under the Appendix J aggregation: the domain-macro score D⁻¹ Σ_d a_{bdr} for each run, then the mean and standard deviation over runs. We do not fill the missing per-domain table.

---

**Q4 — Practical interpretation of Theorem 1**

Source-validation risk is used only for checkpoint selection. A frozen source audit can flag low acceptance, concentrated donor weights, and high disagreement on accepted interventions. Those quantities are observable from source data without target labels. The target-dependent quantities κ, ρ, and η remain unknown for an unseen target. The candidate directional coverage metric (Appendix G) measures the directional span of accepted candidates and does not estimate 1 − η. The theorem's practical role is structured failure analysis: low acceptance or concentrated weights signal a potentially unfavourable validity–coverage trade-off. We will add a summary box in the revision.

---

**Q5 — Computational overhead**

GPU training time, peak memory, and inference latency have not been measured. We do not quote those figures.

At deployment the manuscript uses the backbone, learned mask, and classifier only. Donor construction, compatibility screening, and the donor policy solver are training-only. That architectural statement is not a measured latency.
