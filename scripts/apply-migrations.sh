#!/usr/bin/env bash
# 对当前 DATABASE_URL 指向的库执行 scripts/migrations/*.sql（按文件名排序，可重复执行）。
# 用法：
#   cd mupi-api && export DATABASE_URL='postgres://用户:密码@主机:5432/库名'
#   bash scripts/apply-migrations.sh
# 或先写好 .env.production（本脚本会尝试 source 其中的 DATABASE_URL）。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${DATABASE_URL:-}" && -f "${ROOT}/.env.production" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env.production"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "错误：未设置 DATABASE_URL。示例："
  echo "  export DATABASE_URL='postgres://mupi_user:密码@127.0.0.1:5432/mupi_sql'"
  echo "  bash scripts/apply-migrations.sh"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "错误：未找到 psql，请先安装 PostgreSQL 客户端。"
  exit 1
fi

shopt -s nullglob
files=("${ROOT}/scripts/migrations/"*.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "错误：${ROOT}/scripts/migrations/ 下没有 .sql 文件"
  exit 1
fi

sorted=($(printf '%s\n' "${files[@]}" | sort))
for f in "${sorted[@]}"; do
  echo "==> 执行: $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "==> 全部执行完成。"
