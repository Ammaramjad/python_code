# Submission Checklist — CausalGuard ICLR 2027 Rebuttal
**Submission 61846 | Branch cursor/causalguard-iclr-rebuttal-df68**

## Pre-submission verification

### Reviewer z2Uv

| Concern | Addressed? | Evidence type | Location |
|---|---|---|---|
| W1: Targeted shift families | ✅ | M (paper text) | z2Uv W1 |
| W1: MixStyle comparison | ✅ | D (docx tables) | itnv Q1, z2Uv W1 |
| W1: MIRO/Causal Matching comparison | ⚠️ OPEN | P (pending GPU) | z2Uv W1 |
| W2: Co-adaptation acknowledged | ✅ | M (Appendix B, E) | z2Uv W2 |
| W3: Theorem scope and contributions | ✅ | M (paper text) | z2Uv W3 |
| W4: Selection protocol | ✅ | M (Section 5.1) | z2Uv W4 |
| W4: Code availability | ⚠️ OPEN | In preparation | z2Uv W4 |
| W5: Broader benchmarks | ⚠️ OPEN | P (pending GPU/data) | z2Uv W5 |
| W6: Core contributions | ✅ | M (Table 3) + D (PACS ablation) | z2Uv W6 |
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
| Q1: Unfavorable result reported as measured | ✅ | CG ≈ ERM ≈ no-reenc in linear | z2Uv Q1 |
| W7: Out-of-support case | ✅ | N (withheld direction) | z2Uv W7 |
| W8: MixStyle structural differences | ✅ | M (Table 3) + text | z2Uv W8 |

### Reviewer itnv

| Concern | Addressed? | Evidence type | Location |
|---|---|---|---|
| Q1: ERM per-domain PACS/VLCS/OH | ✅ | D (docx) | itnv Q1 |
| Q1: SWAD per-domain | ✅ | D (docx) | itnv Q1 |
| Q1: MixStyle per-domain | ✅ | D (docx) | itnv Q1 |
| Q1: CausalGuard per-domain | ✅ | M (macro) + D (per-domain) | itnv Q1 |
| Q1: MIRO matched rerun | ⚠️ OPEN | P (pending) | itnv Q1 |
| Q1: Causal Matching/Balancing | ⚠️ OPEN | P (pending) | itnv Q1 |
| Q1: Negative per-domain results reported | ✅ | Photo −0.2pp, Caltech −0.2pp | itnv Q1 |
| Q2: Broader benchmarks | ⚠️ OPEN | P (pending) | itnv Q2 |
| Q3: Per-domain individual results | ✅ | D (docx) | itnv Q3 |
| Q4: Practical theorem interpretation | ✅ | M (Appendix C, D) | itnv Q4 |
| Q5: Training wall-clock time | ✅ | D (docx) | itnv Q5 |
| Q5: Peak GPU memory | ✅ | D (docx) | itnv Q5 |
| Q5: Inference latency/throughput | ✅ | D (docx) | itnv Q5 |
| Q5: Inference path documented | ✅ | M (Appendix H) + text | itnv Q5 |
| Q5: Hardware/precision/batch specified | ✅ | RTX 4090, FP16, batch 32 | itnv Q5 |

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
| W2: Table 3 ↔ accuracy ablation path match | ✅ | Confirmed same pathway | bpmm W2 |
| W2: PACS per-domain ablation table | ✅ | D (docx) | bpmm W2 |
| W2: Macro gain documented | ✅ | +1.3 pp | bpmm W2 |
| W2: Negative per-domain result (Photo) | ✅ | −0.1 pp reported | bpmm W2 |
| W2: Known-nuisance flip tests | ✅ | N (z2Uv Q1 SCM CSV) | bpmm W2 |
| W3: Mask vs. spurious features | ✅ | N (linear SCM) + D (PACS) | bpmm W3 |
| W3: Limitation stated prominently | ✅ | "directionally correct but not clean" | bpmm W3 |
| Q1: Dataset choice rationale | ✅ | Text | bpmm Q1 |
| Q2: Coverage metric definition | ✅ | M (Appendix G, Table 5) | bpmm Q2 |
| Q2: Coverage ≠ η clearly stated | ✅ | Direct quote + text | bpmm Q2 |

---

## Content checks

| Check | Status |
|---|---|
| All numerical claims traceable to source | ✅ See evidence_index.md |
| No illustrative or placeholder values in final replies | ✅ All values labeled N, A, M, or D with source |
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
| τ value in executed runs | Unknown; Appendix K.2 discusses it | Author confirms from run config |
| Anonymous code release | In preparation | — |
| Deep nonlinear SCM (ResNet encoder) | GPU required | Provide GPU allocation |

---

## Branch and commit

**Branch:** `cursor/causalguard-iclr-rebuttal-df68`  
**Remote:** `origin/cursor/causalguard-iclr-rebuttal-df68`  
**Commits delivering rebuttal:**
- `362929c` — z2Uv Q1 SCM run + initial OpenReview responses
- Final commit (this session) — SCM-B + all `rebuttal/final/` files

**Files to paste into OpenReview:**
- Reviewer z2Uv → `rebuttal/final/z2Uv.md`
- Reviewer itnv → `rebuttal/final/itnv.md`
- Reviewer bpmm → `rebuttal/final/bpmm.md`

**Do not submit to OpenReview without:**
1. Author confirmation of τ value from run config (z2Uv W3)
2. Author confirmation that per-domain D-labeled values match actual run records
3. Removal of pending markers if additional experiments complete before submission
