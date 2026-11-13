# Evidence Checklist — CausalGuard ICLR 2027 Rebuttal
**Submission 61846 | Generated 2026-11-13**

This checklist maps every reviewer concern to its response, the evidence used,
and the evidence classification.

Evidence classifications:
  M = manuscript-reported (from submitted PDF)
  R = reproduced from logs (not applicable — no logs found)
  N = newly measured (this run)
  A = analytically derived
  D = draft author-provided value (docx 2026-11-07; GPU verification pending)
  U = unverified (no source available)

---

## Reviewer z2Uv

| Concern | Response location | Evidence | Classification |
|---|---|---|---|
| W1: Targeted shift families | z2Uv W1 | Paper text, Sections 1, 3.1, 6 | M |
| W1: MixStyle/MIRO matched comparison | z2Uv W1 + itnv Q1 | Per-domain table (docx) | D |
| W2: Co-adaptation acknowledged | z2Uv W2 | Appendices B, E; Proposition 2 | M |
| W2: Re-encoding ablation accuracy | z2Uv W2 + bpmm W2 | PACS per-domain ablation (docx) | D |
| W3: Theorem scope and contribution | z2Uv W3 | Paper sections 4, Appendices C, F, K | M |
| W4: Selection protocol | z2Uv W4 | Section 5.1; tuning record (docx) | M + D |
| W4: Code availability | z2Uv W4 | In preparation | U |
| W5: Broader benchmarks | z2Uv W5 | Acknowledged; WILDS open | — |
| W6: Core contributions | z2Uv W6 | Table 3 diagnostics; Proposition 2 | M |
| Q1: SCM — analytical TV gaps | z2Uv Q1 | TV = 0.20 and 0.55 (derived from spec) | A |
| Q1: SCM — B1/B2 feature mechanism | z2Uv Q1 | Documented in script header | N |
| Q1: SCM — withheld vs. appended-zero | z2Uv Q1 | Documented in script header | N |
| Q1: SCM — pair sampler | z2Uv Q1 | Documented in script | N |
| Q1: SCM error rates (5 seeds) | z2Uv Q1 | z2Uv_q1_scm_20261113_021503.csv | N |
| Q1: SCM flip rates (5 seeds) | z2Uv Q1 | z2Uv_q1_scm_20261113_021503.csv | N |
| Q1: Mask weights | z2Uv Q1 | z2Uv_q1_scm_20261113_021503.csv | N |
| Q1: Missing clause ("Can you show...") | z2Uv Q1 | Flagged; tested without claiming coverage | — |
| W7: Out-of-support case | z2Uv W7 | Withheld direction covers B2 out-of-support | N |
| W8: Quantitative MixStyle differences | z2Uv W8 | Table 3 (M); per-domain table (D) | M + D |

---

## Reviewer itnv

| Concern | Response location | Evidence | Classification |
|---|---|---|---|
| Q1: ERM per-domain | itnv Q1 | Per-domain table (docx) | D |
| Q1: SWAD per-domain | itnv Q1 | Per-domain table (docx) | D |
| Q1: MixStyle per-domain | itnv Q1 | Per-domain table (docx) | D |
| Q1: CausalGuard per-domain | itnv Q1 | Per-domain table (docx) | D |
| Q1: MIRO matched rerun | itnv Q1 | OPEN — requires GPU + code | — |
| Q1: Causal Matching/Balancing | itnv Q1 | OPEN | — |
| Q2: Broader benchmarks | itnv Q2 | Acknowledged; open | — |
| Q3: Per-domain results | itnv Q3 | Per-domain table (docx) | D |
| Q4: Practical theorem interpretation | itnv Q4 | Appendices C, D | M |
| Q5: Training wall-clock | itnv Q5 | Efficiency table (docx) | D |
| Q5: Peak GPU memory | itnv Q5 | Efficiency table (docx) | D |
| Q5: Inference latency/throughput | itnv Q5 | Efficiency table (docx) | D |
| Q5: Inference path without donors | itnv Q5 | Paper text; Appendix H | M |

---

## Reviewer bpmm

| Concern | Response location | Evidence | Classification |
|---|---|---|---|
| W1: b/b₀ notation | bpmm W1 | Table 4; Eq. 7 | M (correction noted) |
| W1: c, s, g(c) definitions | bpmm W1 | Manuscript revision needed | M |
| W1: w overloading | bpmm W1 | Table 4 audit | M (correction noted) |
| W1: Figure 1 labels | bpmm W1 | Manuscript revision needed | — |
| W1: Figure 3 y-axis | bpmm W1 | Manuscript revision needed | — |
| W1: Citations DomainBed/shortcut | bpmm W1 | Manuscript revision needed | — |
| W2: Ablation path (no-reenc) | bpmm W2 | Implementation description (docx) | D |
| W2: PACS per-domain CG vs no-reenc | bpmm W2 | Per-domain ablation table (docx) | D |
| W2: Flip test (nuisance-only) | bpmm W2 | z2Uv_q1_scm_20261113_021503.csv | N |
| W3: Mask vs. spurious features | bpmm W3 | SCM mask weights | N |
| W3: Mask values per seed | bpmm W3 | z2Uv_q1_scm_20261113_021503.csv | N |
| Q1: Dataset choice rationale | bpmm Q1 | Paper text; revision | M |
| Q2: Coverage metric definition | bpmm Q2 | Appendix G; Table 5 | M |
| Q2: Coverage ≠ η estimate | bpmm Q2 | Table 5 caption; Appendix G | M |
| Q2: Table 8 acceptance rates | bpmm Q2 | Table 8 | M |

---

## Open Items (Pending GPU + Code)

| Item | Reviewer(s) | Required |
|---|---|---|
| MIRO matched rerun (PACS/VLCS/Office-Home) | itnv Q1, z2Uv W1 | GPU + MIRO code |
| Causal Matching / Causal Balancing reruns | itnv Q1 | GPU + code |
| DomainNet evaluation | itnv Q2 | GPU + dataset |
| TerraIncognita evaluation | itnv Q2, z2Uv W5 | GPU + dataset |
| WILDS (iWildCam) evaluation | itnv Q2, z2Uv W5 | GPU + dataset |
| Hyperparameter sensitivity sweep | z2Uv W4 | GPU + code |
| Independent GPU verification of D-labeled values | all | GPU + original code |
| τ value in executed runs (Appendix K.2) | z2Uv W3 | Author confirmation |
| Anonymous code release | z2Uv W4 | In preparation |

---

## Traceability Index

| Value | Source file | Line/column | Classification |
|---|---|---|---|
| Repr. shift TV = 0.20 | Analytically derived (see z2Uv Q1 response) | — | A |
| Withheld TV = 0.55 | Analytically derived (see z2Uv Q1 response) | — | A |
| ERM error repr. 17.6±1.0% | z2Uv_q1_scm_20261113_021503.csv | condition=represented | N |
| CG error repr. 17.7±1.1% | z2Uv_q1_scm_20261113_021503.csv | condition=represented | N |
| No-reenc error repr. 17.7±1.1% | z2Uv_q1_scm_20261113_021503.csv | condition=represented | N |
| ERM error withheld 11.1±0.5% | z2Uv_q1_scm_20261113_021503.csv | condition=withheld | N |
| CG error withheld 11.1±0.5% | z2Uv_q1_scm_20261113_021503.csv | condition=withheld | N |
| ERM flip repr. 40.5±2.1% | z2Uv_q1_scm_20261113_021503.csv | condition=represented | N |
| CG flip repr. 40.3±2.0% | z2Uv_q1_scm_20261113_021503.csv | condition=represented | N |
| Mask content 0.89 (mean) | z2Uv_q1_scm_20261113_021503.csv | cols mask_full_xc | N |
| Mask x_s1 0.71 (mean) | z2Uv_q1_scm_20261113_021503.csv | cols mask_full_xs1 | N |
| PACS macro CG 90.3±0.5 | Table 2 (manuscript); docx rebuttal | — | M |
| PACS no-reenc macro 89.0±0.6 | docx rebuttal 2026-11-07 | bpmm W2 table | D |
| PACS Art CG 88.7±0.7 | docx rebuttal 2026-11-07 | itnv Q3 / bpmm W2 | D |
| CG vs SWAD PACS macro +2.2pp | docx rebuttal 2026-11-07 | itnv Q3 | D |
| Training time CG 4.90±0.19h | docx rebuttal 2026-11-07 | itnv Q5 | D |
| Peak GPU mem CG 14.2±0.3 GB | docx rebuttal 2026-11-07 | itnv Q5 | D |
| Disagreement 5.9% (no-reenc) | Table 3, submitted manuscript | — | M |
| Disagreement 3.4% (full CG) | Table 3, submitted manuscript | — | M |
| Acceptance rate 74.6% | Table 3, submitted manuscript | — | M |
| Effective donors 6.8 (full CG) | Table 3, submitted manuscript | — | M |
