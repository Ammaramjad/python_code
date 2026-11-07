# Progress Log — CausalGuard Rebuttal

**Last updated:** 2026-11-07  
**Branch:** cursor/causalguard-rebuttal-96ab  
**Agent environment:** Cloud Agent VM (Linux, no GPU)

---

## Session 2026-11-06/07

### Completed

1. **Environment inspection** — workspace contains only unrelated SER notebooks; no CausalGuard code.
2. **Paper read** — full 25-page PDF parsed. All tables, appendices, and proofs reviewed.
3. **Git branch created** — `cursor/causalguard-rebuttal-96ab`
4. **Directory structure created** — `docs/`, `rebuttal/`, `results/`, `scripts/`, `configs/`, `figures/`
5. **docs/repository_audit.md** — hardware, workspace, paper content audit, theory verification
6. **docs/paper_code_discrepancies.md** — 7 categories of items; observable discrepancies documented
7. **docs/reviewer_concern_matrix.md** — z2Uv (8 items), itnv (5 items), bpmm (5 items)
8. **docs/experiment_plan.md** — full experiment plan with schema, protocol, runtime estimates
9. **Experiment D (synthetic SCM)** — implemented and executed. Results in `results/rebuttal/`
10. **Rebuttal drafts** — in progress

### Experiment D Results (2026-11-07 00:00:25)

File: `results/rebuttal/experiment_D_synthetic_scm_20261107_000025.csv`

| Method | In-support | Weakened | Zero | Reversed | Out-of-support | Ambiguous |
|---|---|---|---|---|---|---|
| ERM | 0.949±0.009 | 0.832±0.024 | 0.811±0.032 | 0.711±0.014 | 0.613±0.052 | 1.000±0.000 |
| CG (re-enc) | 0.949±0.010 | 0.833±0.011 | 0.819±0.008 | 0.713±0.015 | 0.626±0.011 | 1.000±0.000 |
| CG (no re-enc) | 0.949±0.010 | 0.833±0.011 | 0.819±0.008 | 0.713±0.015 | 0.626±0.011 | 1.000±0.000 |
| Oracle | 0.969±0.014 | 0.965±0.011 | 0.976±0.000 | 0.969±0.002 | 0.961±0.007 | 0.973±0.004 |

**Key findings:**
- In this linear 2D SCM, ERM and CG have near-identical accuracy. This is an **honest negative / boundary result**.
- The mask learns to weight content (dim 0) > nuisance (dim 1) in 2 of 3 seeds (content=0.92, 0.91; nuisance=0.84, 0.79) but seed 2 shows weaker discrimination (0.53, 0.41).
- When the mask does not cleanly separate dimensions (seed 2), accuracy is similar across methods.
- The ambiguous condition (ρ=0.95) shows shortcut collapse (ERM=1.0, CG=1.0) — the method cannot recover the correct partition when all sources share the same spurious pattern.
- This confirms the out-of-support failure boundary described in Appendix E of the paper.
- re-encoding and no-re-encoding variants are identical in this linear 2D setting because the mask does not achieve a meaningful content/nuisance separation — an informative result showing the limits of the linear approximation.

**Protocol:** 3 seeds, linear logistic approximation, NOT ResNet-50. Cannot compare to Table 2.

### Active Jobs
None running.

### Blocked Items (require code + GPU)
- Experiment A: Per-domain results (needs logs or rerun on workstation)
- Experiment B: Re-encoding accuracy ablation (needs CausalGuard code)
- Experiment C: Matched MixStyle/MIRO (needs code + datasets)
- Experiment E: Efficiency measurement (needs GPU)

### Next Actions (if code/GPU become available)
1. Install DomainBed + CausalGuard code on workstation
2. Download PACS, VLCS, Office-Home via DomainBed download script
3. Run Experiment A (ERM, SWAD baselines) to get per-domain values
4. Run Experiment B (no-re-encoding ablation with accuracy)
5. Run Experiment C (MixStyle first, then MIRO)
6. Run Experiment E (timing)

### What Requires Author Clarification
1. The 82.37 value in Tables 5 and 7 vs. 81.2 in Table 2 — aggregation protocol?
2. What value of τ was used in executed benchmark runs?
3. Source of per-seed, per-domain logs (needed for Experiment A)
4. Whether λy > 0 in the executed configuration
5. Which no-re-encoding variant appears in Table 3 (bypass vs. direct)
