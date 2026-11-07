# Unresolved Items — CausalGuard Rebuttal

**Date:** 2026-11-07  
**These items are NOT included in reviewer-facing draft text until resolved.**

---

## Critical Unresolved Items (Author Clarification Needed)

### U1: Actual Probability Floor τ in Executed Runs

**Why this matters:** Appendix K.2 states: "the hypothetical probability floor is valid only for class count C < 100 and is not an asserted setting of the benchmark runs." This suggests τ may not have been used in the ResNet-50 benchmark experiments. If τ=0, then:
- KL divergence is unbounded; K = log(1/τ) → ∞
- Proposition 3 (finite portfolio audit) does not apply to the executed runs
- The bounded cross-entropy constant claim B = log(1/τ) is vacuous

**Required clarification:** What was the actual τ value in the PACS/VLCS/Office-Home runs? If τ=0, the theoretical claims require qualification to: "applies to an audited version of the predictor with τ applied post-hoc" or "applies to runs where τ > 0."

**Status:** UNRESOLVED. Must be addressed before finalizing response to z2Uv-W3.

### U2: Origin of 82.37 Value

**Why this matters:** This value appears in both Figure 3c (threshold sweep, γ=0.60) and Table 7 (temperature sweep, Tm=0.5). Table 2 reports VLCS = 81.2 ± 0.4. The 82.37 exceeds the Table 2 mean by approximately 2.9 SD.

**Required clarification:** Is 82.37 the peak of a single-domain within VLCS? A specific seed? A run with different hyperparameters? The domain-macro mean at a specific configuration that is different from the Table 2 aggregate?

**Status:** UNRESOLVED. The rebuttal draft currently says "the per-sweep peak of the VLCS domain-macro mean" but this is an inference, not a verified fact.

### U3: Hyperparameter Selection Protocol and Tuning Budget

**Why this matters:** Reviewer z2Uv-W4 asks for the selection protocol. Without this, reproducibility claims cannot be supported.

**Required:** A complete table: which parameters were swept, what grid, which metric was used for selection (source validation accuracy), and final values used in the Table 2 runs.

**Status:** UNRESOLVED.

### U4: Per-Seed, Per-Domain Logs

**Why this matters:** Experiment A requires either original logs or reruns. Without logs, we cannot verify the Table 2 aggregation protocol.

**Required:** Per-seed, per-domain accuracy records (or confirmation that reruns must be performed).

**Status:** UNRESOLVED. Rebuttal Experiment A is BLOCKED.

### U5: Which No-Re-encoding Variant Appears in Table 3

**Why this matters:** There are two possible no-re-encoding implementations:
1. Bypass: apply classifier to factual retained features cϕ(ui) → consistency loss = 0 identically
2. Direct: apply classifier to v = cϕ(ui) + sϕ(uj) without re-applying mask

The paper uses term "No re-encoding" in Table 3. The disagreement value (5.9%) is nonzero, which rules out bypass variant 1 (which would have 0 disagreement). This suggests variant 2 was used. But the disagreement being nonzero while still using Table 3 for the bypass argument needs clarification.

**Required:** Exact implementation of the no-re-encoding variant in Table 3.

**Status:** UNRESOLVED. Affects Experiment B design.

---

## Experiments Blocked by Resources

| Experiment | Blocker | Action |
|---|---|---|
| A: Per-domain results | No code/logs/GPU | Needs workstation access + original logs |
| B: Re-encoding accuracy | No CausalGuard code | Needs workstation access + code |
| C: MixStyle/MIRO matched | No code/datasets | Needs workstation + DomainBed install |
| D (neural): Deep SCM | No GPU | Can approximate on CPU (done) |
| E: Efficiency | No GPU/code | Needs workstation access |
| Broader benchmarks | No GPU/datasets | Needs workstation + download |

---

## Theoretical Items That Remain Open

### T1: Feasibility of κ-bounded Reweighting in Practice

The theorem assumes w ≤ κ pointwise and Eμ[w] = 1. In practice, κ is not measured or controlled by the algorithm. Saying "the KL trust region limits concentration" is correct for the donor weights q (which have an explicit cap), but the density ratio w in the theorem refers to the correspondence between source pair distribution and target-relevant pairs. These are conceptually different. The rebuttal response to z2Uv-W3 should clarify this distinction more precisely.

### T2: Argument for Re-encoding Being the Correct Gradient Target

Re-encoding means the mask sees candidate features and can backpropagate through them. But this also means the mask can learn to route candidate features to avoid high KL — a different collapse pathway. The paper acknowledges this in Appendix B ("A second collapse pathway") but does not give a complete empirical test of whether this collapse occurs in practice.

---

## Items That Cannot Be Addressed in This Rebuttal Without Resources

1. Per-domain results (Experiment A)
2. Re-encoding accuracy comparison (Experiment B)
3. Matched MixStyle/MIRO (Experiment C)
4. Full-scale neural synthetic SCM (Experiment D neural)
5. Measured efficiency (Experiment E)
6. Broader benchmarks

**These limitations should be stated honestly to the reviewers, not omitted.**
