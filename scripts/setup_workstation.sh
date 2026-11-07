#!/usr/bin/env bash
# =============================================================================
# CausalGuard Workstation Setup Script
# Run this in WSL2 (Ubuntu 20.04 or 22.04) on the Windows workstation.
# Requires: NVIDIA RTX 4080 / 4080 Super, WSL2, Windows driver ≥ 525
#
# Usage:
#   chmod +x setup_workstation.sh
#   ./setup_workstation.sh 2>&1 | tee setup_workstation.log
#
# This script is IDEMPOTENT — safe to re-run if interrupted.
# =============================================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$REPO_ROOT/docs/setup_workstation.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================="
echo "CausalGuard Workstation Setup"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================="

# ── 1. Environment Identification ─────────────────────────────────────────────
echo ""
echo "=== 1. ENVIRONMENT IDENTIFICATION ==="
uname -a
whoami
# Check if we're in WSL
if grep -qi "microsoft\|wsl" /proc/version 2>/dev/null; then
    WSL_VERSION=$(wslinfo --wsl-version 2>/dev/null || echo "unknown")
    echo "Running in WSL (version: $WSL_VERSION)"
    if [[ "$WSL_VERSION" != "2" && "$WSL_VERSION" != "unknown" ]]; then
        echo "ERROR: WSL1 detected. CUDA requires WSL2. Please convert with:"
        echo "  wsl --set-version <distro> 2"
        exit 1
    fi
else
    echo "Running in native Linux (not WSL)"
fi

# ── 2. GPU Detection ──────────────────────────────────────────────────────────
echo ""
echo "=== 2. GPU DETECTION ==="
if ! command -v nvidia-smi &> /dev/null; then
    echo "ERROR: nvidia-smi not found."
    echo "In WSL2, nvidia-smi should be forwarded from the Windows driver."
    echo "Ensure the Windows NVIDIA driver is installed (≥ 525 for CUDA 12)."
    echo "In WSL2, it lives at /usr/lib/wsl/lib/nvidia-smi — check:"
    ls /usr/lib/wsl/lib/nvidia-smi 2>/dev/null || echo "  Not found at that path either."
    exit 1
fi

nvidia-smi
GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits | head -1)
DRIVER_VER=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits | head -1)
GPU_MEM_MIB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1)
echo "GPU: $GPU_NAME"
echo "Driver: $DRIVER_VER"
echo "VRAM: ${GPU_MEM_MIB} MiB"

# Validate it is an RTX 4080 or 4080 Super
if echo "$GPU_NAME" | grep -qi "4080"; then
    echo "✓ Confirmed RTX 4080 / 4080 Super"
else
    echo "WARNING: Expected RTX 4080 / 4080 Super, got: $GPU_NAME"
    echo "Continuing — confirm this is the intended device."
fi

# ── 3. Disk Space Check ───────────────────────────────────────────────────────
echo ""
echo "=== 3. DISK SPACE CHECK ==="
df -h /
# Recommend 100 GB free
FREE_GB=$(df / | awk 'NR==2 {gsub(/G/,"",$4); print int($4)}')
echo "Free space on /: ~${FREE_GB} GB"
if [ "$FREE_GB" -lt 50 ]; then
    echo "WARNING: Less than 50 GB free. Datasets + checkpoints need ~50 GB minimum."
fi

# ── 4. Data Directory ─────────────────────────────────────────────────────────
echo ""
echo "=== 4. DATA DIRECTORY ==="
DATA_DIR="${DATA_DIR:-/data/domainbed}"
mkdir -p "$DATA_DIR"
echo "Dataset directory: $DATA_DIR"
echo "(Override with: export DATA_DIR=/your/path before running this script)"

# ── 5. Conda Environment ──────────────────────────────────────────────────────
echo ""
echo "=== 5. CONDA ENVIRONMENT ==="
ENV_NAME="causalguard"

if ! command -v conda &> /dev/null; then
    echo "conda not found. Installing Miniconda..."
    MINICONDA_SH="/tmp/miniconda.sh"
    if [ ! -f "$MINICONDA_SH" ]; then
        wget -q "https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh" \
             -O "$MINICONDA_SH"
    fi
    bash "$MINICONDA_SH" -b -p "$HOME/miniconda3"
    eval "$($HOME/miniconda3/bin/conda shell.bash hook)"
    conda init bash
    echo "Miniconda installed at $HOME/miniconda3"
else
    eval "$(conda shell.bash hook)"
    echo "conda found: $(conda --version)"
fi

# Check if environment already exists
if conda env list | grep -q "^$ENV_NAME "; then
    echo "Environment '$ENV_NAME' already exists — activating."
else
    echo "Creating environment '$ENV_NAME' with Python 3.10..."
    conda create -n "$ENV_NAME" python=3.10 -y
fi
conda activate "$ENV_NAME"
echo "Active environment: $CONDA_DEFAULT_ENV"
echo "Python: $(python --version)"

# ── 6. PyTorch Installation ───────────────────────────────────────────────────
echo ""
echo "=== 6. PYTORCH INSTALLATION ==="

# Determine CUDA version from driver
# The driver's "CUDA Version" is the MAXIMUM supported, not an installed toolkit.
DRIVER_CUDA=$(nvidia-smi | grep "CUDA Version" | awk '{print $NF}')
echo "Driver max CUDA support: $DRIVER_CUDA"

# Select PyTorch CUDA build
# RTX 4080 (Ada Lovelace) requires CUDA 11.8+ for full support; CUDA 12.1 is preferred.
if python -c "import torch; print(torch.__version__)" 2>/dev/null | grep -q "^2\.[0-9]"; then
    TORCH_VER=$(python -c "import torch; print(torch.__version__)")
    TORCH_CUDA=$(python -c "import torch; print(torch.version.cuda)")
    echo "PyTorch already installed: $TORCH_VER (CUDA $TORCH_CUDA)"
    if python -c "import torch; assert torch.cuda.is_available(), 'no cuda'" 2>/dev/null; then
        echo "✓ PyTorch CUDA already working — skipping reinstall."
    else
        echo "PyTorch installed but CUDA not available — reinstalling with CUDA support."
        REINSTALL_TORCH=1
    fi
else
    REINSTALL_TORCH=1
fi

if [ "${REINSTALL_TORCH:-0}" == "1" ]; then
    # Install PyTorch 2.3.x with CUDA 12.1 (verify at https://pytorch.org/get-started/locally/)
    echo "Installing PyTorch with CUDA 12.1..."
    pip install torch torchvision torchaudio \
        --index-url https://download.pytorch.org/whl/cu121 \
        --no-cache-dir
fi

# ── 7. GPU Verification ───────────────────────────────────────────────────────
echo ""
echo "=== 7. GPU VERIFICATION ==="
python - <<'PYEOF'
import torch, sys
print(f"PyTorch version: {torch.__version__}")
print(f"torch.version.cuda: {torch.version.cuda}")
print(f"torch.cuda.is_available(): {torch.cuda.is_available()}")
if not torch.cuda.is_available():
    print("FAIL: CUDA not available. Check driver, WSL2, and PyTorch build.")
    sys.exit(1)
print(f"GPU name: {torch.cuda.get_device_name(0)}")
free, total = torch.cuda.mem_get_info(0)
print(f"GPU memory: {free/1024**3:.1f} GB free / {total/1024**3:.1f} GB total")
# Small tensor op
x = torch.randn(2048, 2048, device="cuda")
y = x @ x.T
torch.cuda.synchronize()
print(f"Tensor op (2048x2048 matmul): OK, norm={y.norm().item():.2f}")
del x, y
torch.cuda.empty_cache()
print("GPU verification: PASS")
PYEOF

# ── 8. Core Dependencies ──────────────────────────────────────────────────────
echo ""
echo "=== 8. CORE DEPENDENCIES ==="
pip install \
    numpy scipy scikit-learn pandas \
    Pillow tqdm wilds \
    timm \
    --no-cache-dir

# ── 9. DomainBed ──────────────────────────────────────────────────────────────
echo ""
echo "=== 9. DOMAINBED ==="
DOMAINBED_DIR="$HOME/domainbed"
if [ ! -d "$DOMAINBED_DIR/.git" ]; then
    git clone https://github.com/facebookresearch/DomainBed.git "$DOMAINBED_DIR"
else
    echo "DomainBed already cloned at $DOMAINBED_DIR — pulling latest."
    git -C "$DOMAINBED_DIR" pull --ff-only || echo "  (pull skipped — local changes?)"
fi
cd "$DOMAINBED_DIR"
pip install -r requirements.txt --no-cache-dir || true
echo "DomainBed dir: $DOMAINBED_DIR"

# ── 10. Locate CausalGuard Code ───────────────────────────────────────────────
echo ""
echo "=== 10. CAUSALGUARD CODE SEARCH ==="
# Search common locations
SEARCH_PATHS=(
    "/mnt/c/Users/$USER/Documents"
    "/mnt/c/Users/$USER/Desktop"
    "/mnt/d"
    "/mnt/e"
    "$HOME"
    "/mnt/nas"
)
FOUND_CODE=""
for path in "${SEARCH_PATHS[@]}"; do
    if [ -d "$path" ]; then
        result=$(find "$path" -maxdepth 5 \
            \( -name "train_causalguard.py" -o -name "causalguard.py" \
               -o -name "causal_guard.py" -o -name "train_all.py" \) \
            2>/dev/null | head -3)
        if [ -n "$result" ]; then
            echo "FOUND candidate code:"
            echo "$result"
            FOUND_CODE="$result"
        fi
    fi
done
if [ -z "$FOUND_CODE" ]; then
    echo "CausalGuard training code NOT FOUND in searched locations."
    echo "ACTION REQUIRED: Provide path to code directory."
fi

# ── 11. Record Versions ───────────────────────────────────────────────────────
echo ""
echo "=== 11. RECORD ENVIRONMENT VERSIONS ==="
mkdir -p "$REPO_ROOT/configs"
{
    echo "# Environment versions recorded $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    python -c "import torch; print(f'torch={torch.__version__}')"
    python -c "import torch; print(f'torch.cuda={torch.version.cuda}')"
    python --version
    conda --version 2>/dev/null || echo "conda=not available"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
} > "$REPO_ROOT/configs/environment_versions.txt"
pip freeze > "$REPO_ROOT/configs/requirements_resolved.txt"
echo "Versions saved to configs/environment_versions.txt"
echo "Full pip freeze saved to configs/requirements_resolved.txt"

echo ""
echo "============================================="
echo "Setup script complete."
echo "Log saved to: $LOG_FILE"
echo "============================================="
echo ""
echo "NEXT STEPS:"
echo "  1. If GPU verification passed, proceed to dataset download."
echo "  2. Run: bash scripts/download_datasets.sh"
echo "  3. If CausalGuard code was not found, provide the path."
