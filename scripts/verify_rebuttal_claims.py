"""Check paste-ready rebuttal claims against the CSVs and the linear code.

Regenerates rebuttal/final/complete_rebuttal.md from the three final files,
copies those files to rebuttal/openreview_*.md, and exits nonzero on a mismatch.
"""

import csv
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FINAL = ROOT / "rebuttal" / "final"
PRIMARY = ROOT / "results" / "rebuttal" / "z2Uv_q1_scm_20261113_021503.csv"
RERUN = ROOT / "results" / "rebuttal" / "z2Uv_q1_scm_20261113_025236.csv"
SCMB = ROOT / "results" / "rebuttal" / "scm_b_high_spurious_20261113_023734.csv"
SIDE = ROOT / "results" / "rebuttal" / "z2Uv_q1_side_by_side_20261113_021503.md"
IMPL = ROOT / "scripts" / "experiment_z2Uv_q1_scm.py"

PASTE = {
    "z2Uv": FINAL / "z2Uv.md",
    "itnv": FINAL / "itnv.md",
    "bpmm": FINAL / "bpmm.md",
}

BANNED = [
    "4.90",
    "14.2 ±",
    "83.8",
    "371 ±",
    "1.3 pp",
    "88.7 ±",
    "86.9 ±",
    "97.4 ±",
    "88.2 ±",
    "87.2 ±",
    "85.3 ±",
    "97.5 ±",
    "86.0 ±",
    "89.0 ±",
    "τ = 0.05",
    "τ=0.05",
    "tau=0.05",
]


def load(path):
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def fail(message):
    print(f"FAIL: {message}")
    return 1


def main():
    errors = 0
    texts = {name: path.read_text() for name, path in PASTE.items()}

    header = (
        "# Combined rebuttal\n\n"
        "Regenerated from `rebuttal/final/z2Uv.md`, `rebuttal/final/itnv.md`, "
        "and `rebuttal/final/bpmm.md`. Paste each reviewer file as its own "
        "OpenReview comment.\n"
    )
    pieces = [header]
    for name, path in PASTE.items():
        pieces.append(
            f"## Reviewer {name}\n\nSource: `rebuttal/final/{name}.md`\n\n"
            + texts[name].rstrip()
            + "\n"
        )
    combined = "\n---\n\n".join(pieces) + "\n"
    combined_path = FINAL / "complete_rebuttal.md"
    combined_path.write_text(combined)
    for name, path in PASTE.items():
        (ROOT / "rebuttal" / f"openreview_{name}.md").write_text(texts[name])

    written = combined_path.read_text()
    for name, body in texts.items():
        if body not in written:
            errors += fail(f"complete_rebuttal.md does not contain {name}.md verbatim")
        if (ROOT / "rebuttal" / f"openreview_{name}.md").read_text() != body:
            errors += fail(f"openreview_{name}.md diverges from final/{name}.md")

    conditional = (
        "For a predictor satisfying p_y ≥ τ, cross-entropy is bounded by "
        "log(1/τ) and is 1/τ-Lipschitz in predictive total variation."
    )
    if conditional not in texts["z2Uv"]:
        errors += fail("conditional τ sentence missing from z2Uv")
    if "No numerical probability floor was recovered" not in texts["z2Uv"]:
        errors += fail("z2Uv does not say the numerical floor was not recovered")

    impl = IMPL.read_text()
    needle = "return (1 - 2 * self.tau) * sigmoid(logit) + self.tau"
    if needle not in impl:
        errors += fail("Eq. (3) two-class implementation not found")
    if "which is Eq. (3) when C = 2" not in texts["z2Uv"]:
        errors += fail("reply does not record the C=2 check of Eq. (3)")

    for name, body in texts.items():
        for token in BANNED:
            if token in body:
                errors += fail(f"{name}.md contains excluded figure {token!r}")
    for token in BANNED:
        if token in written:
            errors += fail(f"complete_rebuttal.md contains excluded figure {token!r}")

    side_rows = [
        line for line in SIDE.read_text().splitlines() if line.startswith("| Represented") or line.startswith("| Withheld")
    ]
    if len(side_rows) != 4:
        errors += fail(f"expected 4 side-by-side rows, found {len(side_rows)}")
    for row in side_rows:
        if row not in texts["z2Uv"] or row not in written:
            errors += fail(f"table row missing from the reply: {row[:80]}")

    rows = load(PRIMARY)
    by_seed = defaultdict(list)
    for row in rows:
        by_seed[int(row["seed"])].append(row)
    if sorted(by_seed) != [0, 1, 2, 3, 4]:
        errors += fail("primary CSV is not seeds 0-4")

    masks = {"xc": [], "xs1": [], "xs2": []}
    val = []
    max_mask_gap = 0.0
    for seed, group in by_seed.items():
        first = group[0]
        masks["xc"].append(float(first["mask_full_xc"]))
        masks["xs1"].append(float(first["mask_full_xs1"]))
        masks["xs2"].append(float(first["mask_full_xs2"]))
        val.append(float(first["src_val_acc_erm"]))
        for row in group[1:]:
            for coord in ("xc", "xs1", "xs2"):
                if abs(float(row[f"mask_full_{coord}"]) - float(first[f"mask_full_{coord}"])) > 1e-9:
                    errors += fail(f"seed {seed} mask differs across conditions")
            if int(row["n_eval_pairs"]) != 2000:
                errors += fail(f"seed {seed} n_eval_pairs is not 2000")
        if int(first["n_eval_pairs"]) != 2000:
            errors += fail(f"seed {seed} n_eval_pairs is not 2000")
        for row in group:
            for coord in ("xc", "xs1", "xs2"):
                gap = abs(float(row[f"mask_full_{coord}"]) - float(row[f"mask_nore_{coord}"]))
                max_mask_gap = max(max_mask_gap, gap)
    means = {k: float(np.mean(v)) for k, v in masks.items()}
    print(
        "primary mask means "
        f"xc={means['xc']:.4f} xs1={means['xs1']:.4f} xs2={means['xs2']:.4f} "
        f"max |cg-nore|={max_mask_gap:.4f} "
        f"val={min(val):.4f}-{max(val):.4f}"
    )
    if round(means["xc"], 2) != 0.89 or round(means["xs1"], 2) != 0.71 or round(means["xs2"], 2) != 0.52:
        errors += fail(f"mask means do not round to 0.89, 0.71, 0.52: {means}")
    if max_mask_gap > 0.002:
        errors += fail(f"mask gap {max_mask_gap} exceeds 0.002")
    if f"{min(val):.4f}" != "0.8678" or f"{max(val):.4f}" != "0.8989":
        errors += fail(f"validation range changed: {min(val):.4f}-{max(val):.4f}")

    represented_tv = abs(0.8 - 0.6)
    withheld_tv = abs(0.0 - 0.55)
    if abs(represented_tv - 0.20) > 1e-12 or abs(withheld_tv - 0.55) > 1e-12:
        errors += fail("analytical TV identities failed")
    tv_by_cond = {row["condition"]: float(row["analytical_tv"]) for row in rows}
    if abs(tv_by_cond["represented"] - 0.20) > 1e-9 or abs(tv_by_cond["withheld"] - 0.55) > 1e-9:
        errors += fail(f"CSV analytical_tv is {tv_by_cond}")

    for phrase in (
        "021503.csv",
        "025236.csv",
        "scm_b_high_spurious_20261113_023734.csv",
        "first complete five-seed execution",
        "mean +0.08",
        "-1.25",
        "+0.06",
        "Can you show a case where",
        "HTTP 403",
    ):
        if phrase not in texts["z2Uv"]:
            errors += fail(f"z2Uv missing {phrase!r}")

    index = (FINAL / "evidence_index.md").read_text()
    for phrase in (
        "z2Uv_q1_scm_20261113_021503.csv",
        "z2Uv_q1_scm_20261113_025236.csv",
        "scm_b_high_spurious_20261113_023734.csv",
        "first complete five-seed execution",
    ):
        if phrase not in index:
            errors += fail(f"evidence index missing {phrase!r}")

    scmb = [row for row in load(SCMB) if row["condition"] == "reversed"]
    err_erm = np.array([float(row["err_erm"]) for row in scmb])
    err_full = np.array([float(row["err_full"]) for row in scmb])
    xs1 = np.array([float(row["mask_cg_xs1"]) for row in scmb])
    erm_txt = f"{err_erm.mean():.1f} ± {err_erm.std(ddof=0):.1f}"
    full_txt = f"{err_full.mean():.1f} ± {err_full.std(ddof=0):.1f}"
    print(
        f"SCM-B reversed ERM {erm_txt} CG {full_txt} "
        f"mean paired {err_full.mean() - err_erm.mean():+.2f} "
        f"xs1 {xs1.mean():.4f}"
    )
    if erm_txt not in texts["z2Uv"] or full_txt not in texts["z2Uv"]:
        errors += fail("SCM-B mean±sd missing from z2Uv")
    if abs((err_full - err_erm).mean() - 0.96) > 0.005:
        errors += fail("SCM-B paired mean is not +0.96")
    if round(float(xs1.mean()), 2) != 0.81:
        errors += fail(f"SCM-B xs1 mean is {xs1.mean():.4f}, not about 0.81")

    if not RERUN.exists():
        errors += fail("replication CSV missing")

    for phrase in (
        "Table 2",
        "86.2 ± 0.7",
        "90.3 ± 0.5",
        "still open",
        "per-domain",
        "matched MixStyle",
        "GPU",
    ):
        if phrase not in texts["itnv"]:
            errors += fail(f"itnv missing {phrase!r}")

    for phrase in (
        "prediction disagreement",
        "not held-out domain accuracy",
        "PACS accuracy ablation:** not run",
        "not Table 3 disagreement and not held-out accuracy",
        "40.5 ± 2.1%",
        "+0.08 pp",
        "−1.25 pp",
    ):
        if phrase not in texts["bpmm"]:
            errors += fail(f"bpmm missing {phrase!r}")

    if errors:
        print(f"{errors} check(s) failed")
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
