#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"
TS="$(date +"%Y%m%d_%H%M%S")"
OUT_FILE="${BACKUP_DIR}/postgres_${TS}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# 从 .env.production 读取 DB_*（宿主机执行 pg_dump，连 127.0.0.1，勿用 host.docker.internal）
set -a
# shellcheck disable=SC1091
source "${ROOT_DIR}/.env.production"
set +a

: "${DB_USERNAME:?missing DB_USERNAME in .env.production}"
: "${DB_PASSWORD:?missing DB_PASSWORD in .env.production}"
: "${DB_DATABASE:?missing DB_DATABASE in .env.production}"

PG_HOST="${PG_HOST_BACKUP:-127.0.0.1}"
export PGPASSWORD="${DB_PASSWORD}"

echo "[backup] writing: ${OUT_FILE} (host=${PG_HOST} user=${DB_USERNAME} db=${DB_DATABASE})"

pg_dump -h "${PG_HOST}" -U "${DB_USERNAME}" "${DB_DATABASE}" | gzip -9 >"${OUT_FILE}"

echo "[backup] done"
