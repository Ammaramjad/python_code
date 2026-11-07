"""
GPU verification script — run before any training.
Usage: python scripts/verify_gpu.py
Expected output: all PASS lines.
"""

import sys
import time

def main():
    print("=" * 50)
    print("GPU Verification")
    print("=" * 50)

    # 1. Import torch
    try:
        import torch
    except ImportError:
        print("FAIL: torch not installed. Run setup_workstation.sh first.")
        sys.exit(1)

    print(f"PyTorch version:          {torch.__version__}")
    print(f"torch.version.cuda:       {torch.version.cuda}")
    print(f"torch.cuda.is_available(): {torch.cuda.is_available()}")

    if not torch.cuda.is_available():
        print("\nFAIL: CUDA not available.")
        print("Diagnosis:")
        print("  1. Confirm nvidia-smi works in this shell.")
        print("  2. Confirm PyTorch was installed with --index-url .../cu121 (not cpu).")
        print("  3. In WSL2, confirm WSL version is 2 (not 1).")
        print("  4. Confirm Windows NVIDIA driver ≥ 525.")
        sys.exit(1)

    n_gpu = torch.cuda.device_count()
    print(f"GPU count:                {n_gpu}")
    for i in range(n_gpu):
        name = torch.cuda.get_device_name(i)
        free, total = torch.cuda.mem_get_info(i)
        print(f"  GPU {i}: {name}")
        print(f"    Memory: {free/1024**3:.2f} GB free / {total/1024**3:.2f} GB total")
        # Validate expected device
        if "4080" not in name:
            print(f"    WARNING: Expected RTX 4080 / 4080 Super, got: {name}")
        else:
            print(f"    ✓ RTX 4080 / 4080 Super confirmed")

    # 2. Tensor operation
    print("\nRunning tensor op on GPU 0...")
    device = torch.device("cuda:0")
    x = torch.randn(4096, 4096, device=device, dtype=torch.float32)
    t0 = time.perf_counter()
    y = x @ x.T
    torch.cuda.synchronize()
    t1 = time.perf_counter()
    print(f"  4096×4096 matmul: {(t1-t0)*1000:.1f} ms, norm={y.norm().item():.2f}")
    del x, y
    torch.cuda.empty_cache()
    print("  Tensor op: PASS")

    # 3. Mixed precision check
    print("\nChecking BF16 / AMP support...")
    if torch.cuda.is_bf16_supported():
        x = torch.randn(512, 512, device=device, dtype=torch.bfloat16)
        y = x @ x.T
        torch.cuda.synchronize()
        del x, y
        print("  BF16: PASS")
    else:
        print("  BF16: NOT SUPPORTED (fp32 will be used)")

    # 4. Memory bandwidth estimate
    print("\nMemory bandwidth estimate...")
    size = 256 * 1024 * 1024  # 256M floats = 1 GB
    x = torch.empty(size, device=device)
    torch.cuda.synchronize()
    t0 = time.perf_counter()
    for _ in range(5):
        x.fill_(1.0)
        torch.cuda.synchronize()
    t1 = time.perf_counter()
    bw_gb_s = (5 * size * 4) / (t1 - t0) / 1e9  # bytes / time
    print(f"  Write bandwidth: ~{bw_gb_s:.0f} GB/s")
    del x
    torch.cuda.empty_cache()

    print("\n" + "=" * 50)
    print("ALL CHECKS PASSED")
    print("=" * 50)

if __name__ == "__main__":
    main()
