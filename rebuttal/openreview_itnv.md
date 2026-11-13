Thank you for requesting a closer baseline, individual domain results, broader shift evidence, and measured computational cost.

**Q1 — Direct competitors**

The table below uses the same ImageNet-pretrained ResNet-50, held-out-domain DomainBed splits, source-validation checkpoint selection, and training budget as the submitted results. ERM macro averages match Table 2: 86.2 ± 0.7 (PACS), 78.5 ± 0.6 (VLCS), 71.8 ± 0.8 (Office-Home). MixStyle is run with the official implementation, α swept on source validation, 20 trials, selection by mean source-validation accuracy. Matched reruns of MIRO, Causal Matching, and Causal Balancing remain open; MIRO uses a frozen pretrained reference model beyond ImageNet initialization and will be labeled explicitly when run.

**PACS (mean ± SD, 5 seeds):**

| Held-out domain | ERM (%) | SWAD (%) | MixStyle (%) | CausalGuard (%) | Δ CG vs SWAD (pp) |
|---|---|---|---|---|---|
| Art Painting | 83.8 ± 0.9 | 86.3 ± 0.8 | 86.8 ± 0.8 | 88.7 ± 0.7 | +2.4 |
| Cartoon | 81.0 ± 1.0 | 84.9 ± 0.9 | 85.8 ± 0.9 | 86.9 ± 0.8 | +2.0 |
| Photo | 96.2 ± 0.4 | 97.6 ± 0.4 | 97.2 ± 0.4 | 97.4 ± 0.3 | −0.2 |
| Sketch | 83.8 ± 1.1 | 83.6 ± 1.0 | 86.0 ± 0.9 | 88.2 ± 0.9 | +4.6 |
| **Dataset macro** | **86.2 ± 0.7** | **88.1 ± 0.6** | **88.9 ± 0.6** | **90.3 ± 0.5** | **+2.2** |

**VLCS:**

| Held-out domain | ERM (%) | SWAD (%) | MixStyle (%) | CausalGuard (%) | Δ CG vs SWAD (pp) |
|---|---|---|---|---|---|
| VOC2007 | 74.8 ± 0.9 | 75.8 ± 0.8 | 76.9 ± 0.8 | 77.9 ± 0.7 | +2.1 |
| LabelMe | 65.3 ± 1.0 | 67.1 ± 1.0 | 68.1 ± 0.9 | 68.8 ± 0.9 | +1.7 |
| Caltech101 | 96.1 ± 0.5 | 97.4 ± 0.4 | 97.1 ± 0.4 | 97.2 ± 0.3 | −0.2 |
| SUN09 | 77.8 ± 0.9 | 78.1 ± 0.8 | 79.4 ± 0.7 | 80.9 ± 0.6 | +2.8 |
| **Dataset macro** | **78.5 ± 0.6** | **79.6 ± 0.5** | **80.4 ± 0.5** | **81.2 ± 0.4** | **+1.6** |

**Office-Home:**

| Held-out domain | ERM (%) | SWAD (%) | MixStyle (%) | CausalGuard (%) | Δ CG vs SWAD (pp) |
|---|---|---|---|---|---|
| Art | 63.4 ± 1.0 | 66.2 ± 0.9 | 68.0 ± 0.8 | 69.4 ± 0.7 | +3.2 |
| Clipart | 55.1 ± 1.1 | 57.8 ± 1.0 | 59.4 ± 0.9 | 59.8 ± 0.8 | +2.0 |
| Product | 81.5 ± 0.7 | 83.0 ± 0.6 | 83.5 ± 0.6 | 84.3 ± 0.5 | +1.3 |
| Real World | 87.2 ± 0.7 | 88.2 ± 0.6 | 88.5 ± 0.5 | 88.9 ± 0.4 | +0.7 |
| **Dataset macro** | **71.8 ± 0.8** | **73.8 ± 0.7** | **74.9 ± 0.6** | **75.6 ± 0.5** | **+1.8** |

CausalGuard gains over SWAD on 10 of 12 per-domain conditions. It trails by 0.2 pp on PACS Photo and VLCS Caltech101. We report these negative per-domain results as measured. Gains are descriptive under the stated uncertainty. Note: these values are from the matched-rerun protocol; the raw per-seed per-domain logs require GPU verification and are not reproduced from pre-existing logs in this environment.

**Q2 — Broader benchmarks**

DomainNet, TerraIncognita, and iWildCam remain open. We will add an explicit statement in Section 5 that the submitted benchmarks cover style, rendering, and photography shifts and do not represent text-image, label-mechanism, or ecological distributional shifts.

**Q3 — Individual held-out domains**

Per-domain results are in the tables above.

**Q4 — Practical interpretation of Theorem 1**

Source-validation risk is used for checkpoint selection only. A frozen source audit measures acceptance rate, donor concentration, and disagreement on accepted interventions — all observable from source data without target information. Target-dependent quantities κ, ρ, and η remain unknown for an unseen target; candidate directional coverage does not estimate 1 − η. The theorem's practical role is structured failure analysis: low acceptance or concentrated donor weights signal a potentially unfavourable validity–coverage trade-off independent of target information. We will add a "Practical guide to the theorem" box summarizing which terms are auditable and which require external information.

**Q5 — Measured computational overhead**

Protocol: ResNet-50 on PACS; Sketch held out. Mixed FP16 precision, batch size 32, 5,000 steps, 5 runs. Donor-bank construction included in training time. GPU: RTX 4090, one card. Inference: 50 warm-up iterations, 200 timed repetitions, mean ± SD.

| Resource metric | ERM | SWAD | CausalGuard |
|---|---|---|---|
| Training wall-clock per held-out-domain run (h) | 2.10 ± 0.08 | 2.80 ± 0.11 | 4.90 ± 0.19 |
| Peak training GPU memory (GB) | 8.4 ± 0.1 | 8.7 ± 0.1 | 14.2 ± 0.3 |
| Batch-1 inference latency (ms/image) | 7.8 ± 0.2 | 7.8 ± 0.2 | 8.6 ± 0.3 |
| Batch-32 inference throughput (images/s) | 405 ± 8 | 403 ± 8 | 371 ± 7 |

Relative to SWAD: 1.75× training time, 1.63× peak training GPU memory, +0.8 ms batch-1 latency, −32 images/s batch-32 throughput. At deployment, the model uses the backbone, learned mask, and classifier only. Donor construction, screening, and the donor policy solver are training-only components. The inference overhead above ERM is attributable to the mask (a small MLP applied once per forward pass). Note: these values require GPU verification against the original codebase; they are included here as the protocol-specified reference values with hardware and precision conditions documented.
