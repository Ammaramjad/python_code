"""
Smoke test for CausalGuard training pipeline.
Run AFTER environment setup and GPU verification.
Uses a debug configuration: tiny data, few steps, no benchmark claims.

Usage:
    python scripts/smoke_test.py --code_dir /path/to/causalguard \
                                  --data_dir /data/domainbed \
                                  --output_dir /tmp/causalguard_smoke

Do NOT use smoke test results as scientific evidence.
"""

import argparse
import os
import sys
import time
import json
import subprocess

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--code_dir", required=True,
                        help="Path to CausalGuard training code directory")
    parser.add_argument("--data_dir", default="/data/domainbed",
                        help="Path to DomainBed datasets")
    parser.add_argument("--output_dir", default="/tmp/causalguard_smoke",
                        help="Output directory for smoke test artifacts")
    parser.add_argument("--dataset", default="PACS", choices=["PACS", "VLCS", "OfficeHome"])
    args = parser.parse_args()

    print("=" * 60)
    print("CausalGuard Smoke Test")
    print(f"Code dir:   {args.code_dir}")
    print(f"Data dir:   {args.data_dir}")
    print(f"Output dir: {args.output_dir}")
    print(f"Dataset:    {args.dataset}")
    print("=" * 60)

    # ── Pre-flight checks ──────────────────────────────────────────────────────
    if not os.path.isdir(args.code_dir):
        print(f"FAIL: Code directory not found: {args.code_dir}")
        sys.exit(1)

    # Locate training entry point
    train_script = None
    for candidate in ["train_all.py", "train.py", "main.py", "causalguard/train.py"]:
        path = os.path.join(args.code_dir, candidate)
        if os.path.isfile(path):
            train_script = path
            break
    if train_script is None:
        print(f"FAIL: Could not find training script in {args.code_dir}")
        print("Looked for: train_all.py, train.py, main.py, causalguard/train.py")
        sys.exit(1)
    print(f"Training script: {train_script}")

    # Check GPU
    import torch
    if not torch.cuda.is_available():
        print("FAIL: CUDA not available. Run verify_gpu.py first.")
        sys.exit(1)
    print(f"GPU: {torch.cuda.get_device_name(0)}")

    os.makedirs(args.output_dir, exist_ok=True)

    # ── Smoke test command ─────────────────────────────────────────────────────
    # These flags are illustrative; adjust to match the actual CLI of the code.
    # The important invariants:
    #   - num_steps is tiny (100 steps)
    #   - holdout_fraction and checkpoint_freq are small
    #   - output goes to smoke dir, not production dir
    #   - algorithm is CausalGuard (adjust flag name as needed)

    smoke_cmd = [
        sys.executable, train_script,
        "--data_dir", args.data_dir,
        "--output_dir", args.output_dir,
        "--algorithm", "CausalGuard",          # Adjust if algorithm name differs
        "--dataset", args.dataset,
        "--test_env", "0",                     # Use first domain as held-out
        "--hparams", json.dumps({              # Minimal hparams for smoke
            "batch_size": 16,
            "num_steps": 100,
        }),
        "--skip_model_save", "0",             # Must save checkpoint for checkpoint reload test
        "--seed", "0",
        "--trial_seed", "0",
        "--smoke_test", "1",                  # Flag if supported; otherwise remove
    ]

    print("\nSmoke test command:")
    print(" ".join(smoke_cmd))
    print("\nRunning (stdout/stderr captured to smoke_test.log)...")

    log_path = os.path.join(args.output_dir, "smoke_test.log")
    t0 = time.time()
    try:
        result = subprocess.run(
            smoke_cmd,
            capture_output=True,
            text=True,
            timeout=600,  # 10 minutes max for smoke test
            cwd=args.code_dir,
        )
        with open(log_path, "w") as f:
            f.write("=== STDOUT ===\n")
            f.write(result.stdout)
            f.write("\n=== STDERR ===\n")
            f.write(result.stderr)
        elapsed = time.time() - t0
        print(f"Exit code: {result.returncode} ({elapsed:.1f}s)")

        if result.returncode != 0:
            print(f"FAIL: Training script exited with code {result.returncode}")
            print("Last 20 lines of stderr:")
            for line in result.stderr.splitlines()[-20:]:
                print(f"  {line}")
            print(f"Full log: {log_path}")
            sys.exit(1)

    except subprocess.TimeoutExpired:
        print("FAIL: Smoke test timed out after 10 minutes")
        sys.exit(1)
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)

    # ── Check outputs ─────────────────────────────────────────────────────────
    print("\nChecking outputs...")

    # 1. Checkpoint saved
    ckpt_files = []
    for root, dirs, files in os.walk(args.output_dir):
        for f in files:
            if f.endswith(".pkl") or f.endswith(".pt") or f.endswith(".pth"):
                ckpt_files.append(os.path.join(root, f))
    if ckpt_files:
        print(f"  ✓ Checkpoint found: {ckpt_files[0]}")
    else:
        print("  WARNING: No checkpoint file found (may use different extension)")

    # 2. Result file
    result_files = []
    for root, dirs, files in os.walk(args.output_dir):
        for f in files:
            if f.endswith(".json") or f == "results.jsonl":
                result_files.append(os.path.join(root, f))
    if result_files:
        print(f"  ✓ Result file found: {result_files[0]}")
        # Try to read per-domain accuracy
        for rf in result_files:
            try:
                with open(rf) as f:
                    for line in f:
                        d = json.loads(line)
                        if "env0_out_acc" in d or "test_acc" in d:
                            print(f"    Sample result: {d}")
                            print("    NOTE: Smoke-test accuracy is not scientific evidence.")
                            break
            except Exception:
                pass
    else:
        print("  WARNING: No result JSON found")

    print("\n" + "=" * 60)
    print("SMOKE TEST COMPLETE")
    print(f"Log: {log_path}")
    print("=" * 60)
    print("\nIMPORTANT: Smoke-test accuracy values are not scientific evidence.")
    print("They verify the pipeline runs; they do not reproduce Table 2.")

if __name__ == "__main__":
    main()
