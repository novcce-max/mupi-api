#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="${ROOT_DIR}/mupi-api"

OUT_ZIP="${OUT_ZIP:-${ROOT_DIR}/mupi-api-bt-build.zip}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

BUNDLE_DIR_NAME="mupi-api-bt-build"
BUNDLE_DIR="${TMP_DIR}/${BUNDLE_DIR_NAME}"

echo "[build-zip] root: ${ROOT_DIR}"
echo "[build-zip] api dir: ${API_DIR}"
echo "[build-zip] out zip: ${OUT_ZIP}"

mkdir -p "${BUNDLE_DIR}"

need_files=(
  "Dockerfile"
  "docker-compose.bt-build.yml"
  ".env.production.template"
  "nginx/conf.d/default.conf"
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "tsconfig.build.json"
  "nest-cli.json"
)

for f in "${need_files[@]}"; do
  if [[ ! -e "${API_DIR}/${f}" ]]; then
    echo "[build-zip] ERROR missing: ${f}"
    exit 1
  fi
done

mkdir -p "${BUNDLE_DIR}/nginx/conf.d"
mkdir -p "${BUNDLE_DIR}/src"
mkdir -p "${BUNDLE_DIR}/scripts"

cp "${API_DIR}/Dockerfile" "${BUNDLE_DIR}/"
cp "${API_DIR}/docker-compose.bt-build.yml" "${BUNDLE_DIR}/"
cp "${API_DIR}/.env.production.template" "${BUNDLE_DIR}/.env.production.template"
cp "${API_DIR}/nginx/conf.d/default.conf" "${BUNDLE_DIR}/nginx/conf.d/default.conf"
cp "${API_DIR}/package.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/package-lock.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/tsconfig.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/tsconfig.build.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/nest-cli.json" "${BUNDLE_DIR}/"
cp -R "${API_DIR}/src" "${BUNDLE_DIR}/"

# 可选：把原本的 scripts/ 也带上（比如以后你想 seed 或维护）
if [[ -d "${API_DIR}/scripts" ]]; then
  cp -R "${API_DIR}/scripts" "${BUNDLE_DIR}/scripts/"
fi

# 可选：带上 .dockerignore（能减少 build 上下文）
if [[ -f "${API_DIR}/.dockerignore" ]]; then
  cp "${API_DIR}/.dockerignore" "${BUNDLE_DIR}/.dockerignore"
fi

echo "[build-zip] zipping..."
cd "${TMP_DIR}"
zip -r "${OUT_ZIP}" "${BUNDLE_DIR_NAME}" >/dev/null

echo "[build-zip] done: ${OUT_ZIP}"
echo "[build-zip] Note: upload 到宝塔后需要在目录内创建 .env.production"

