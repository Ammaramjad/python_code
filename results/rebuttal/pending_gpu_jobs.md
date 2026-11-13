# GPU jobs still pending

Checked on this VM on 2026-11-13: `nvidia-smi` is not installed, `/dev/nvidia0` is absent, and `python3 scripts/verify_gpu.py` exits because `torch` is not installed. The recovered Cloud Agent install (`scripts/cloud_agent_install.sh`) pins the CPU scientific stack and does not install CUDA PyTorch. The CausalGuard training code, DomainBed checkout, and PACS/VLCS/Office-Home datasets are not in this repository. `scripts/launch_manifest.py` is not in the repository, so `scripts/run_manifest_pacs.yaml` cannot be launched here.

No GPU job below was started. Previously circulated per-domain and RTX 4090 numbers are not logs in this repository and are not in the paste-ready replies.

## Manifest jobs (`scripts/run_manifest_pacs.yaml`)

All nine entries are `status: PENDING`. Protocol in the file: ImageNet ResNet-50, 224×224, batch 32, 5000 steps, source-only selection, label `reproduced_rebuttal`. Several CausalGuard hyperparameters are still `null`.

| Job id | Algorithm | test_env | seed |
|---|---|---|---|
| `pacs_erm_seed0` | ERM | 0 (art_painting) | 0 |
| `pacs_erm_seed1` | ERM | 1 (cartoon) | 1 |
| `pacs_erm_seed2` | ERM | 2 (photo) | 2 |
| `pacs_cg_full_seed0` | CausalGuard | 0 | 0 |
| `pacs_cg_full_seed1` | CausalGuard | 1 | 1 |
| `pacs_cg_full_seed2` | CausalGuard | 2 | 2 |
| `pacs_cg_nore_seed0` | CausalGuard_NoReencoding | 0 | 0 |
| `pacs_cg_nore_seed1` | CausalGuard_NoReencoding | 1 | 1 |
| `pacs_cg_nore_seed2` | CausalGuard_NoReencoding | 2 | 2 |

The manifest does not cover Sketch, and it does not cross all four PACS domains with all three seeds. The no-re-encoding variant (bypass versus direct) is still unresolved (`rebuttal/unresolved_items.md`, item U5) and must be fixed before those three ablation jobs run.

## Matched MixStyle comparison (Experiment C)

Not started. Required run, once code and data exist: official MixStyle, α chosen on source validation only, same ImageNet ResNet-50, DomainBed held-out splits, source-only checkpoint selection, and step budget as the submitted runs, on PACS, VLCS, and Office-Home. Intended output: `results/rebuttal/experiment_C_mixstyle.csv`. MIRO, Causal Matching, and Causal Balancing are separate unmatched jobs and were also not started.

## GPU profiling (Experiment E / itnv Q5 protocol)

Not started. Required measurement: ResNet-50 on PACS with Sketch held out; mixed FP16; batch size 32; 5,000 steps; 5 runs; donor-bank construction included in training time; inference after 50 warm-up iterations and 200 timed repetitions at batch 1 and batch 32. Record training wall-clock, peak GPU memory, batch-1 latency, and batch-32 throughput for ERM, SWAD, and CausalGuard, with `torch.cuda.synchronize()` before timed regions. Intended output: `results/rebuttal/experiment_E_efficiency.csv`.

## CPU work that did run

Side-by-side tables from the raw z2Uv Q1 CSVs, the Experiment D summaries, the SCM-B summary, and an arithmetic check of the old draft per-domain cells are in `results/rebuttal/run_reconciliation.md`. That check does not verify the draft cells.
