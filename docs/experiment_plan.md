# Experiment Plan — CausalGuard Rebuttal

**Date:** 2026-11-06  
**Status:** DRAFT — awaiting code, datasets, and GPU access  
**Branch:** cursor/causalguard-rebuttal-96ab

---

## Environment Requirements

| Resource | Required | Available | Blocker |
|---|---|---|---|
| CausalGuard training code | YES | NO | Must be supplied by authors |
| PACS dataset | YES | NO | Must be downloaded |
| VLCS dataset | YES | NO | Must be downloaded |
| Office-Home dataset | YES | NO | Must be downloaded |
| NVIDIA GPU (RTX 4080/4080 Super) | YES | NO (this VM) | Windows workstation with GPU must be accessed |
| CUDA ≥ 11.8 | YES | NO | On workstation |
| Python 3.9+ with PyTorch | YES | NO | On workstation |
| NAS for backup | OPTIONAL | NO | No path/credentials provided |

**Current state:** All experiments are blocked pending code and GPU access. This plan is ready to execute once those resources are available.

---

## Runtime Estimation (Hypothetical, RTX 4080 16 GB)

For ResNet-50 on DomainBed-style training:
- ERM epoch: ~2–4 min on PACS (batch=32, ~5k images per domain)
- CausalGuard epoch: ~4–8× ERM (candidate construction + policy solver per step)
- Typical DomainBed budget: 5000 steps × ~100 steps/min = ~50 min per run
- CausalGuard: estimate 3–5 hours per run (5000 steps with donor policy)
- 5 seeds × 3 datasets × 5 hours = ~75 GPU-hours

For rebuttal scope (3 seeds minimum):
- Experiments A+B: ~45 GPU-hours (3 seeds, 3 datasets, CausalGuard + no-re-encoding)
- Experiment C (MixStyle): ~15 GPU-hours (3 seeds, 3 datasets)
- Experiment D (synthetic): ~2 GPU-hours (small scale, CPU-feasible)
- Experiment E (efficiency): ~6 GPU-hours (timing runs, 3 methods)
- **Total estimate: ~70 GPU-hours**

RTX 4080 at ~16 TFLOPS BF16: feasible in 3–5 days of continuous runs.

---

## Experiment A: Per-Domain Results

**Goal:** Report per-domain accuracy for ERM, SWAD, CausalGuard on PACS, VLCS, Office-Home.

**Protocol:**
- Use original 5-seed protocol if logs are available, else rerun 3 seeds
- Match backbone (ResNet-50 ImageNet), splits, source-only selection
- Report: accuracy per domain × seed, domain mean, dataset mean, SD over runs

**Output schema** (`results/rebuttal/experiment_A_per_domain.csv`):
```
method,dataset,domain,seed,accuracy,checkpoint_epoch,selection_rule
CausalGuard,PACS,art_painting,0,91.2,45,source_val_max
CausalGuard,PACS,cartoon,0,88.7,45,source_val_max
...
```

**Primary analysis:**
- Per-domain mean and SD table
- Identify domains where CausalGuard improves vs. degrades vs. ERM and SWAD
- Verify that domain-macro mean matches Table 2

**Status:** PENDING — requires logs or rerun.

---

## Experiment B: Re-encoding Accuracy Ablation

**Goal:** Compare full CausalGuard vs. CausalGuard without re-encoding on accuracy (not just diagnostics).

**Definition of no-re-encoding variant:**
- Factual: p(ui) = softmax(hψ(cϕ(ui))) [unchanged]
- Candidate: p_candidate = softmax(hψ(cϕ(ui))) [use factual retained features, ignore donor style entirely for prediction]
- Consistency loss: DKL(sg(p̄(ui)) ‖ hψ(cϕ(ui))) — identically zero since both sides are the same computation
- This is the bypass negative control: consistency loss is structurally zero

**OR alternatively:**
- Candidate: softmax(hψ(cϕ(ui) + sϕ(uj))) — apply classifier to recombined feature WITHOUT re-applying mask
- This removes re-encoding but preserves the candidate's style injection

**Note:** The paper must specify which no-re-encoding variant is used in Table 3. These are architecturally different and the second variant still allows consistency gradients. The first (bypass) makes the consistency loss identically zero.

**Output schema** (`results/rebuttal/experiment_B_reencoding.csv`):
```
method,dataset,domain,seed,accuracy,accept_pct,preserve_pct,disagree_pct,eff_donors
full_causalguard,PACS,art_painting,0,91.2,74.6,96.8,3.4,6.8
no_reencoding_bypass,PACS,art_painting,0,89.1,...
no_reencoding_direct,PACS,art_painting,0,89.8,...
```

**Status:** PENDING.

---

## Experiment C: Matched Direct Competitors

**Priority 1: MixStyle**
- Use official DomainBed/MixStyle implementation
- Match: ResNet-50 ImageNet, same splits, source-only selection, same number of steps
- Disclose: MixStyle-specific α parameter chosen on source val

**Priority 2: MIRO**
- Use official MIRO implementation (Cha et al., ECCV 2022)
- Match: same backbone and pretraining checkpoint
- Note: MIRO uses a pretrained reference model — clarify if this gives it extra information access

**Label as:**
- `CausalGuard-rebuttal (3 seeds)` for new runs
- `External-reference` for published numbers with explicit citation

**Output schema** (`results/rebuttal/experiment_C_competitors.csv`):
```
method,dataset,domain,seed,accuracy,run_type,source
MixStyle,PACS,art_painting,0,88.3,new_matched_run,rebuttal_v1
MIRO,PACS,art_painting,0,89.7,new_matched_run,rebuttal_v1
CausalGuard,PACS,art_painting,0,90.1,new_run,rebuttal_v1
```

**Status:** PENDING.

---

## Experiment D: Synthetic SCM

**Can be run on CPU (small scale). Priority: HIGH.**

**Data generation (Python, no GPU needed for small version):**

```python
import numpy as np

def generate_scm_domain(n, env_spurious_strength, seed=0):
    """
    SCM: C0 ~ N(0,1), Y = sign(C0), 
    S = spurious_strength * Y + sqrt(1 - s^2) * eps_S,
    X = [C0 + eps_x, S + eps_s], nuisance = S-channel
    """
    rng = np.random.default_rng(seed)
    C0 = rng.normal(0, 1, n)
    Y = (C0 > 0).astype(int)
    eps_S = rng.normal(0, 1, n)
    S = env_spurious_strength * (2*Y - 1) + np.sqrt(max(1 - env_spurious_strength**2, 0.01)) * eps_S
    eps_X = rng.normal(0, 0.1, n)
    X = np.stack([C0 + eps_X, S], axis=1)
    return X, Y, C0, S
```

**Variants:**
1. Source domains: spurious strengths ρ ∈ {0.9, 0.7, 0.5}
2. Target domain: ρ = 0.0 (weakened correlation) and ρ = -0.5 (reversed)
3. In-support target: same ρ range as sources
4. Out-of-support target: ρ = -0.9 (completely reversed, outside source range)
5. Ambiguous: all sources have ρ = 0.95 (perfect shortcut)

**Methods to compare:**
- ERM (logistic regression)
- CausalGuard-approximate (simple 2-feature mask + synthetic donor)
- No-re-encoding variant

**Output:** Per-condition accuracy, spurious feature sensitivity, label preservation.

**Status:** Can be implemented in this VM (no GPU needed). **This is the highest priority feasible task in current environment.**

---

## Experiment E: Efficiency Measurement

**Protocol:**
- Measure examples/second, time/epoch, peak GPU memory for ERM, SWAD, CausalGuard
- Record: hardware (RTX 4080, driver version, CUDA version), precision (fp32/bf16), batch size, donor count J
- Timing: exclude first epoch (warmup), measure 5 epochs, report mean and SD
- GPU synchronization: `torch.cuda.synchronize()` before timing
- Report inference latency separately: 1000 forward passes, batch size {1, 32, 128}

**Status:** PENDING — requires workstation GPU.

---

## Run Manifest

Each run will be recorded in `results/raw/run_manifest.csv`:

```
run_id,timestamp,git_commit,experiment,method,dataset,seed,config_file,hardware,checkpoint_rule,selected_checkpoint,status,notes
```

---

## Checkpoint Selection Rule

For all experiments: **source validation accuracy at final evaluation step, source-only.**
- No target-domain information at any point
- Selection is deterministic given the run log
- Selected checkpoint epoch is recorded per run

---

## Storage Plan

- Active: local SSD (`results/raw/`, `results/rebuttal/`)
- Backup: NAS path TBD (not yet accessible)
- Per run: `results/raw/{run_id}/` containing config.yaml, train.log, eval.csv, checkpoint_selected.pt

---

## Interruption Protocol

- All runs use `--resume` flag if checkpoint exists
- Run manifest updated with status INTERRUPTED if killed
- Partial results retained and labeled
- No discarding of runs for unfavorable outcomes
