# Evidence Index — CausalGuard ICLR 2027 Rebuttal
**Submission 61846 | Branch cursor/causalguard-iclr-rebuttal-df68**

## Classification key
- **N** Newly measured — script run in this session; traceable to CSV
- **A** Analytically derived — calculation shown in full
- **M** Manuscript-reported — from submitted PDF Table/Figure
- **D** Draft author-provided — from rebuttal docx (2026-11-07); not independently reproduced; requires GPU + original code to verify
- **P** Pending — blocker identified; experiment not run

---

## 1. z2Uv Q1 SCM — newly measured

**Script:** `scripts/experiment_z2Uv_q1_scm.py`  
**Seeds:** 0, 1, 2, 3, 4  
**Raw CSV:** `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv`  
**Commit:** 362929c  

| Value | CSV column | Classification |
|---|---|---|
| ERM error represented 17.6 ± 1.0 % | err_erm, condition=represented | N |
| No-reenc error represented 17.7 ± 1.1 % | err_nore, condition=represented | N |
| CG error represented 17.7 ± 1.1 % | err_full, condition=represented | N |
| ERM flips represented 40.5 ± 2.1 % | flip_erm, condition=represented | N |
| No-reenc flips represented 40.3 ± 2.0 % | flip_nore, condition=represented | N |
| CG flips represented 40.3 ± 2.0 % | flip_full, condition=represented | N |
| CG−ERM per seed represented [+0.70, +0.10, +0.95, −0.10, −1.25] | err_full − err_erm | N |
| CG−no-reenc per seed represented [0.00, 0.00, 0.00, +0.05, 0.00] | err_full − err_nore | N |
| ERM error withheld 11.1 ± 0.5 % | err_erm, condition=withheld | N |
| No-reenc error withheld 11.1 ± 0.5 % | err_nore, condition=withheld | N |
| CG error withheld 11.1 ± 0.5 % | err_full, condition=withheld | N |
| ERM flips withheld 10.9 ± 0.8 % | flip_erm, condition=withheld | N |
| CG flips withheld 10.9 ± 0.6 % | flip_full, condition=withheld | N |
| No-reenc flips withheld 10.9 ± 0.6 % | flip_nore, condition=withheld | N |
| CG−ERM per seed withheld [−0.05, +0.20, +0.40, −0.20, −0.05] | err_full − err_erm | N |
| Mask x_c mean 0.89 | mask_full_xc | N |
| Mask x_s1 mean 0.71 | mask_full_xs1 | N |
| Mask x_s2 mean 0.52 | mask_full_xs2 | N |
| CG ≡ no-reenc masks (differ < 0.002) | mask_full_* vs mask_nore_* | N |

**SCM implementation verification (from code inspection, `scripts/experiment_z2Uv_q1_scm.py`):**
- `sample_nuisance_only_pairs` holds C, Y, and the unflipped bit fixed, flips the named bit, and calls `make_X` twice. Each call draws independent N(0, 0.5²) noise on x_c, x_s1, and x_s2. The flip rate is therefore a paired prediction flip rate with resampled observation noise.
- B₁ = 1 sets the x_s1 signal to +1.5 and B₁ = 0 sets it to −1.5. P(B₁ = Y) is the sampling association, not the sign of the signal. The training bit B₂ is fixed at 0; x_s2 still varies through noise.
- Full CausalGuard: `c_v = m * v_ij` with `v_ij = c_anchor + (1-m)*x_donor`.
- Unchanged-anchor bypass: `c_v = np.tile(c_i, ...)`. The consistency KL is identically zero in this arm only. Manuscript Table 3 reports 5.9% disagreement, so that column is not this bypass.
- Shared splits and source-only checkpoint selection. No target labels used.

---

## 2. Analytical conditional nuisance TV gaps

**Derivation:** `scripts/experiment_z2Uv_q1_scm.py` header and z2Uv Q1 response

| Value | Derivation | Classification |
|---|---|---|
| Represented shift TV = 0.20 | Source P(B₁=1\|Y=1) = (0.7+0.8+0.9)/3 = 0.80; target = 0.60; TV = ½(|0.80−0.60|+|0.20−0.40|) = 0.20 | A |
| Withheld shift TV = 0.55 | Source P(B₂=0\|Y) = 1.00; target P(B₂=0\|Y) = 0.45; TV = ½(|1.00−0.45|+|0.00−0.55|) = 0.55 | A |
| Both gaps distinct from η | η requires target distribution knowledge; TV computed analytically from spec | A |

---

## 3. SCM-B — High-Uniform-Spurious Diagnostic

**Script:** `scripts/experiment_scm_b_high_spurious.py`  
**Seeds:** 0, 1, 2, 3, 4  
**Raw CSV:** `results/rebuttal/scm_b_high_spurious_20261113_023734.csv`  
**Commit:** (this session)  

| Value | CSV column | Classification |
|---|---|---|
| ERM error reversed 38.4 ± 1.3 % | err_erm, condition=reversed | N |
| No-reenc error reversed 39.4 ± 1.2 % | err_nore, condition=reversed | N |
| CG error reversed 39.4 ± 1.2 % | err_full, condition=reversed | N |
| CG−ERM per seed [+2.0, +1.4, +0.1, +0.1, +1.1] mean +1.0 pp | diff_full_vs_erm | N |
| CG−no-reenc per seed all 0.0 pp | diff_full_vs_nore | N |
| ERM flips in-dist 53.4 % | flip_erm, condition=in_dist | N |
| Mask x_s1 mean 0.81 (vs 0.71 in z2Uv Q1) | mask_cg_xs1 | N |

---

## 4. Manuscript-reported values used in rebuttal

**Source:** Submitted PDF (Table 2, Table 3, Appendices)

| Value | Table/Section | Classification |
|---|---|---|
| PACS macro CausalGuard 90.3 ± 0.5 % | Table 2 | M |
| VLCS macro CausalGuard 81.2 ± 0.4 % | Table 2 | M |
| Office-Home macro CausalGuard 75.6 ± 0.5 % | Table 2 | M |
| ERM PACS 86.2 ± 0.7 % | Table 2 | M |
| SWAD PACS 88.1 ± 0.6 % | Table 2 | M |
| Disagreement full CG 3.4 ± 0.5 % | Table 3 | M |
| Disagreement no-reenc 5.9 ± 0.7 % | Table 3 | M |
| Gate acceptance 74.6 % | Table 3 | M |
| Effective donors full CG 6.8 | Table 3 | M |
| Effective donors no-diversity 3.6 | Table 3 | M |
| Label preservation 96.8 % (γ=0.60) | Abstract / Table 5 | M |
| Label preservation 98.5 % (γ=0.90) | Table 5 | M |
| Acceptance drop 74.6→29.5 % (γ=0.90) | Table 5 | M |
| Coverage drop 0.78→0.33 (γ=0.90) | Table 5 | M |
| Table 8 acceptance nuisance-changing 76.4–82.5 % | Table 8 | M |
| Table 8 acceptance class-changing 11.2–18.6 % | Table 8 | M |

---

## 5. Draft author-provided values (D) — not in the paste-ready replies

**Source:** `CausalGuard_ICLR2027_Rebuttal_Reviewer_Revision_f5c1.docx` (uploaded 2026-11-07). The docx is not in this repository.  
**Blocker:** Original CausalGuard training code, PACS/VLCS/Office-Home datasets, and a GPU are not available here.

On 2026-11-13 the domain cells in that draft were checked only for arithmetic: their unweighted means match the displayed dataset macros within 0.05 percentage points, including the manuscript Table 2 macros. PACS MixStyle's displayed macro (88.9) is 0.05 below the mean of its displayed domain cells (88.95). That check does not verify the cells. They were removed from `rebuttal/final/z2Uv.md`, `rebuttal/final/itnv.md`, and `rebuttal/final/bpmm.md`.

## 5b. Side-by-side Q1 table and second run

| Artifact | Role |
|---|---|
| `results/rebuttal/z2Uv_q1_scm_20261113_021503.csv` | Primary raw five-seed file. It is primary because it is the first complete five-seed execution of `scripts/experiment_z2Uv_q1_scm.py` and the input to `scripts/report_z2Uv_q1_table.py`. The reply table is computed from this file only. |
| `results/rebuttal/z2Uv_q1_side_by_side_20261113_021503.md` | Side-by-side rendering of the primary CSV |
| `results/rebuttal/z2Uv_q1_scm_20261113_025236.csv` | Later run of the same script on Python 3.12.3 / numpy 2.5.4. Kept. Not averaged into the reply table, because seed-level errors differ. |
| `results/rebuttal/scm_b_high_spurious_20261113_023734.csv` | Separate SCM-B configuration (every source has P(B₁=Y)=0.9). Kept. Not part of the Q1 table. |
| `results/rebuttal/run_reconciliation.md` | Which “identical” sentence refers to Experiment D, Q1, the replication, and SCM-B |
| `results/rebuttal/pending_gpu_jobs.md` | GPU jobs not started |

| Value | Response used in | Classification |
|---|---|---|
| PACS Art Painting CG 88.7 ± 0.7 % | excluded from paste-ready replies | D |
| PACS Cartoon CG 86.9 ± 0.8 % | excluded from paste-ready replies | D |
| PACS Photo CG 97.4 ± 0.3 % | excluded from paste-ready replies | D |
| PACS Sketch CG 88.2 ± 0.9 % | excluded from paste-ready replies | D |
| PACS Art no-reenc 87.2 ± 0.8 % | excluded from paste-ready replies | D |
| PACS Cartoon no-reenc 85.3 ± 0.9 % | excluded from paste-ready replies | D |
| PACS Photo no-reenc 97.5 ± 0.3 % | excluded from paste-ready replies | D |
| PACS Sketch no-reenc 86.0 ± 1.0 % | excluded from paste-ready replies | D |
| PACS macro no-reenc 89.0 ± 0.6 % | excluded from paste-ready replies | D |
| MixStyle PACS/VLCS/OH per-domain | excluded from paste-ready replies | D |
| ERM/SWAD per-domain PACS/VLCS/OH | excluded from paste-ready replies | D |
| Training time CG 4.90 ± 0.19 h | excluded from paste-ready replies | D |
| Peak GPU memory CG 14.2 ± 0.3 GB | excluded from paste-ready replies | D |
| Batch-1 latency CG 8.6 ± 0.3 ms | excluded from paste-ready replies | D |
| Batch-32 throughput CG 371 ± 7 images/s | excluded from paste-ready replies | D |

---

## 6. Pending (blocked)

| Experiment | Blocker | Resume command |
|---|---|---|
| MIRO/Causal Matching/Causal Balancing reruns | Original code not in repo; PACS/VLCS/OH datasets absent | Provide code + datasets path; run `python train.py --algorithm MIRO --dataset PACS` |
| DomainNet, TerraIncognita, WILDS | Datasets not available | Provide dataset paths |
| Per-seed per-domain GPU logs (PACS/VLCS/OH) | Original training runs not preserved | Re-run from code |
| Numerical τ for the ResNet-50 runs | No config, log, or checkpoint in this repository records it. `scripts/run_manifest_pacs.yaml` has `tau: null`. Appendix K.2 says the floor is not an asserted benchmark setting. The paste-ready reply states the bound only for a predictor with p_y ≥ τ and does not give a number. The linear scripts' default is a script constant for the C=2 case of Eq. (3); it is not the benchmark value. | Recover the original run config if a number is required later |
| Anonymous code release | In preparation | N/A |
| Independent efficiency measurement | GPU + original code required | Profile with `scripts/profile_efficiency.py` (to be written) |
