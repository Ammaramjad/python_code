# Original Evidence Inventory — CausalGuard Submission 61846

**Date:** 2026-11-07  
**Search scope:** `/workspace` (Cloud Agent VM)  
**GPU workstation:** Not accessible from this VM; not searched.  
**Synology NAS:** No path or credentials provided; not searched.

---

## 1. What Was Searched

The following locations were searched for original experiment records:

```
/workspace/           — entire workspace tree
/home/ubuntu/         — user home
/tmp/                 — temporary files
```

No other storage is accessible from this environment.

---

## 2. Inventory of Found Artifacts

### Code
| File | Type | Notes |
|---|---|---|
| `/workspace/scripts/experiment_D_synthetic_scm.py` | NEW code (this session) | 2D linear SCM approximation; NOT original CausalGuard |
| `/workspace/MLP.ipynb` | Unrelated | Speech emotion recognition |
| `/workspace/SER*.ipynb` | Unrelated | Speech emotion recognition |

**Original CausalGuard training code: NOT FOUND.**

### Data
| Item | Status |
|---|---|
| PACS dataset | NOT FOUND |
| VLCS dataset | NOT FOUND |
| Office-Home dataset | NOT FOUND |
| Any DomainBed data directory | NOT FOUND |

### Experiment Records
| Item | Status |
|---|---|
| Training logs (.log, .txt, .csv) | NOT FOUND (except new Experiment D) |
| Checkpoints (.pt, .pth, .ckpt) | NOT FOUND |
| Configurations (.yaml, .json, .cfg) | NOT FOUND |
| Per-seed result files | NOT FOUND |
| Run manifests | NOT FOUND |

### Paper PDF
| File | Status |
|---|---|
| `/home/ubuntu/.cursor/projects/workspace/uploads/61846_CAUSALGUARD_COVERAGE_AWA_5686.pdf` | FOUND — 25-page submitted manuscript |

### Reviewer Comments
| Item | Status |
|---|---|
| Review text (z2Uv) | NOT FOUND |
| Review text (itnv) | NOT FOUND |
| Review text (bpmm) | NOT FOUND |
| Rebuttal draft (pre-existing) | NOT FOUND |

---

## 3. Verification Status of All Reported Numbers

Every number in the submitted paper is currently **UNVERIFIED** because no experiment records were found.

| Claim | Location | Verification |
|---|---|---|
| PACS 90.3 ± 0.5% (5 runs) | Table 2 | UNVERIFIED — no logs |
| VLCS 81.2 ± 0.4% (5 runs) | Table 2 | UNVERIFIED — no logs |
| Office-Home 75.6 ± 0.5% (5 runs) | Table 2 | UNVERIFIED — no logs |
| ERM: 86.2±0.7, 78.5±0.6, 71.8±0.8 | Table 2 | UNVERIFIED — no logs |
| IRM: 85.7±0.9, 78.9±0.7, 71.4±0.9 | Table 2 | UNVERIFIED — no logs |
| SWAD: 88.1±0.6, 79.6±0.5, 73.8±0.7 | Table 2 | UNVERIFIED — no logs |
| Ablation variants (Table 2 rows 5–9) | Table 2 | UNVERIFIED — no logs |
| Mechanism diagnostics (Table 3) | Table 3 | UNVERIFIED — no logs |
| Threshold sweep (Table 5) | Table 5 | UNVERIFIED — no logs |
| Donor policy diagnostics (Table 6) | Table 6 | UNVERIFIED — no logs |
| Temperature sweep (Table 7) | Table 7 | UNVERIFIED — no logs |
| Controlled interventions (Table 8) | Table 8 | UNVERIFIED — no logs |
| 96.8% label preservation | Abstract | UNVERIFIED — no logs |
| 3.4% disagreement | Abstract | UNVERIFIED — no logs |
| 82.37 accuracy in sweep | Fig 3c, Tab 5,7 | UNVERIFIED + INCONSISTENT with Table 2 |

---

## 4. Protocol Checks That Require Logs

The following cannot be verified without original records:

| Check | Why It Matters |
|---|---|
| Source-only checkpoint selection | Paper claims DomainBed protocol; must confirm no target leakage |
| τ value used in executed runs | Appendix K.2 says floor may not have been used; affects theoretical claims |
| Seed values used | Required for exact reproducibility |
| Hyperparameter values | Required to confirm source-only selection, not target-tuned |
| Split hashes | Required to verify same data was used |
| Number of steps / batch size | Required to confirm training budget |
| Whether λy > 0 | Undisclosed in paper |
| EMA reference behavior | Paper distinguishes p̄ from t; whether EMA was used is undisclosed |

---

## 5. What Was Reconstructed vs. What Is Original

| Artifact | Category | Basis |
|---|---|---|
| `docs/repository_audit.md` | NEW — based on PDF reading | No original code |
| `docs/paper_code_discrepancies.md` | NEW — based on PDF reading | No original code |
| `docs/reviewer_concern_matrix.md` | NEW — based on prompt description of reviews | No original review text |
| `rebuttal/response_*.md` | NEW — based on PDF + prompt review descriptions | No original records |
| `results/rebuttal/experiment_D_*.csv` | NEW — 2D linear SCM approximation | NOT original CausalGuard |
| `scripts/experiment_D_synthetic_scm.py` | NEW — logistic regression with soft mask | NOT original CausalGuard |

**The original CausalGuard implementation, datasets, checkpoints, and logs have not been found and must be provided before any reproduction can begin.**

---

## 6. Required from the User to Proceed

To complete the evidence inventory and begin reproduction, the following are needed:

| Item | Purpose |
|---|---|
| Path to original CausalGuard code (Windows/NAS) | Implementation inspection, smoke test |
| Path to experiment logs (or confirmation none exist) | Evidence verification, Experiment A |
| Synology NAS IP, share name, and read credentials | Evidence search, backup destination |
| Actual τ value from executed runs | Theory clarification |
| Actual per-seed per-domain accuracy records | Experiment A (per-domain results) |
| Reviewer comment text (z2Uv, itnv, bpmm) | Complete rebuttal accuracy |
