#!/usr/bin/env bash
# =============================================================================
# Download PACS, VLCS, Office-Home via DomainBed download script.
# Run AFTER setup_workstation.sh succeeds.
# Usage: bash scripts/download_datasets.sh
# =============================================================================

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DATA_DIR="${DATA_DIR:-/data/domainbed}"
DOMAINBED_DIR="${DOMAINBED_DIR:-$HOME/domainbed}"

eval "$(conda shell.bash hook)" 2>/dev/null || true
conda activate causalguard 2>/dev/null || true

mkdir -p "$DATA_DIR"
echo "Dataset directory: $DATA_DIR"
echo "Free space: $(df -h "$DATA_DIR" | awk 'NR==2{print $4}') available"

for DS in PACS VLCS OfficeHome; do
    echo ""
    echo "=== Downloading $DS ==="
    if [ -d "$DATA_DIR/$DS" ] && [ "$(ls -A "$DATA_DIR/$DS")" ]; then
        echo "  $DS already present at $DATA_DIR/$DS — skipping."
    else
        python "$DOMAINBED_DIR/domainbed/scripts/download.py" \
            --data_dir "$DATA_DIR" \
            --dataset "$DS"
    fi
done

# Verify
echo ""
echo "=== Dataset Verification ==="
python - <<PYEOF
import os, sys
DATA_DIR = os.environ.get("DATA_DIR", "/data/domainbed")
expected = {
    "PACS":       {"domains": ["art_painting","cartoon","photo","sketch"],          "min_files": 9000},
    "VLCS":       {"domains": ["CALTECH","LABELME","PASCAL","SUN"],                 "min_files": 10000},
    "OfficeHome": {"domains": ["Art","Clipart","Product","Real_World"],             "min_files": 15000},
}
all_ok = True
for ds, info in expected.items():
    total = 0
    for domain in info["domains"]:
        path = os.path.join(DATA_DIR, ds, domain)
        if not os.path.isdir(path):
            print(f"  MISSING: {path}")
            all_ok = False
            continue
        n = sum(len(files) for _, _, files in os.walk(path))
        total += n
        print(f"  {ds}/{domain}: {n} files")
    print(f"  {ds} total: {total} files (min expected: {info['min_files']})")
    if total < info["min_files"]:
        print(f"  WARNING: {ds} has fewer files than expected")
        all_ok = False
sys.exit(0 if all_ok else 1)
PYEOF
