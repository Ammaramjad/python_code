# Which “essentially identical” claim belongs to which run

Two different scripts, plus one replication and one diagnostic, are easy to collapse into a single sentence. They are not the same experiment. All four result files are kept.

## 1. Experiment D — the progress-log statement

- Script: `scripts/experiment_D_synthetic_scm.py`
- Configuration: 2D continuous spurious correlation, 3 seeds, accuracy (not error)
- Primary CSV: `results/rebuttal/experiment_D_synthetic_scm_20261107_000025.csv`
- Statement in `docs/progress.md`: ERM and CausalGuard have near-identical accuracy in that linear 2D SCM

Recomputed from that CSV (mean accuracy ± population SD):

| Target | ERM | Full CausalGuard | No re-encoding | Oracle |
|---|---|---|---|---|
| In support | 0.949±0.009 | 0.949±0.010 | 0.949±0.010 | 0.969±0.014 |
| Weakened | 0.832±0.024 | 0.833±0.011 | 0.833±0.011 | 0.965±0.011 |
| Zero | 0.811±0.032 | 0.819±0.008 | 0.819±0.008 | 0.976±0.000 |
| Reversed | 0.711±0.014 | 0.713±0.015 | 0.713±0.015 | 0.969±0.002 |
| Out of support | 0.613±0.052 | 0.626±0.011 | 0.626±0.011 | 0.961±0.007 |
| Ambiguous | 1.000±0.000 | 1.000±0.000 | 1.000±0.000 | 0.973±0.004 |

ERM and both CausalGuard variants are close to each other. They are not close to the content oracle once the shortcut weakens. That is the progress-log statement.

A later run of the same script on this VM (numpy 2.5.4) is `results/rebuttal/experiment_D_synthetic_scm_20261113_025219.csv`. Accuracies moved (for example in-support ERM 0.970±0.003 versus 0.949±0.009). ERM and CausalGuard remain close to each other on that rerun as well. The 2026-11-07 file is the one cited by the progress log.

## 2. z2Uv Q1 — the OpenReview sentence

- Script: `scripts/experiment_z2Uv_q1_scm.py`
- Configuration: 3D binary nuisances, 5 seeds, 2000 pairs, target error and nuisance-only flip rate
- Primary raw CSV: `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`
- Side-by-side table: `results/rebuttal/z2Uv_q1_side_by_side_20261113_021503.md`

The sentence “all three methods perform essentially identically (differences ≤ 0.1 pp)” in the earlier OpenReview draft refers to this run, not to Experiment D. It is accurate only for the **mean** paired error gap and for full CausalGuard versus no re-encoding:

- Represented error, full − ERM by seed: +0.70, +0.10, +0.95, −0.10, −1.25; mean +0.08 pp
- Withheld error, full − ERM by seed: −0.05, +0.20, +0.40, −0.20, −0.05; mean +0.06 pp
- Full versus no re-encoding error stays within 0.05 pp on every seed

It is not accurate for every seed. The represented flip-rate gap reaches −4.65 pp on seed 4 (mean −0.17 pp). The paste-ready reply now uses the seed list instead of “≤ 0.1 pp” for every comparison.

## 3. Same z2Uv script, second run on the validated environment

- Raw CSV: `results/rebuttal/z2Uv_q1_scm_20261113_025236.csv`
- Side-by-side table: `results/rebuttal/z2Uv_q1_side_by_side_20261113_025236.md`
- Interpreter for this run: Python 3.12.3, numpy 2.5.4

Mean errors stay within about 0.4 pp of ERM, but the numbers are not the same as run 021503. Withheld full − ERM error is negative on all five seeds (mean −0.37 pp). One represented flip paired difference is +8.70 pp. This file is preserved and is not a replacement for 021503.

## 4. SCM-B is not the identical-result claim

- Script: `scripts/experiment_scm_b_high_spurious.py`
- CSV: `results/rebuttal/scm_b_high_spurious_20261113_023734.csv`
- Reversed target: ERM 38.4±1.3% error, full CausalGuard 39.4±1.2%, paired full − ERM seeds +2.00, +1.45, +0.10, +0.10, +1.15 (mean +0.96 pp)

CausalGuard is slightly worse than ERM on that reversed condition. Do not describe SCM-B with the Q1 “identical” sentence.
