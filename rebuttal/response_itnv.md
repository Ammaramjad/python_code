# Response to Reviewer itnv — CausalGuard ICLR 2027

**Submission 61846**  
**Status:** DRAFT — only completed and verified evidence is included. Items marked [PENDING] await experiments on the GPU workstation.

---

## W1: Matched Modern Competitors

**Concern:** Matched reruns of MixStyle and MIRO under the identical evaluation protocol are needed. Published leaderboard numbers cannot substitute.

**Response:**

We fully agree. The paper acknowledges in Appendix J: "Future comparisons should include matched causal matching, MixStyle, and MIRO configurations." We are running these now.

**Protocol for matched reruns (Experiment C):**
- Backbone: ResNet-50, same ImageNet pretrained checkpoint
- Input: 224×224
- Splits: same held-out-domain DomainBed splits
- Selection: source-only validation accuracy
- Steps: same training budget as CausalGuard
- Seeds: 3 (rebuttal constraint; labeled as such)
- MixStyle: official implementation, α swept on source validation
- MIRO: official implementation with pretrained reference model (note: MIRO uses a frozen pretrained reference — this gives it access to additional pretraining information; we will explicitly label this)

[PENDING: EXP C — table will be inserted here with format:]

| Method | PACS | VLCS | Office-Home | Information access |
|---|---|---|---|---|
| ERM (reproduced, 3 seeds) | — | — | — | ImageNet pretrain |
| MixStyle (reproduced, 3 seeds) | — | — | — | ImageNet pretrain |
| MIRO (reproduced, 3 seeds) | — | — | — | ImageNet + CLIP/pretrained ref |
| CausalGuard (reproduced, 3 seeds) | — | — | — | ImageNet pretrain |
| CausalGuard (original, 5 seeds) | 90.3±0.5 | 81.2±0.4 | 75.6±0.5 | ImageNet pretrain |

We will clearly label which numbers are reproduced in this rebuttal (3 seeds) vs. original paper (5 seeds).

---

## W2: Broader Benchmarks

**Concern:** PACS/VLCS/Office-Home are saturated. TerraIncognita and WILDS evaluations are needed.

**Response:**

We acknowledge this. The paper explicitly noted WILDS as a future extension. We are estimating compute requirements for TerraIncognita (four locations × 5 seeds × ~5 hours per run ≈ 100 GPU-hours) and iWildCam (a natural WILDS task). We will complete at least one broader evaluation if feasible within the rebuttal window.

[PENDING: EXP broader benchmark]

For the submitted results, the benchmark choice follows the DomainBed standard, which enables comparison with a large body of existing results. We will add an explicit statement that these benchmarks represent specific types of domain shift (style, rendering, photography conditions) and do not represent all relevant shift families.

---

## W3: Per-Domain Results

**Concern:** Only dataset-level aggregates are reported. Per-domain results needed.

**Response:**

Appendix J specifies the aggregation protocol: for benchmark b, domain d, run r, accuracy abdr; domain-macro score = Db⁻¹ Σd abdr. The per-domain values abdr should be preserved "reporting domain-wise values and the selected checkpoint for each run" (Appendix J).

We are recovering per-domain results from experiment logs or running 3-seed reruns.

[PENDING: EXP A — table will be inserted here with format:]

**PACS (mean ± SD over seeds):**

| Method | Art Painting | Cartoon | Photo | Sketch | Dataset mean |
|---|---|---|---|---|---|
| ERM | — | — | — | — | 86.2±0.7 |
| SWAD | — | — | — | — | 88.1±0.6 |
| CausalGuard | — | — | — | — | 90.3±0.5 |

**VLCS, Office-Home:** Similar tables will be provided.

This is important because domain-macro means can mask per-domain degradation. We will explicitly report domains where CausalGuard improves vs. degrades vs. ERM and SWAD.

---

## W4: Practical Interpretation of the Conditional Theorem

**Concern:** Theorem 1 is conditional on κ, ρ, ξ, η. What is the practical takeaway?

**Response:**

The theorem's practical value is as a failure-analysis framework, not a deployment guarantee. Appendix C explicitly addresses this: "The theorem should be used to structure experiments and failure analysis, not to report a numerical deployment certificate with unknown terms set to zero."

Practically:
- **ε (source consistency):** Directly minimized during training and audited post-training. A small ε means predictions are stable under candidate interventions.
- **ξ (semantic mismatch):** Measured by the compatibility gate and controlled-intervention audit (Table 8). The gate targets ξ directly by filtering semantically invalid candidates.
- **κ (density ratio cap):** The KL trust region in the donor policy limits concentration, keeping κ bounded. The effective donor count (1/Σjq²j) is a proxy.
- **ρ (factual marginal shift):** Reflects how different the target's content distribution is from source. This is not estimable from source data alone; the ρ term motivates including diverse source domains.
- **η (target-support discrepancy):** The term that "cannot be certified." The paper explicitly states: "A narrow interval on observed KL cannot certify robustness to unsupported shifts." This is why the controlled out-of-support experiment (tgt_out_of_support in Experiment D) is included.

We will add a "Practical guide to the theorem" box in the revised manuscript summarizing which terms are auditable and which require external information.

---

## W5: Measured Computational Overhead

**Concern:** No wall-clock measurements provided; analytical scaling only.

**Response:**

Appendix H correctly notes: "These are analytical scaling statements, not measured wall times." Section 5.1 acknowledges: "matching epochs alone does not establish equal wall-clock cost."

We are measuring (Experiment E) on the RTX 4080:
- Training: examples/second, time/epoch for ERM, SWAD, CausalGuard
- Peak GPU memory at the same batch size
- Inference latency at batch sizes 1, 32, 128
- Donor count J and its effect on throughput

[PENDING: EXP E — table will be inserted here with format:]

| Method | Train examples/s | Peak GPU mem (GB) | Inference latency (ms/batch=32) |
|---|---|---|---|
| ERM | — | — | — |
| SWAD | — | — | — |
| CausalGuard (J=8) | — | — | — |

The donor construction cost is O(B×J×d) per step after backbone encoding. The donor policy solver (concave optimization, O(r³) per anchor) adds overhead that scales with r (audit projection dimension) and J.

A key point: the semantic teacher and donor policy are removed at inference. The inference overhead above ERM is only the mask (a small MLP), not the full donor machinery.
