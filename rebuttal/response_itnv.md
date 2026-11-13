# Response to Reviewer itnv — CausalGuard ICLR 2027

**Submission 61846**

---

## Q1: Direct Competitors (Matched Reruns)

**Concern:** Matched reruns of MixStyle and MIRO under the identical evaluation protocol are needed.

The per-domain results below use the same ImageNet-pretrained ResNet-50, held-out-domain DomainBed splits, source-validation checkpoint selection, and training budget as the submitted results. MixStyle is run with the official implementation, α swept on source validation. 20 trials per method; selection by mean source-validation accuracy. MIRO uses a frozen pretrained reference model (giving it access to pretraining information beyond ImageNet initialization; this is labeled in the table). CausalGuard macro gains over SWAD: approximately 2.1 pp on PACS, 1.7 pp on VLCS, 1.8 pp on Office-Home.

**Evidence source:** Per-domain accuracy values below are from the author-provided draft rebuttal (docx, 2026-11-07); independent GPU verification of these specific values requires the original CausalGuard codebase and PACS/VLCS/Office-Home datasets, which are not accessible in this environment. Matched MIRO, Causal Matching, and Causal Balancing reruns remain open evaluations.

**PACS (mean ± SD over 5 seeds; held-out domain in each row):**

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

CausalGuard gains over SWAD on 10 of 12 per-domain conditions. It trails by 0.2 pp on PACS Photo and VLCS Caltech101. We report these negative per-domain results; they are descriptive under the stated uncertainty. MIRO and Causal Balancing reruns remain open.

---

## Q2: Broader Benchmarks

**Concern:** TerraIncognita and WILDS needed.

DomainNet, TerraIncognita, and WILDS remain open evaluations. The controlled SCM in the response to z2Uv Q1 isolates represented and withheld nuisance directions under a fixed label mechanism. We will complete at least one broader evaluation if feasible within the rebuttal window. We add an explicit statement to Section 5 that the submitted benchmarks represent style, rendering, and photography shifts and do not cover text-image, label-mechanism, or ecological distributional shifts.

---

## Q3: Individual Held-out Domains

The per-domain tables appear in Q1 above. Per the aggregation protocol in Appendix J: domain-macro score for run r on benchmark b is D_b⁻¹ Σ_d a_{bdr}; the reported value is the mean ± SD over 5 runs. CausalGuard trails SWAD on PACS Photo (−0.2 pp) and VLCS Caltech101 (−0.2 pp). These are the conditions closest to saturation.

---

## Q4: Source-Only Use of Theorem 1

Source-validation risk is used for model selection only. A frozen source audit can measure acceptance rate, donor concentration, and disagreement on accepted interventions — these describe the candidate law without using target information. The target-dependent quantities κ, ρ, and η remain unknown for an unseen target. Candidate directional coverage (Appendix G) cannot estimate 1 − η. The theorem's practical role is failure analysis: a low acceptance rate or highly concentrated donor weights suggest that the validity–coverage trade-off may not be favourable, independent of target information. We will add a "Practical guide to the theorem" box in the revision.

---

## Q5: Measured Computational Overhead

**Concern:** No wall-clock measurements provided.

**Protocol:** ResNet-50 on PACS; PACS Sketch held out. Mixed FP16 precision, batch size 32, 5,000 training steps, 5 runs. Donor-bank construction included in training time. Inference on the same GPU, 50 warm-up iterations, 200 timed repetitions.

**Evidence source:** Values below are from the author-provided draft rebuttal (docx); independent measurement requires the original code and a matching GPU. The GPU listed is RTX 4090 (one card, mixed FP16 precision).

| Resource metric | ERM | SWAD | CausalGuard |
|---|---|---|---|
| Training wall-clock per held-out-domain run (h) | 2.10 ± 0.08 | 2.80 ± 0.11 | 4.90 ± 0.19 |
| Peak training GPU memory (GB) | 8.4 ± 0.1 | 8.7 ± 0.1 | 14.2 ± 0.3 |
| Batch-1 inference latency (ms/image) | 7.8 ± 0.2 | 7.8 ± 0.2 | 8.6 ± 0.3 |
| Batch-32 inference throughput (images/s) | 405 ± 8 | 403 ± 8 | 371 ± 7 |

Relative to SWAD: 1.75× training time, 1.63× peak training GPU memory, +0.8 ms batch-1 latency, −32 images/s batch-32 throughput. At deployment, the model uses the backbone, learned mask, and classifier only. Donor construction, screening, and the donor policy solver run during training and are absent at inference. The inference overhead above ERM is attributable to the mask (a small MLP). The donor policy solver uses projected gradient updates with 10 inner iterations per training step; solver cost scales O(r³) with the audit projection dimension r.
