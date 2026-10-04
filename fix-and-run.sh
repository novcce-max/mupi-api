#!/bin/bash

set -euo pipefail

# 与 app.module ConfigModule 一致：非 production 时加载 .env.development（见仓库根 ENV.md）
export NODE_ENV="${NODE_ENV:-development}"

PORT="${PORT:-3001}"

echo "[fix-and-run] Checking port ${PORT}..."

PIDS="$(lsof -ti:"${PORT}" 2>/dev/null || true)"
if [[ -n "${PIDS}" ]]; then
  echo "[fix-and-run] Found process(es) on ${PORT}, stopping..."
  echo "${PIDS}" | xargs kill -TERM 2>/dev/null || true
  sleep 1
  PIDS2="$(lsof -ti:"${PORT}" 2>/dev/null || true)"
  if [[ -n "${PIDS2}" ]]; then
    echo "[fix-and-run] Force killing remaining process(es) on ${PORT}..."
    echo "${PIDS2}" | xargs kill -KILL 2>/dev/null || true
  fi
fi

echo "[fix-and-run] Starting NestJS..."

npx nest start --watch

