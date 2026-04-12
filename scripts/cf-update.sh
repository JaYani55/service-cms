#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "  [ERROR] Node.js is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "  [ERROR] npm is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "  [ERROR] git is not installed or not in PATH." >&2
  exit 1
fi

cd "$ROOT_DIR"
node scripts/cf-update.mjs "$@"