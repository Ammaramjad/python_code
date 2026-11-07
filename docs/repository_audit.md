# Repository Audit — CausalGuard ICLR 2027 Submission 61846

**Date:** 2026-11-06  
**Auditor:** Research Engineering Collaborator (Cloud Agent)  
**Branch:** cursor/causalguard-rebuttal-96ab  
**Git commit at audit:** d80b200

---

## 1. Environment Inspection

### 1.1 Execution Environment

| Property | Value |
|---|---|
| OS | Linux 6.12.113+ (Cloud Agent VM) |
| Architecture | x86_64 |
| RAM | 15 GiB total, ~4.8 GiB available |
| Disk | 254 GB (/dev/vdc), 247 GB free |
| GPU | **None detected** — `nvidia-smi` not available in this environment |
| CUDA | Not available |

**Critical finding:** This Cloud Agent VM does not have an NVIDIA GPU. The user described a Windows workstation with RTX 4080/4080 Super; that machine is a separate, inaccessible resource from this environment. No training experiments can be executed in the current environment.

### 1.2 Workspace Contents at Audit Time

The workspace contains only:
- `MLP.ipynb` — Multi-layer perceptron notebook (speech emotion recognition, unrelated)
- `SER(Deep_Learning).ipynb` — Speech emotion recognition (unrelated)
- `SER - SVM - Feature Extraction-.ipynb` — SVM/SER notebook (unrelated)
- `SER_SVM.ipynb` — SVM notebook (unrelated)
- `TestingLive.ipynb` — Live testing notebook (unrelated)

**The CausalGuard codebase, training scripts, datasets, checkpoints, and experiment logs are entirely absent from this workspace.**

### 1.3 Uploaded Artifacts

- `/home/ubuntu/.cursor/projects/workspace/uploads/61846_CAUSALGUARD_COVERAGE_AWA_5686.pdf` — 25-page submitted manuscript (confirmed read)

**Missing from workspace:**
- Reviewer comment files (reviewers z2Uv, itnv, bpmm)
- Existing rebuttal draft
- Training code (backbone, mask network, donor policy, consistency loss, evaluation)
- Dataset directories (PACS, VLCS, Office-Home)
- Experiment checkpoints and logs
- Baseline implementations (ERM, SWAD, IRM, GroupDRO, MixStyle, MIRO)
- NAS path and credentials

---

## 2. Paper Content Audit

### 2.1 Submitted Method Summary (from PDF)

The PDF is 25 pages (9 main + 16 appendix). Key components:

**Architecture (Section 3):**
- Shared backbone Fθ: ResNet-50 (ImageNet-pretrained), 224×224 inputs
- Input-dependent mask mϕ(u) with temperature Tm; produces retained branch cϕ(u) and replaced branch sϕ(u)
- Probability-floor predictor p(u) with floor τ, 0 < τ < 1/C
- Candidate: vij = cϕ(ui) + sϕ(uj) — shared re-encoding through the same mask+classifier
- Frozen semantic teacher t for compatibility gate: aij = 1{tyi(vij) ≥ γ} · 1{‖b(vij) − b(ui)‖₂ ≤ rb}
- Donor policy: max over qi of difficulty + β·log det(G(q)+εI) subject to simplex, cap qmax, KL trust region ρq
- Losses: Lsup + λcf·Lcf + λy·Lcf-label + λb·Lb + λh·Lh

**Theory (Section 4):**
- Theorem 1: RQ(p) ≤ RP(p) + L√(κε/2) + B(ρ + ξ + η)
- Parameters κ (density ratio cap), ε (source consistency), ρ (factual marginal shift), ξ (semantic mismatch), η (target-support discrepancy)
- Paper explicitly states these are "assumptions or audit targets, not automatically observed"

**Reported Results (Table 2):**
- PACS: 90.3 ± 0.5% (5 runs)
- VLCS: 81.2 ± 0.4% (5 runs)
- Office-Home: 75.6 ± 0.5% (5 runs)
- ERM baselines: 86.2±0.7, 78.5±0.6, 71.8±0.8

**Note on the 82.37 value (Tables 5, 7, Figure 3c):** Appears as the peak mean accuracy in both the threshold sweep (γ=0.60) and mask-temperature sweep (Tm=0.5). The paper states VLCS = 81.2 ± 0.4% in Table 2. The 82.37 value is the per-sweep best, apparently from VLCS domain-macro scores at the selected hyperparameter — it exceeds the Table 2 mean because it corresponds to a specific sweep setting that may represent a single domain rather than the full dataset-macro mean, or there is an aggregation protocol difference. **This discrepancy requires clarification from the authors; it cannot be resolved without run logs.**

### 2.2 AI Use Statement

The paper explicitly states: "Generative AI assistance was used in developing and refining the conceptual framework, methodological exposition, mathematical claims and proofs, experimental design, and interpretation... It was not used to execute the reported training experiments or generate additional benchmark observations."

### 2.3 Verification Status of Reported Numbers

| Claim | Source | Verification Status |
|---|---|---|
| PACS 90.3 ± 0.5% | Table 2 | **UNVERIFIED** — no logs available |
| VLCS 81.2 ± 0.4% | Table 2 | **UNVERIFIED** — no logs available |
| Office-Home 75.6 ± 0.5% | Table 2 | **UNVERIFIED** — no logs available |
| Table 3 ablation diagnostics | Table 3 | **UNVERIFIED** — no logs available |
| Table 5 threshold sweep | Table 5 | **UNVERIFIED** — no logs available |
| Table 7 temperature sweep | Table 7 | **UNVERIFIED** — no logs available |
| Table 8 controlled interventions | Table 8 | **UNVERIFIED** — no logs available |
| 82.37 accuracy in sweep | Tables 5,7 | **INCONSISTENT** — exceeds Table 2 VLCS mean; aggregation unclear |

---

## 3. Missing Resources

### 3.1 Code
- [ ] Training script (backbone + mask + donor policy + losses)
- [ ] Evaluation script
- [ ] Baseline implementations (ERM, SWAD, IRM, GroupDRO, Mask-only, Gaussian perturbation)
- [ ] Donor policy solver (constrained concave optimization)
- [ ] Frozen teacher / compatibility gate code
- [ ] Audit computation code
- [ ] Dataset loaders

### 3.2 Data
- [ ] PACS dataset (splits, domain identifiers)
- [ ] VLCS dataset
- [ ] Office-Home dataset
- [ ] Split hashes / random seeds

### 3.3 Experiment Artifacts
- [ ] Per-seed, per-domain accuracy CSVs
- [ ] Training logs (loss curves, acceptance rates, effective donor counts)
- [ ] Checkpoints (selected and final)
- [ ] Configuration files (hyperparameters, solver tolerances)

### 3.4 External Resources
- [ ] Windows workstation with RTX 4080/4080 Super (not accessible from this VM)
- [ ] Synology DS1525+ NAS (no path or credentials provided)
- [ ] Reviewer comments (z2Uv, itnv, bpmm)

---

## 4. What Can Be Done in This Environment

**Can complete:**
- Documentation creation (this audit, discrepancy maps, reviewer response matrix)
- Rebuttal draft preparation based on paper content and stated reviewer concerns
- Theory verification (checking proof steps from the PDF)
- Implementation specification (describing what code should do, flagging concerns)
- Directory/repository structure creation
- Manuscript correction text preparation

**Cannot complete without additional resources:**
- Any training or evaluation experiments
- Result reproduction or verification
- Implementation correctness checks
- Per-domain or per-seed result recovery
- Any benchmark listed in Phases 3–5

---

## 5. Theory Verification (from PDF)

### 5.1 Theorem 1 Proof Check

The proof in Appendix C uses:
1. Pinsker's inequality: TV(p,q) ≤ √(DKL(p‖q)/2) ✓
2. Jensen under concave √: Eν TV ≤ √(Eν DKL / 2) ✓ (by Jensen applied to concave √ under probability measure ν)
3. Lipschitz transfer of risk ✓ (stated assumption)
4. TV bound on distribution differences ✓ (bounded loss integration)

**One subtlety:** Step (19)→(20): Eμ[w·DKL] ≤ κ·Eμ[DKL] = κε. This uses w ≤ κ pointwise and nonneg of DKL. ✓

**A potential concern:** The inequality at line (17)→(18) applies Pinsker as DKL(p(u)‖p(v)), but the KL is in the direction p(u)‖p(v). The standard Pinsker is TV(p,q) ≤ √(DKL(p‖q)/2). Since the paper uses DKL(p(u)‖p(v)) = DKL(p(u)‖p(v)) (not the symmetric version), and TV is symmetric, the direction is consistent if we write TV(p(u),p(v)) ≤ √(DKL(p(u)‖p(v))/2). ✓

**For smoothed cross-entropy:** Paper states B = log(1/τ), L = 1/τ. The 1/τ Lipschitz constant follows from the mean-value theorem argument in Appendix F (|log py − log p'y| ≤ |py − p'y|/τ ≤ TV/τ). ✓

### 5.2 Proposition 2 (Excluded-branch invariance)
The proof is immediate: if f(c,s) = g(c), then DKL(f(c,s)‖f(c,s̃)) = DKL(g(c)‖g(c)) = 0. ✓

### 5.3 Proposition 3 (Finite portfolio audit)
Hoeffding's inequality applies to bounded [0,B] loss and [0,K] KL divergence. Union over 2M events. ✓

The bound in Eq. (11) uses an = √(log(2M/δ)/(2n)). With two statistics and M models, the union bound over 2M events each with failure probability δ/(2M) gives total failure probability ≤ δ. ✓

### 5.4 Mathematical Issues Found
1. **The 82.37 value**: Appears in Figure 3c (threshold sweep VLCS accuracy peak) and Table 7 (temperature sweep peak at Tm=0.5). The Table 2 VLCS mean is 81.2 ± 0.4. The 82.37 appears to represent the per-sweep peak on a specific evaluation (possibly single-domain within VLCS, or a different aggregation). **This requires author clarification and a clear note in the rebuttal.**

2. **Loss bound constants**: For 0-1 loss, B=L=1. For smoothed cross-entropy, B=log(1/τ), L=1/τ. The paper correctly notes "Neither choice directly yields the same statement for discontinuous argmax accuracy." A margin-based conversion is in Appendix F. This is a genuine limitation reviewers have likely flagged.

3. **Feasibility condition**: kqmax ≥ 1 must hold for each anchor's donor pool. The paper correctly notes infeasible pools contribute only supervised loss. Appendix H proves sufficiency via uniform vector. ✓
