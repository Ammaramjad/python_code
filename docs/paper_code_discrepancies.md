# Paper–Code Discrepancies — CausalGuard Submission 61846

**Date:** 2026-11-06  
**Status:** Code is absent from workspace; this document records discrepancies observable from the paper alone and flags items that must be verified against the actual implementation.

---

## Verification Status Key

- ✓ CONSISTENT — paper text is internally consistent
- ? UNCLEAR — paper is ambiguous; needs code inspection
- ⚠ DISCREPANCY — observable inconsistency within the paper
- ✗ UNVERIFIABLE — requires code/logs not available

---

## 1. Architecture and Forward Pass

### 1.1 Re-encoding Path
**Paper claim (Section 3.1):** "vij → cϕ(vij) → hψ: Shared mask and classifier" — the complete candidate vij is passed through the mask mϕ again and then through classifier hψ.  
**Code status:** ✗ UNVERIFIABLE — no code available.  
**Risk:** The highest implementation risk. If the code applies hψ directly to cϕ(ui) instead of cϕ(vij), the bypass exists. This is Reviewer bpmm's core concern.  
**What to check:** In the candidate forward pass, verify the input to hψ is `mϕ(vij) ⊙ vij`, not `mϕ(ui) ⊙ ui` or the raw `cϕ(ui)`.

### 1.2 Mask Temperature
**Paper claim (Table 7, Tm=0.5):** "Active mask % = 46.8, Mean Acc = 82.37"  
**Paper claim (Table 2):** VLCS = 81.2 ± 0.4  
**Discrepancy:** ⚠ The 82.37 value at Tm=0.5 exceeds the Table 2 mean by more than 1 SD. If this is a VLCS-domain-macro mean, it must correspond to one specific held-out domain rather than the full dataset mean, or the aggregation protocol differs. The paper does not explain this discrepancy explicitly.

### 1.3 Self-pair Exclusion
**Paper claim (Section 3.1):** "Self-recombination satisfies vii = ui and is an implementation check; self-pairs are excluded from intervention training."  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** Donor sampling must exclude i=j.

### 1.4 Duplicate Capture Exclusion
**Paper claim (Table 1, Step 2):** "Exclude duplicate captures and self-pairs."  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** Mechanism for identifying and excluding duplicate captures must be logged.

---

## 2. Donor Policy

### 2.1 Detached Policy Weights
**Paper claim (Section 3.3, Figure 1):** "Donor weights are detached during the student update."  
**Code status:** ✗ UNVERIFIABLE.  
**Risk:** If policy weights are not detached, gradients flow through the donor weighting into the backbone, changing the stated alternating objective.  
**What to check:** `sg(qij)` or `qij.detach()` before multiplying by candidate predictions in the consistency loss.

### 2.2 Detached Reference Predictions
**Paper claim (Eq. 6):** `Lcf = Σ qij DKL(sg(p̄(ui)) ‖ p(vij))` — `p̄(ui)` is a detached reference.  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** The reference distribution in the KL must use `stop_gradient` or `.detach()`.

### 2.3 KL Trust Region
**Paper claim (Section 3.2):** `DKL(qi ‖ q0i) ≤ ρq` as a constraint.  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** This must be an actual constraint in the solver, not a penalty term.

### 2.4 Fixed Projection V
**Paper claim (Section 3.2):** "V ∈ ℝd×r fixed during policy optimization."  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** V must not be updated by the optimizer during policy steps.

### 2.5 Feasibility Check
**Paper claim (Section 3.2):** "Feasibility requires kiqmax ≥ 1."  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** Code must distinguish (a) no accepted donors, (b) infeasible pool (kqmax < 1), (c) feasible pool, and log each case.

---

## 3. Teacher and EMA

### 3.1 Frozen Compatibility Teacher
**Paper claim (Section 3.2):** "A frozen source-trained semantic teacher t."  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** Teacher parameters must have `requires_grad=False` and not receive optimizer updates.

### 3.2 EMA Reference
**Paper claim (Figure 5, Table 1):** "Update EMA afterwards if EMA reference is used."  
**Paper claim (Section 4):** "The theorem also uses same-model frozen divergence, not the adaptive moving-average training objective."  
**Code status:** ✗ UNVERIFIABLE.  
**Risk:** If EMA is used for the optimization reference p̄ but the audit uses the frozen deployed predictor, the two are different models. The paper correctly distinguishes these but the code must implement both correctly.

---

## 4. Loss and Normalization

### 4.1 Normalization Convention
**Paper claim (Section 3.3):** "Candidate forwards must use the same normalization convention as factual forwards."  
**Code status:** ✗ UNVERIFIABLE.  
**Risk:** If batch normalization uses batch statistics at training time, candidate features in a mixed batch receive different normalization than factual features. Must verify BN is in eval mode for candidates, or that candidates and factuals share the same BN statistics.

### 4.2 Probability Floor τ
**Paper claim (Eq. 3):** `p(u) = (1 − Cτ)softmax(hψ(cϕ(u))) + τ·1`  
**Paper claim (Appendix D):** "With the probability floor in Eq. (3), py(v) ≥ τ and 0 ≤ DKL ≤ K := log(1/τ)."  
**Code status:** ✗ UNVERIFIABLE.  
**Key question (Reviewer z2Uv):** Whether τ was actually used in the executed runs. If τ is set to a very small value or zero, the bounded-loss assumption is violated and the finite-sample audit in Proposition 3 is invalid.  
**Paper note (Appendix K.2):** "The hypothetical probability floor is valid only for class count C < 100 and is not an asserted setting of the benchmark runs." — this implies τ may not have been used in the benchmark runs. **This is a significant concern for the theoretical claims.**

### 4.3 Optional Candidate-Label Loss λy
**Paper claim (Eq. 8):** `L = Lsup + λcf·Lcf + λy·Lcf-label + λb·Lb + λh·Lh`  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** Whether λy > 0 in the executed configuration, and whether this is disclosed.

---

## 5. Evaluation Protocol

### 5.1 Source-Only Selection
**Paper claim (Section 5.1):** "Source-only selection following DomainBed."  
**Code status:** ✗ UNVERIFIABLE.  
**What to check:** Checkpoint selection must use only source-domain validation accuracy. No target-domain information.

### 5.2 Per-Domain and Per-Seed Records
**Paper claim (Appendix J):** Domain-macro score defined as D⁻¹Σd abdr. Five-run mean and SD.  
**Code status:** ✗ UNVERIFIABLE.  
**Missing:** Per-domain, per-seed accuracy table. Table 2 provides only dataset-level aggregates.

---

## 6. Discrepancies Observable from Paper Text Alone

| ID | Location | Description | Severity |
|---|---|---|---|
| D1 | Tables 2, 5, 7 | 82.37 in sweep exceeds Table 2 VLCS mean (81.2 ± 0.4) by >1 SD | ⚠ Moderate — needs clarification |
| D2 | Appendix K.2, Eq. 3 | Probability floor may not have been used in benchmark runs | ⚠ High — affects theoretical claims |
| D3 | Table 2 vs. DomainBed | No per-domain results reported; cannot verify aggregation | ⚠ Moderate — information incomplete |
| D4 | Section 5.2 | Gains over SWAD described as "differences between reported means, not paired confidence intervals" | ✓ Correctly qualified |
| D5 | Appendix J | "Matched seed-level baseline outcomes" required for paired tests — explicitly noted as unavailable | ✓ Correctly qualified |

---

## 7. Summary of High-Risk Items for Implementation Review

If code is recovered, these must be checked first (in priority order):

1. **Re-encoding path**: Is vij passed through mϕ again, or is cϕ(ui) used directly?
2. **Policy weight detachment**: Is sg(qij) applied before the student gradient?
3. **Reference prediction detachment**: Is sg(p̄(ui)) used in the KL?
4. **Probability floor τ**: What value was used in executed runs?
5. **Normalization convention**: How is BN handled for candidate features?
6. **Empty/infeasible pool logging**: Is each case tracked separately?
7. **Teacher gradient**: Are teacher parameters frozen throughout?
