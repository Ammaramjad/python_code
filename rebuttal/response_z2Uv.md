# Response to Reviewer z2Uv — CausalGuard ICLR 2027

**Submission 61846**  
**Status:** DRAFT — only completed and verified evidence is included. Items marked [PENDING] await experiments on the GPU workstation. Items marked [CLARIFICATION NEEDED] require author input before they can be finalized.

---

## W1: Intended Shifts and Comparison with Existing Approaches

**Concern:** Which shift families does the method target? The comparison with MixStyle, MIRO, and causal matching is incomplete.

**Response:**

CausalGuard targets domain shifts driven by the nuisance variable S in the motivating SCM (Eq. 1): shifts that change style, texture, or background while preserving content and the label mechanism. The paper explicitly states scope: "robustness extends only to the tested shifts and the assumptions stated in the analysis" (Section 1) and excludes unseen classes, arbitrary label-mechanism changes, and interventions outside candidate support (Section 6). We agree this should be stated more prominently and will add a "Targeted shift family" paragraph at the start of Section 5.

The paper acknowledges in Section 2: "direct matched comparisons with causal matching and MIRO remain important for assessing the scope of the contribution." We are running matched reruns.

[PENDING: EXP C — MixStyle and MIRO reruns under identical protocol. Will add table here.]

**On the distinction from MixStyle:** MixStyle interpolates feature statistics (AdaIN-style) and does not involve a compatibility gate, donor weighting, or re-encoding path. Without re-encoding, a consistency loss on the replaced branch is structurally zero (Proposition 2). MixStyle therefore cannot test whether the retained features are invariant — it can only encourage feature distribution alignment. The proposed Experiment B ablation will quantify the accuracy difference from removing re-encoding while holding all other components fixed.

**On the distinction from causal matching (Mahajan et al., 2021):** Causal matching uses object-level correspondences across domains, requiring explicit instance-level pairing information. CausalGuard constructs pairs endogenously from pooled source features using a compatibility gate, without requiring correspondence annotations.

---

## W2: Joint Backbone–Mask Failure (Co-adaptation)

**Concern:** The mask and backbone can co-adapt to retain a spurious source-stable feature. Re-encoding removes a computational tautology but cannot prevent this.

**Response:**

This concern is correct and is acknowledged explicitly in multiple places in the paper:
- Appendix B: "Re-encoding removes one architectural source of vacuity; it does not guarantee that optimization learns the correct factors."
- Appendix B: "Mask leakage. The gate can encode information about the whole input through its weights, even if only a few output coordinates remain."
- Appendix E: "If all real examples share the same shortcut, arbitrary feature extrapolation need not discover which change preserves the label."

The paper does not claim that CausalGuard identifies true causal variables. It claims an architectural improvement over bypass vacuity and a mechanistic audit.

We provide new controlled evidence from a synthetic SCM (Experiment D, completed in this environment):

**Synthetic SCM Results (2D linear, 3 seeds, logistic regression approximation)**

| Method | In-support (ρ=0.60) | Weakened (ρ=0.10) | Zero (ρ=0.00) | Reversed (ρ=-0.50) | Out-of-support (ρ=-0.90) | Ambiguous (ρ=0.95) |
|---|---|---|---|---|---|---|
| ERM | 0.949±0.009 | 0.832±0.024 | 0.811±0.032 | 0.711±0.014 | 0.613±0.052 | 1.000±0.000 |
| CG (re-enc) | 0.949±0.010 | 0.833±0.011 | 0.819±0.008 | 0.713±0.015 | 0.626±0.011 | 1.000±0.000 |
| Oracle (content) | 0.969±0.014 | 0.965±0.011 | 0.976±0.000 | 0.969±0.002 | 0.961±0.007 | 0.973±0.004 |

**Findings:**
1. **ERM degrades as spurious correlation weakens/reverses**, confirming shortcut reliance.
2. **CG (linear approx.) and ERM have near-identical accuracy in this setting** — an honest result. In 2 of 3 seeds, the mask learns to weight content (dim 0) > nuisance (dim 1) (content=0.92/0.91, nuisance=0.84/0.79), but the accuracy advantage over ERM is small because the linear ERM has modest spurious reliance in this regime.
3. **Ambiguous condition (all sources ρ=0.95):** Both ERM and CG achieve accuracy=1.0 on the in-distribution ambiguous target — but this is because the target shares the same shortcut. If the target had *reversed* spurious correlation (ρ=-0.95), both methods would fail. This confirms the stated scope boundary.
4. **Out-of-support (ρ=-0.90):** Both methods degrade; CG provides marginal improvement in this linear case but it is not statistically significant over 3 seeds.

The oracle (using the ground-truth content feature) achieves >96% across all conditions, demonstrating that the content feature is robustly predictive. The gap between CG and oracle represents the unresolved co-adaptation problem in the linear case.

**Limitation of this experiment:** This is a 2D linear approximation with logistic regression, not ResNet-50 on natural images. It demonstrates mechanism boundaries but cannot substitute for the deep-learning benchmark results. We are preparing a larger-scale neural network version. [PENDING: EXP D neural version on workstation]

**Manuscript change:** We will add this result as a new subsection in Section 5 with explicit caveats about the linear approximation, the ambiguous failure condition, and the oracle gap.

---

## W3: Bounded-Loss Assumption and Theoretical Contribution

**Concern:** The theorem is conditional on κ, ρ, ξ, η which are unidentified from source data. The theoretical contribution beyond standard risk transfer bounds is unclear.

**Response:**

The theorem's assumptions are explicitly stated as conditional. The paper says: "these quantities are assumptions or audit targets, not automatically observed by the algorithm" (Section 4) and the bound "is intentionally conditional and can be vacuous" (Section 4). The claim is not a distribution-free deployment guarantee.

The contribution relative to generic transfer bounds is specific to this method:
1. **Decomposition matched to the algorithm:** The four terms (κε, Bρ, Bξ, Bη) correspond to exactly four algorithmic components: consistency optimization (ε), candidate reweighting (κ), semantic filtering (ξ), and coverage gap (η). This maps theory to auditable quantities.
2. **The re-encoding property:** Without re-encoding, ε would be identically zero regardless of the learned partition (Proposition 2). The theorem is vacuously satisfied by any predictor without re-encoding. With re-encoding, achieving small ε has non-trivial implications.
3. **The audit–theorem connection:** The finite-sample audit in Proposition 3 provides a concentration result that is valid because (a) predictors are frozen before the audit, (b) the probability floor makes KL bounded by K = log(1/τ), and (c) models share anchors because only the union bound over models is needed.

**On the probability floor τ:** We note that Appendix K.2 states "the hypothetical probability floor is valid only for class count C < 100 and is not an asserted setting of the benchmark runs." This is a critical clarification: if τ = 0 in executed runs, the KL divergence is unbounded and Proposition 3 does not apply to the executed runs directly. We will clarify the actual τ value used and either (a) confirm τ > 0 was used in runs or (b) qualify the theoretical claims to apply to an audited version of the predictor with τ applied post-hoc. [CLARIFICATION NEEDED: actual τ value from run configuration]

**Manuscript change:** We will add a paragraph distinguishing the mathematical contribution (decomposition, audit connection) from a distributional robustness certificate, and explicitly state which terms can vs. cannot be estimated from source data.

---

## W4: Reproducibility and Tuning

**Concern:** No code is released. Hyperparameter selection protocol is unclear.

**Response:**

The source-only selection rule follows DomainBed: a held-out source validation set is used for checkpoint selection; no target-domain information is used at any stage. The threshold sweep in Figure 3 is explicitly described as "descriptive; target accuracy is not used to select its operating point" (Section 5.4). The operating point γ=0.60 was selected on source validation.

For the remaining hyperparameters (β, λcf, τ, Tm, qmax, ρq), the selection protocol and budget should be explicitly stated. We will add a hyperparameter selection appendix specifying: which parameters were swept, the range and grid, the selection criterion (source validation accuracy), and the final values. [CLARIFICATION NEEDED: actual sweep protocol from authors]

We are preparing code for anonymous release. We will prepare a clean anonymous snapshot following the repository preparation protocol.

---

## W5: Realistic Benchmarks

**Concern:** PACS, VLCS, Office-Home are saturated.

**Response:** Acknowledged. WILDS is explicitly noted as a "future extension" in the paper. We are estimating compute cost for TerraIncognita. [PENDING: EXP broader benchmark]

---

## W6: Remaining Contribution After Qualifications

**Concern:** After qualifications, what concrete advance does CausalGuard provide?

**Response:**

The concrete advances are:
1. **Architectural:** Re-encoding is a specific, implementable solution to bypass vacuity. Proposition 2 provides a formal statement of the problem; Figure 1 and Table 1 show its implementation; Table 3 shows its empirical effect on disagreement (5.9% vs. 3.4%).
2. **Diagnostic framework:** The compatibility gate, diversity constraint, and frozen audit are tested separately in Table 3. The validity–coverage trade-off in Figure 3 is a substantive empirical characterization.
3. **Conditional theory with explicit audit targets:** The decomposition into κ, ε, ρ, ξ, η provides a vocabulary for structured failure analysis that the method's training procedure directly targets.
4. **Explicit scope statement:** The paper's explicit acknowledgment of what it does not claim is itself a contribution to the norms of this research area.

The accuracy gains (Table 2) are reported as descriptive, with appropriate uncertainty qualifications.

---

## W7: Controlled Synthetic Extrapolation

**Concern:** Report a case where target shift is intentionally outside candidate support.

**Response:** See W2 above — the `tgt_out_of_support` condition (ρ=-0.90) in Experiment D is exactly this. As expected, accuracy degrades. The oracle (ground-truth content) maintains high accuracy, confirming the target is in principle learnable from content features but the method cannot recover from the coverage gap.

---

## W8: Differences from Mixing Methods

**Concern:** How does CausalGuard differ quantitatively from MixStyle and other mixing methods?

**Response:**

Key structural differences:
- **Re-encoding:** MixStyle does not re-encode. See W1/W2 above.
- **Compatibility filtering:** MixStyle accepts all feature-statistics interpolations. CausalGuard rejects ~25% of same-class donors (Table 3: acceptance 74.6% vs. 100% for no-filter).
- **Diversity constraint:** MixStyle does not optimize donor weights. CausalGuard's policy increases effective donors from 3.6 (no-diversity) to 6.8.
- **Training objective:** MixStyle minimizes classification loss on mixed features. CausalGuard minimizes a consistency loss between factual and counterfactual predictions.

Quantitative comparison requires matched reruns. [PENDING: EXP C]
