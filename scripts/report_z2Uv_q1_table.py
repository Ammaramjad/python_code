"""Build the side-by-side z2Uv Q1 table from a raw five-seed CSV.

Reads one raw results file and writes a markdown table plus a flat CSV.
Population SD (ddof=0), matching the experiment summary writer.
Does not overwrite the raw CSV.
"""

import argparse
import csv
import os
from collections import defaultdict

import numpy as np


def load_rows(path):
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise SystemExit(f"empty CSV: {path}")
    return rows


def fnum(row, key):
    return float(row[key])


def fmt_pm(vals):
    arr = np.asarray(vals, dtype=float)
    return f"{arr.mean():.1f} ± {arr.std(ddof=0):.1f}"


def fmt_seeds(vals):
    parts = []
    for v in vals:
        sign = "+" if v > 0 else ""
        parts.append(f"{sign}{v:.2f}")
    mean = float(np.mean(vals))
    sign = "+" if mean > 0 else ""
    return ", ".join(parts) + f"; mean {sign}{mean:.2f}"


def summarize(rows):
    by_cond = defaultdict(list)
    for row in rows:
        by_cond[row["condition"]].append(row)
    # Stable order: represented then withheld, then any others.
    preferred = ["represented", "withheld"]
    conditions = [c for c in preferred if c in by_cond]
    conditions += [c for c in by_cond if c not in conditions]

    table_rows = []
    for cond in conditions:
        group = sorted(by_cond[cond], key=lambda r: int(r["seed"]))
        if len(group) != 5:
            raise SystemExit(f"{cond}: expected 5 seeds, found {len(group)}")
        for i, row in enumerate(group):
            err_gap = fnum(row, "err_full") - fnum(row, "err_erm")
            nore_gap = fnum(row, "err_full") - fnum(row, "err_nore")
            if abs(err_gap - fnum(row, "diff_full_vs_erm")) > 0.02:
                raise SystemExit(
                    f"seed {row['seed']} {cond}: diff_full_vs_erm does not match columns"
                )
            if abs(nore_gap - fnum(row, "diff_full_vs_nore")) > 0.02:
                raise SystemExit(
                    f"seed {row['seed']} {cond}: diff_full_vs_nore does not match columns"
                )
            if int(row["seed"]) != i:
                raise SystemExit(f"{cond}: seeds are not 0..4 in order")

        tv = fnum(group[0], "analytical_tv")
        flip_var = group[0]["flip_var"]
        err = {
            "erm": [fnum(r, "err_erm") for r in group],
            "full": [fnum(r, "err_full") for r in group],
            "nore": [fnum(r, "err_nore") for r in group],
        }
        flip = {
            "erm": [fnum(r, "flip_erm") for r in group],
            "full": [fnum(r, "flip_full") for r in group],
            "nore": [fnum(r, "flip_nore") for r in group],
        }
        err_vs_erm = [a - b for a, b in zip(err["full"], err["erm"])]
        err_vs_nore = [a - b for a, b in zip(err["full"], err["nore"])]
        flip_vs_erm = [a - b for a, b in zip(flip["full"], flip["erm"])]
        flip_vs_nore = [a - b for a, b in zip(flip["full"], flip["nore"])]
        table_rows.append(
            {
                "condition": cond,
                "analytical_tv": tv,
                "flip_var": flip_var,
                "n_seeds": 5,
                "err_erm": fmt_pm(err["erm"]),
                "err_full": fmt_pm(err["full"]),
                "err_nore": fmt_pm(err["nore"]),
                "flip_erm": fmt_pm(flip["erm"]),
                "flip_full": fmt_pm(flip["full"]),
                "flip_nore": fmt_pm(flip["nore"]),
                "err_full_minus_erm_seeds": fmt_seeds(err_vs_erm),
                "err_full_minus_nore_seeds": fmt_seeds(err_vs_nore),
                "flip_full_minus_erm_seeds": fmt_seeds(flip_vs_erm),
                "flip_full_minus_nore_seeds": fmt_seeds(flip_vs_nore),
                "err_erm_mean": round(float(np.mean(err["erm"])), 10),
                "err_full_mean": round(float(np.mean(err["full"])), 10),
                "err_nore_mean": round(float(np.mean(err["nore"])), 10),
            }
        )
    return table_rows


def markdown(path, table_rows):
    lines = [
        f"Source CSV: `{path}`",
        "",
        "Population SD (ddof=0) over seeds 0–4. Paired differences are full CausalGuard minus the named method, in percentage points, listed in seed order.",
        "",
        "| Target condition | Quantity | ERM | Full CausalGuard | No re-encoding | Paired full − ERM (seeds 0–4; mean) | Paired full − no re-encoding (seeds 0–4; mean) |",
        "|---|---|---|---|---|---|---|",
    ]
    labels = {
        "represented": "Represented nuisance shift",
        "withheld": "Withheld nuisance direction",
    }
    for row in table_rows:
        label = labels.get(row["condition"], row["condition"])
        title = f"{label} (TV {row['analytical_tv']:.2f}, flip {row['flip_var']})"
        lines.append(
            f"| {title} | Target error (%) | {row['err_erm']} | {row['err_full']} | {row['err_nore']} | {row['err_full_minus_erm_seeds']} | {row['err_full_minus_nore_seeds']} |"
        )
        lines.append(
            f"| {title} | Nuisance-only flip rate (%) | {row['flip_erm']} | {row['flip_full']} | {row['flip_nore']} | {row['flip_full_minus_erm_seeds']} | {row['flip_full_minus_nore_seeds']} |"
        )
    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True)
    parser.add_argument("--out-md", required=True)
    parser.add_argument("--out-csv", required=True)
    args = parser.parse_args()
    rows = load_rows(args.csv)
    table = summarize(rows)
    text = markdown(args.csv, table)
    os.makedirs(os.path.dirname(args.out_md), exist_ok=True)
    with open(args.out_md, "w") as f:
        f.write(text)
    fieldnames = [
        "condition",
        "analytical_tv",
        "flip_var",
        "err_erm",
        "err_full",
        "err_nore",
        "flip_erm",
        "flip_full",
        "flip_nore",
        "err_full_minus_erm_seeds",
        "err_full_minus_nore_seeds",
        "flip_full_minus_erm_seeds",
        "flip_full_minus_nore_seeds",
    ]
    with open(args.out_csv, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(table)
    print(text)
    print(f"Wrote {args.out_md}")
    print(f"Wrote {args.out_csv}")


if __name__ == "__main__":
    main()
