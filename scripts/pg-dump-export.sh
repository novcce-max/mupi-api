#!/usr/bin/env bash
# 从本地/当前 DATABASE_URL 导出，用于在服务器上恢复。
# 用法：
#   export DATABASE_URL='postgres://...'
#   bash scripts/pg-dump-export.sh schema    # 仅结构（推荐：与 apply-migrations.sh 二选一）
#   bash scripts/pg-dump-export.sh full      # 结构+数据（会覆盖服务器整库数据，慎用）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT}/db-export"
mkdir -p "${OUT_DIR}"

if [[ -z "${DATABASE_URL:-}" && -f "${ROOT}/.env.production" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env.production"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" && -f "${ROOT}/.env.development" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env.development"
  set +a
  export PGPASSWORD="${DB_PASSWORD:-}"
  USE_LOCAL_PG_ARGS=1
fi

if [[ -z "${DATABASE_URL:-}" && -z "${USE_LOCAL_PG_ARGS:-}" ]]; then
  echo "错误：请设置 DATABASE_URL，或配置 .env.production / .env.development（DB_HOST 等）"
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "错误：未找到 pg_dump"
  exit 1
fi

MODE="${1:-schema}"
TS="$(date +%Y%m%d_%H%M%S)"

run_dump() {
  if [[ -n "${USE_LOCAL_PG_ARGS:-}" ]]; then
    pg_dump -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-mupi_user}" -d "${DB_DATABASE:-mupi_dev}" "$@"
  else
    pg_dump "$DATABASE_URL" "$@"
  fi
}

case "$MODE" in
  schema)
    OUT="${OUT_DIR}/mupi_schema_${TS}.sql"
    echo "导出仅结构 -> ${OUT}"
    run_dump --schema-only --no-owner --no-privileges -f "$OUT"
    ;;
  full)
    if [[ -n "${USE_LOCAL_PG_ARGS:-}" ]]; then
      OUT="${OUT_DIR}/mupi_dev_full_${TS}.sql"
    else
      OUT="${OUT_DIR}/mupi_full_${TS}.sql"
    fi
    echo "警告：将导出结构+全部数据，用于覆盖服务器库。"
    run_dump --no-owner --no-privileges -f "$OUT"
    ;;
  *)
    echo "用法: $0 [schema|full]"
    exit 1
    ;;
esac

echo "完成: ${OUT}"
echo "服务器上（先备份！）可用: psql \"\$DATABASE_URL\" -v ON_ERROR_STOP=1 -f ${OUT}"
