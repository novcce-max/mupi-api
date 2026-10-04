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
  "docker-compose.yml"
  "docker-compose.bt-build.yml"
  "deploy.md"
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
cp "${API_DIR}/docker-compose.yml" "${BUNDLE_DIR}/"
cp "${API_DIR}/docker-compose.bt-build.yml" "${BUNDLE_DIR}/"
cp "${API_DIR}/.env.production.template" "${BUNDLE_DIR}/.env.production.template"
if [[ -f "${API_DIR}/.env.production" ]]; then
  cp "${API_DIR}/.env.production" "${BUNDLE_DIR}/.env.production"
  echo "[build-zip] included .env.production (NODE_ENV=production；zip 内含密钥，勿外传)"
fi
cp "${API_DIR}/nginx/conf.d/default.conf" "${BUNDLE_DIR}/nginx/conf.d/default.conf"
cp "${API_DIR}/package.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/package-lock.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/tsconfig.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/tsconfig.build.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/nest-cli.json" "${BUNDLE_DIR}/"
cp "${API_DIR}/deploy.md" "${BUNDLE_DIR}/"
cp -R "${API_DIR}/src" "${BUNDLE_DIR}/"

# 勿用 cp -R scripts bundle/scripts/（会先建空目录导致嵌套成 scripts/scripts）
if [[ -d "${API_DIR}/scripts" ]]; then
  cp -R "${API_DIR}/scripts/." "${BUNDLE_DIR}/scripts/"
fi

# 可选：带上 .dockerignore（能减少 build 上下文）
if [[ -f "${API_DIR}/.dockerignore" ]]; then
  cp "${API_DIR}/.dockerignore" "${BUNDLE_DIR}/.dockerignore"
fi

echo "[build-zip] zipping..."
cd "${TMP_DIR}"
zip -r "${OUT_ZIP}" "${BUNDLE_DIR_NAME}" >/dev/null

echo "[build-zip] done: ${OUT_ZIP}"
echo "[build-zip] Compose: docker-compose.yml=仅 API+Redis；docker-compose.bt-build.yml=含 Nginx(80)+API+Redis"
if [[ ! -f "${BUNDLE_DIR}/.env.production" ]]; then
  echo "[build-zip] Note: 若包内无 .env.production，可在服务器复制 .env.production.template 并改名填写"
fi

