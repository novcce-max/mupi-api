#!/usr/bin/env sh
set -eu

HOST="${1:-127.0.0.1}"
PORT="${2:-3001}"
URL="http://${HOST}:${PORT}/api/health"

echo "[healthcheck] checking ${URL}"
if command -v curl >/dev/null 2>&1; then
  curl -fsS "${URL}" >/dev/null
else
  wget -qO- "${URL}" >/dev/null
fi
echo "[healthcheck] ok"
