#!/usr/bin/env bash
# 打包后端源码供宝塔 / 服务器部署（不含 node_modules，需目标机 npm ci && npm run build）
# 用法：在 mupi-api 目录执行  bash scripts/package-source-zip.sh
# 可选：INCLUDE_ENV=1 一并打入 .env.production（压缩包含密钥，勿外传）
set -euo pipefail

API_DIR="$(cd "$(dirname "${0}")/.." && pwd)"
ROOT_PARENT="$(cd "${API_DIR}/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M)"
OUT_NAME="${OUT_NAME:-mupi-api-source-${STAMP}.zip}"
OUT_PATH="${ROOT_PARENT}/${OUT_NAME}"
# 默认不打入 .env.production，避免误传泄露；自用完整包：INCLUDE_ENV=1 bash scripts/package-source-zip.sh
INCLUDE_ENV="${INCLUDE_ENV:-0}"

cd "${ROOT_PARENT}"

EXCL=(
  "mupi-api/node_modules/*"
  "mupi-api/.git/*"
  "mupi-api/dist/*"
  "mupi-api/coverage/*"
  "*.map"
)

if [[ "${INCLUDE_ENV}" != "1" ]]; then
  EXCL+=(
    "mupi-api/.env.production"
    "mupi-api/.env"
    "mupi-api/.env.local"
    "mupi-api/.env.development"
    "mupi-api/.env.production.local"
  )
fi

ZIP_ARGS=()
for p in "${EXCL[@]}"; do
  ZIP_ARGS+=("-x" "$p")
done

zip -r "${OUT_PATH}" mupi-api "${ZIP_ARGS[@]}"

echo "[ok] ${OUT_PATH}"
if [[ "${INCLUDE_ENV}" == "1" ]]; then
  echo "[warn] 已包含 .env.production（含数据库等密钥），请勿上传到公开位置。"
else
  echo "[info] 未包含 .env*，请在服务器复制 .env.production.template 并填写。"
fi
