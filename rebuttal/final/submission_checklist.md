# Submission Checklist — CausalGuard ICLR 2027 Rebuttal
**Submission 61846 | Branch cursor/causalguard-iclr-rebuttal-df68**

## Pre-submission verification

### Reviewer z2Uv

| Concern | Addressed? | Evidence type | Location |
|---|---|---|---|
| W1: Targeted shift families | ✅ | M (paper text) | z2Uv W1 |
| W1: MixStyle comparison | ⚠️ NOT POSTED | P (no GPU, no code, no data) | `results/rebuttal/pending_gpu_jobs.md` |
| W1: MIRO/Causal Matching comparison | ⚠️ OPEN | P (pending GPU) | z2Uv W1 |
| W2: Co-adaptation acknowledged | ✅ | M (Appendix B, E) | z2Uv W2 |
| W3: Theorem scope and contributions | ✅ | M (paper text) | z2Uv W3 |
| W4: Selection protocol | ✅ | M (Section 5.1) | z2Uv W4 |
| W4: Code availability | ⚠️ OPEN | In preparation | z2Uv W4 |
| W5: Broader benchmarks | ⚠️ OPEN | P (pending GPU/data) | z2Uv W5 |
| W6: Core contributions | ✅ for Table 3; PACS accuracy ablation not posted | M (Table 3) | z2Uv W6 |
| Q1: B1/B2 feature mechanism documented | ✅ | N (script header + response) | z2Uv Q1 |
| Q1: Withheld vs. appended-zero explained | ✅ | N (response text) | z2Uv Q1 |
| Q1: Analytical TV = 0.20 and 0.55 | ✅ | A (derived in response) | z2Uv Q1 |
| Q1: TV distinct from η | ✅ | A | z2Uv Q1 |
| Q1: Error rates (5 seeds, 2000 pairs) | ✅ | N (CSV) | z2Uv Q1 |
| Q1: Nuisance-only flip rates | ✅ | N (CSV) | z2Uv Q1 |
| Q1: Per-seed paired differences | ✅ | N (CSV) | z2Uv Q1 |
| Q1: Source validation accuracy reported | ✅ | N (CSV) | z2Uv Q1 |
| Q1: Missing clause flagged | ✅ | Explicit statement | z2Uv Q1 |
| Q1: Results described as simplified SCM | ✅ | "3D linear SCM + logistic regression" | z2Uv Q1 |
| Q1: Unfavorable result reported as measured | ✅ | Mean error gap is small; seed gaps are listed | z2Uv Q1; `run_reconciliation.md` |
| W7: Out-of-support case | ✅ | N (withheld direction) | z2Uv W7 |
| W8: MixStyle structural differences | ✅ | M (Table 3) + text | z2Uv W8 |

### Reviewer itnv

| Concern | Addressed? | Evidence type | Location |
|---|---|---|---|
| Q1: ERM/SWAD/MixStyle/CausalGuard per-domain | ⚠️ NOT POSTED | P | itnv Q1; manuscript macros only |
| Q1: CausalGuard dataset macro | ✅ as manuscript, not a new measurement | M (Table 2) | itnv Q1 |
| Q1: MIRO matched rerun | ⚠️ OPEN | P (pending) | itnv Q1 |
| Q1: Causal Matching/Balancing | ⚠️ OPEN | P (pending) | itnv Q1 |
| Q1: Negative per-domain results | ⚠️ NOT POSTED | No seed logs | itnv Q1 |
| Q2: Broader benchmarks | ⚠️ OPEN | P (pending) | itnv Q2 |
| Q3: Per-domain individual results | ⚠️ NOT POSTED | P | itnv Q3 |
| Q4: Practical theorem interpretation | ✅ | M (Appendix C, D) | itnv Q4 |
| Q5: Training wall-clock, peak memory, inference | ⚠️ NOT POSTED | P (no GPU) | itnv Q5; `pending_gpu_jobs.md` |
| Q5: Inference path documented | ✅ | M (Appendix H) + text | itnv Q5 |
| Q5: Hardware/precision/batch | ⚠️ Protocol named, not measured | No GPU on this VM | itnv Q5 |

### Reviewer bpmm

| Concern | Addressed? | Evidence type | Location |
|---|---|---|---|
| W1: b/b₀ notation | ✅ | M (Table 4 audit) | bpmm W1 |
| W1: c/s/g(c) definitions | ✅ | Manuscript revision noted | bpmm W1 |
| W1: w overloading | ✅ | Manuscript revision noted | bpmm W1 |
| W1: Figure 1 labeling | ✅ | Manuscript revision noted | bpmm W1 |
| W1: Figure 3 y-axis | ✅ | Manuscript revision noted | bpmm W1 |
| W1: Citations | ✅ | Manuscript revision noted | bpmm W1 |
| W2: Ablation path documented | ✅ | Implementation description | bpmm W2 |
| W2: Table 3 pathway described | ✅ described; PACS run not done | Text | bpmm W2 |
| W2: PACS per-domain ablation | ⚠️ NOT POSTED | P (`pacs_cg_full_seed*`, `pacs_cg_nore_seed*`) | bpmm W2 |
| W2: Macro gain of +1.3 pp | ⚠️ NOT POSTED | No raw logs | bpmm W2 |
| W2: Known-nuisance flip tests | ✅ | N (z2Uv Q1 SCM CSV) | bpmm W2 |
| W3: Mask vs. spurious features | ✅ for the linear SCM only | N | bpmm W3 |
| W3: Limitation stated prominently | ✅ | "directionally correct but not clean" | bpmm W3 |
| Q1: Dataset choice rationale | ✅ | Text | bpmm Q1 |
| Q2: Coverage metric definition | ✅ | M (Appendix G, Table 5) | bpmm Q2 |
| Q2: Coverage ≠ η clearly stated | ✅ | Direct quote + text | bpmm Q2 |

---

## Content checks

| Check | Status |
|---|---|
| All numerical claims traceable to source | ✅ See evidence_index.md |
| No unverified per-domain or GPU-profile numbers in paste-ready replies | ✅ Removed from `rebuttal/final/{z2Uv,itnv,bpmm}.md` on 2026-11-13 |
| Unfavorable results (CG ≈ ERM in linear SCM) reported | ✅ |
| Unfavorable results (CG slightly worse in SCM-B reversed) reported | ✅ |
| SCM described as "simplified 3D linear" not "exact" | ✅ |
| Missing z2Uv Q1 clause flagged | ✅ |
| Author Checks section removed | ✅ Not present in any final file |
| D-labeled values: data source stated | ✅ "matched-rerun protocol; records not independently reproduced in this environment" |
| Explicitly marked illustrative items (tuning counts, solver settings) removed | ✅ |
| Three individual replies match complete_rebuttal.md | ✅ Verified |
| z2Uv Q1 TV gaps reported as analytically derived, not measured | ✅ |
| TV gaps labeled as distinct from η | ✅ |
| Experiment files preserved (not overwritten) | ✅ Timestamped filenames |
| Seeds documented (0–4 for all runs) | ✅ |
| Run timestamps documented | ✅ 20261113_021503, 20261113_023734 |

---

## Open blockers

| Item | Specific blocker | Resume path |
|---|---|---|
| MIRO/Causal Matching/Balancing reruns | No original code or PACS/VLCS/OH datasets in repo | Provide code + dataset path |
| DomainNet, TerraIncognita, WILDS | Datasets absent | Provide dataset paths |
| Independent verification of D-labeled values | No GPU or original code | Re-run from code on RTX 4090 |
| Numerical τ for the ResNet-50 runs | Not in this repository. The reply states the bound conditionally and does not give a number. | Recover the original run config only if a number is later required |
| Anonymous code release | In preparation | — |
| Deep nonlinear SCM (ResNet encoder) | GPU required | Provide GPU allocation |

---

## Verdict (2026-11-13)

Paste-ready now, with the limitations written in the replies themselves:

- `rebuttal/final/z2Uv.md` — SCM table is regenerated from `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`. Mean error gaps are small; seed-level gaps are listed and are not all within 0.1 pp.
- `rebuttal/final/itnv.md` — manuscript Table 2 macros only. Per-domain MixStyle table and GPU profile are explicitly not posted.
- `rebuttal/final/bpmm.md` — notation and coverage text, plus the measured linear flip test. The PACS re-encoding accuracy table is explicitly not posted.

Not ready to post as measured results: any per-domain PACS/VLCS/Office-Home MixStyle or ablation number, and any RTX wall-clock, memory, or latency number. Those jobs are listed in `results/rebuttal/pending_gpu_jobs.md`.

The reply does not state a numerical τ. Appendix K.2 does not assert a benchmark setting, and no run config in this repository records one. Whether Table 3’s no-re-encoding column is the linear script’s bypass remains unresolved; the reply says so and does not treat the linear flip rates as Table 3 or as held-out accuracy.

## Branch

Paste these three files only:

- Reviewer z2Uv → `rebuttal/final/z2Uv.md`
- Reviewer itnv → `rebuttal/final/itnv.md`
- Reviewer bpmm → `rebuttal/final/bpmm.md`

`rebuttal/final/complete_rebuttal.md` is the concatenation of those three files. Paste the three reviewer files, one comment each. OpenReview submission is left to the authors.
