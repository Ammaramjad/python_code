# Environment Setup — CausalGuard Rebuttal

**Date:** 2026-11-07  
**Branch:** cursor/causalguard-rebuttal-96ab

---

## 1. Where This Agent Is Running

This Cursor Cloud Agent runs in a **Linux VM** (hostname `cursor`, user `ubuntu`, kernel 6.12.113+). It has **no NVIDIA GPU, no CUDA driver, and no access to your Windows workstation**. All findings below describe what must be done **on your Windows workstation or its WSL environment**.

Nothing in this document has been executed on the target machine. All commands are prepared but not yet run.

---

## 2. Target Machine Inspection (To Be Run on Workstation)

Run these commands on your workstation to establish baseline state before anything is installed or changed.

### 2a. Determine execution context

```powershell
# In PowerShell / CMD on Windows:
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory"
wsl --list --verbose        # List WSL distros and their status
```

```bash
# In WSL (run from whatever distro you use):
uname -a
lsb_release -a 2>/dev/null || cat /etc/os-release
whoami
echo "WSL version: $(wslinfo --wsl-version 2>/dev/null || cat /proc/version | grep -o 'WSL[0-9]*' || echo 'unknown')"
```

### 2b. GPU and driver detection

```powershell
# In PowerShell:
nvidia-smi
# Should show:
# - Driver Version (e.g., 561.xx for RTX 4080)
# - CUDA Version (the maximum CUDA the driver supports, NOT an installed toolkit)
# - GPU name: NVIDIA GeForce RTX 4080 or RTX 4080 SUPER
# - Memory: 16384 MiB (4080) or 16376 MiB (4080 Super)
```

```bash
# In WSL (nvidia-smi is forwarded from Windows driver in WSL2):
nvidia-smi
# WSL2 with CUDA support requires:
# - Windows driver ≥ 522.06 for CUDA 12.x support
# - WSL2 (not WSL1) — verify with: wslinfo --wsl-version
```

### 2c. Disk space

```powershell
# Windows:
Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N='Used(GB)';E={[math]::Round($_.Used/1GB,1)}}, @{N='Free(GB)';E={[math]::Round($_.Free/1GB,1)}}
```

```bash
# WSL:
df -h /
df -h /mnt/c 2>/dev/null   # Windows C: drive mounted in WSL
# CausalGuard datasets require ~50 GB:
# PACS ~1.5 GB, VLCS ~1.3 GB, Office-Home ~2.0 GB
# Checkpoints: ~5-10 GB per experiment set
# Recommend: 100 GB free on SSD
```

---

## 3. WSL vs. Windows Native Decision

**Recommended: Use WSL2** (Ubuntu 22.04 or 20.04). Reasons:
- CUDA in WSL2 is fully supported on driver ≥ 525 with RTX 4080
- DomainBed and PyTorch are tested on Linux
- Avoids Windows path separator issues in dataset loaders
- Native Windows (PowerShell + conda) is feasible but more fragile with CUDA

**If WSL2 is not installed:** follow Microsoft instructions at https://learn.microsoft.com/en-us/windows/wsl/install  
**Do not** create a new WSL environment if one already exists and works — inspect the existing one first.

---

## 4. Environment Creation (Run in WSL2 or Linux)

### 4a. Inspect existing WSL environment first

```bash
# Check for existing conda/mamba:
conda info 2>/dev/null || mamba info 2>/dev/null || echo "No conda"
# Check for existing Python envs with torch:
conda env list 2>/dev/null || ls ~/anaconda3/envs/ 2>/dev/null || ls ~/miniconda3/envs/ 2>/dev/null
# Check existing Python:
python3 --version; pip3 show torch 2>/dev/null || echo "torch not installed in base"
```

### 4b. Install Miniconda if absent

```bash
# Only if conda/mamba is not already installed:
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh
bash /tmp/miniconda.sh -b -p $HOME/miniconda3
eval "$($HOME/miniconda3/bin/conda shell.bash hook)"
conda init bash && source ~/.bashrc
```

### 4c. Create dedicated environment

```bash
# Do not use the base environment.
# Name matches the project to avoid confusion with other environments.
conda create -n causalguard python=3.10 -y
conda activate causalguard
```

### 4d. Install PyTorch with CUDA

```bash
# Determine which CUDA version your driver supports:
nvidia-smi | grep "CUDA Version"
# RTX 4080 driver ≥ 527.41 supports CUDA 12.x

# Install PyTorch for CUDA 12.1 (works with driver ≥ 525.60.13 on Linux):
# Source: https://pytorch.org/get-started/locally/ (verify current recommendation)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Alternative for CUDA 11.8 (if driver is older):
# pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Do NOT install pytorch via conda for CUDA — pip wheel is more reliable for cutting-edge GPUs.
```

### 4e. Verify GPU access (Step 5 of the instructions)

```python
# Save as verify_gpu.py and run: python verify_gpu.py
import torch
print("PyTorch version:", torch.__version__)
print("CUDA version (torch.version.cuda):", torch.version.cuda)
print("torch.cuda.is_available():", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU name:", torch.cuda.get_device_name(0))
    free, total = torch.cuda.mem_get_info(0)
    print(f"GPU memory: {free/1024**3:.1f} GB free / {total/1024**3:.1f} GB total")
    # Small tensor operation
    x = torch.randn(1000, 1000, device="cuda")
    y = x @ x.T
    torch.cuda.synchronize()
    print("Tensor op on GPU: OK, result shape", y.shape)
    del x, y
    torch.cuda.empty_cache()
    print("GPU access: PASS")
else:
    print("GPU access: FAIL — check driver, WSL2, and PyTorch build")
```

---

## 5. CausalGuard Code Installation

The CausalGuard training code is **not present in this repository**. The following options apply:

### Option A: If the original code directory is on your Windows machine

```bash
# In WSL, the Windows filesystem is at /mnt/c/ (or /mnt/d/ etc.)
# Locate the directory:
find /mnt -name "train.py" -o -name "causalguard*.py" 2>/dev/null | head -20
find /mnt -name "domainbed" -type d 2>/dev/null | head -10
```

Provide the Windows path (e.g., `D:\projects\causalguard`) and I will mount it in WSL:
```bash
# WSL automatically mounts Windows drives at /mnt/c, /mnt/d, etc.
# Access Windows path D:\projects\causalguard as:
ls /mnt/d/projects/causalguard/
```

### Option B: If the code is on the Synology NAS

```bash
# Mount NAS (provide the NAS IP, share name, and credentials):
sudo mount -t cifs //<NAS_IP>/<share_name> /mnt/nas \
  -o username=<user>,password=<pass>,uid=$(id -u),gid=$(id -g)
ls /mnt/nas/causalguard/
```

### Option C: If there is no original code (reconstruction needed)

Report this explicitly. Do not silently construct an approximate replacement and call it the original. A new implementation must be named differently (e.g., `causalguard_rebuttal_v1`) and results labeled `reproduced_new_implementation`.

---

## 6. DomainBed Installation

CausalGuard is built on DomainBed. Install alongside the CausalGuard code:

```bash
# Install DomainBed (the original evaluation framework):
git clone https://github.com/facebookresearch/DomainBed.git
cd DomainBed
pip install -r requirements.txt
# DomainBed requirements typically include:
# torch, torchvision, numpy, Pillow, tqdm, wilds (optional)
```

---

## 7. Dataset Preparation

### Download script (DomainBed standard):

```bash
# PACS (~1.5 GB):
python -m domainbed.scripts.download --data_dir /data/domainbed --dataset PACS

# VLCS (~1.3 GB):
python -m domainbed.scripts.download --data_dir /data/domainbed --dataset VLCS

# Office-Home (~2.0 GB):
python -m domainbed.scripts.download --data_dir /data/domainbed --dataset OfficeHome
```

**Data directory:** Use local SSD (`/data/domainbed` or equivalent), NOT the NAS, for active training. Synology is for backup only.

### Verify dataset integrity:

```bash
python - <<'EOF'
import os
DATA_DIR = "/data/domainbed"
expected = {
    "PACS": {"domains": ["art_painting", "cartoon", "photo", "sketch"], "classes": 7},
    "VLCS": {"domains": ["CALTECH", "LABELME", "PASCAL", "SUN"], "classes": 5},
    "OfficeHome": {"domains": ["Art", "Clipart", "Product", "Real_World"], "classes": 65},
}
for ds, info in expected.items():
    for domain in info["domains"]:
        path = os.path.join(DATA_DIR, ds, domain)
        if os.path.isdir(path):
            n = sum(len(files) for _, _, files in os.walk(path))
            print(f"  {ds}/{domain}: {n} files")
        else:
            print(f"  MISSING: {path}")
EOF
```

---

## 8. Environment Specification File

After successful installation, record the exact resolved versions:

```bash
conda activate causalguard
pip freeze > /workspace/configs/requirements_resolved.txt
python -c "import torch; print('torch', torch.__version__, 'cuda', torch.version.cuda)" >> /workspace/configs/environment_versions.txt
nvidia-smi --query-gpu=name,driver_version,memory.total,cuda_version --format=csv >> /workspace/configs/environment_versions.txt
python --version >> /workspace/configs/environment_versions.txt
```

---

## 9. Status

| Step | Status | Notes |
|---|---|---|
| Identify execution environment | ✓ DONE | Linux Cloud Agent VM — no GPU |
| Detect GPU | ✓ DONE | No GPU in this VM |
| CausalGuard code | BLOCKED | Not in workspace; need Windows path or NAS path |
| Environment creation | PENDING | Cannot create GPU env in this VM |
| GPU verification | PENDING | No GPU |
| Dataset download | PENDING | No code, no GPU env |
| Smoke test | PENDING | Requires all above |

**Blocking question:** Where is the CausalGuard training code? Please provide one of:
1. The Windows path (e.g., `D:\projects\causalguard\`)
2. The Synology NAS IP, share name, and read credentials
3. Confirmation that no original code exists (triggers reconstruction protocol)

Once a path is provided, I can proceed through steps 2–10 immediately if you give me a shell on the workstation (via SSH into WSL, or by running the prepared scripts locally).
