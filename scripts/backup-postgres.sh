#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"
TS="$(date +"%Y%m%d_%H%M%S")"
OUT_FILE="${BACKUP_DIR}/postgres_${TS}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[backup] writing: ${OUT_FILE}"

# 说明：
# - 不在宿主机解析 .env（避免 .env 语法差异导致 source 失败）
# - 直接在 postgres 容器内读取 POSTGRES_* 环境变量并执行 pg_dump
docker compose -f "${ROOT_DIR}/docker-compose.yml" exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip -9' > "${OUT_FILE}"

echo "[backup] done"

