# Evidence Index — CausalGuard Rebuttal

**Date:** 2026-11-07

---

## Completed Evidence

### E1: Synthetic SCM Experiment (Experiment D)

| Field | Value |
|---|---|
| File | `results/rebuttal/experiment_D_synthetic_scm_20261107_000025.csv` |
| Timestamp | 2026-11-07 00:00:25 UTC |
| Seeds | 3 (labeled: rebuttal-scope; paper uses 5) |
| Method | Linear logistic regression + soft mask (NOT ResNet-50) |
| Data | Programmatically generated 2D SCM with known ground truth |
| GPU required | No (CPU, 12s runtime) |
| Run type | `rebuttal_new_scm_linear_approx` |
| Addresses | z2Uv-W2, z2Uv-W7, bpmm-W3 |

**Key results:**
- ERM degrades as spurious correlation weakens/reverses (shortcut reliance confirmed)
- CausalGuard linear approximation: marginal advantage over ERM in most conditions
- Ambiguous source condition (ρ=0.95): both fail on shifted target → confirmed failure boundary
- Mask discriminates content vs. nuisance in 2/3 seeds; fails in 1/3 seed
- Accept rate: 0.98–1.00; GT preservation: 1.00; Disagree: 0.00

### E2: Theory Verification

| Concern | Verdict | Notes |
|---|---|---|
| Theorem 1 proof steps | Valid | Pinsker + Jensen + Lipschitz + TV bounds all check out |
| Proposition 2 (bypass vacuity) | Valid | Trivially correct |
| Proposition 3 (finite portfolio) | Valid | Hoeffding + union bound correct |
| Probability floor KL bound | Valid | K = log(1/τ) follows from py ≥ τ |
| L = 1/τ Lipschitz constant | Valid | Mean-value theorem argument in Appendix F correct |
| Loss-to-accuracy conversion | Correct qualification | Margin-based, not direct; paper correctly notes discontinuity |
| Feasibility condition kqmax ≥ 1 | Valid | Appendix H proof correct |

### E3: Paper-Level Discrepancy Identification

| ID | Description | Location | Action |
|---|---|---|---|
| D1 | 82.37 in sweep exceeds Table 2 mean by >1 SD | Tables 2, 5, 7 | Add aggregation note in manuscript |
| D2 | Probability floor may not have been used in executed runs | Appendix K.2 | Author clarification needed |
| D3 | No per-domain results in main paper | Table 2 | Add via Experiment A |
| D4 | b/b0 not in notation table | Table 4 | Manuscript fix |

---

## Pending Evidence

### P1: Experiment A — Per-Domain Results
- Addresses: itnv-W3
- Requires: original logs OR rerun on RTX 4080 workstation
- Status: BLOCKED (no code/GPU in this environment)

### P2: Experiment B — Re-encoding Accuracy Ablation
- Addresses: bpmm-W2, z2Uv-W6
- Requires: CausalGuard code + RTX 4080
- Status: BLOCKED

### P3: Experiment C — Matched MixStyle and MIRO
- Addresses: itnv-W1, z2Uv-W1, z2Uv-W8
- Requires: DomainBed + method code + RTX 4080 + datasets
- Status: BLOCKED

### P4: Experiment D (Neural) — Deep Learning Version of Synthetic SCM
- Addresses: z2Uv-W2, bpmm-W3
- Requires: PyTorch + GPU
- Status: BLOCKED (linear version completed above)

### P5: Experiment E — Efficiency Measurement
- Addresses: itnv-W5
- Requires: CausalGuard code + RTX 4080
- Status: BLOCKED

### P6: Broader Benchmarks
- Addresses: itnv-W2, z2Uv-W5
- Requires: TerraIncognita/WILDS datasets + GPU
- Status: BLOCKED

---

## Evidence Provenance Labels

| Label | Meaning |
|---|---|
| `original_paper` | Published in submitted PDF; unverified (no logs available) |
| `reproduced_new_run` | Re-run in this rebuttal on the same method/protocol |
| `rebuttal_new_scm_linear_approx` | New synthetic experiment; linear approximation; NOT comparable to Table 2 |
| `external_reference` | Published external result; not matched-rerun |
