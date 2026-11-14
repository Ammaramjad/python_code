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
