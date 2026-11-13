#!/usr/bin/env bash
# Cloud Agent install recovered from the tested environment build
# bld-20261113-a643eceb-6156-4a50-9543-ca2a783dced0.
# Idempotent. CPU stack only: this VM has no NVIDIA GPU.
set -euo pipefail
python3 -m pip install --user --upgrade \
  'numpy==2.5.4' \
  'pandas==2.3.3' \
  'scikit-learn==1.9.1' \
  'matplotlib==3.11.2' \
  'seaborn==0.13.2' \
  'joblib==1.6.0' \
  'librosa==0.11.0' \
  'soundfile==0.14.0' \
  'tensorflow==2.21.0'
