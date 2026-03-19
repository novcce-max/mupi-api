#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="${ROOT_DIR}/mupi-api"

OUT_ZIP="${OUT_ZIP:-${ROOT_DIR}/mupi-api-bt-offline.zip}"
BUNDLE_DIR_NAME="${BUNDLE_DIR_NAME:-mupi-api-bt-offline}"

# 默认用你之前推的 latest
MUPI_API_IMAGE="${MUPI_API_IMAGE:-novcce/muni-api:latest}"

POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:16-alpine}"
REDIS_IMAGE="${REDIS_IMAGE:-redis:7-alpine}"
NGINX_IMAGE="${NGINX_IMAGE:-nginx:alpine}"

echo "[bundle] root: ${ROOT_DIR}"
echo "[bundle] api dir: ${API_DIR}"
echo "[bundle] out zip: ${OUT_ZIP}"
echo "[bundle] mupi-api image: ${MUPI_API_IMAGE}"

if [[ ! -f "${API_DIR}/.env.production" ]]; then
  echo "[bundle] ERROR: missing ${API_DIR}/.env.production"
  echo "[bundle] Please create/edit it first (fill DATABASE_URL, CONTACT_ADMIN_KEY, JWT_SECRET, INTERNAL_RPC_TOKEN, ...)."
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

BUNDLE_DIR="${TMP_DIR}/${BUNDLE_DIR_NAME}"
mkdir -p "${BUNDLE_DIR}"

echo "[bundle] preparing compose + env files..."
cp "${API_DIR}/docker-compose.prod.yml" "${BUNDLE_DIR}/"
cp "${API_DIR}/.env.production" "${BUNDLE_DIR}/"

mkdir -p "${BUNDLE_DIR}/nginx/conf.d"
cp "${API_DIR}/nginx/conf.d/default.conf" "${BUNDLE_DIR}/nginx/conf.d/default.conf"

cp "${API_DIR}/scripts/bt-offline-start.sh" "${BUNDLE_DIR}/bt-offline-start.sh"
chmod +x "${BUNDLE_DIR}/bt-offline-start.sh"

# docker-compose.prod.yml 里有 ${MUPI_API_IMAGE:-...}，补一个 .env 让其固定使用你当前的镜像 tag
cat > "${BUNDLE_DIR}/.env" <<EOF
MUPI_API_IMAGE=${MUPI_API_IMAGE}
EOF

# compose 会挂载这些目录；先给空目录，避免首次启动失败
mkdir -p "${BUNDLE_DIR}/data/postgres" "${BUNDLE_DIR}/data/redis"

echo "[bundle] saving docker images (docker save => images.tar)..."
IMAGES_TAR="${BUNDLE_DIR}/images.tar"

need_pull=0
if ! docker image inspect "${MUPI_API_IMAGE}" >/dev/null 2>&1; then
  echo "[bundle] mupi-api image not found locally: ${MUPI_API_IMAGE}"
  need_pull=1
fi

if [[ "${need_pull}" == "1" ]]; then
  echo "[bundle] try pulling from registry..."
  docker pull "${MUPI_API_IMAGE}"
fi

docker pull "${NGINX_IMAGE}" >/dev/null
docker pull "${POSTGRES_IMAGE}" >/dev/null
docker pull "${REDIS_IMAGE}" >/dev/null

docker save -o "${IMAGES_TAR}" \
  "${MUPI_API_IMAGE}" \
  "${NGINX_IMAGE}" \
  "${POSTGRES_IMAGE}" \
  "${REDIS_IMAGE}"

echo "[bundle] creating zip..."
cd "${TMP_DIR}"
zip -r "${OUT_ZIP}" "${BUNDLE_DIR_NAME}"

echo "[bundle] done: ${OUT_ZIP}"
echo
echo "[bundle] On BaoTa, unpack & run:"
echo "  cd /path/to/mupi-api-bt-offline"
echo "  docker load -i images.tar"
echo "  docker compose -f docker-compose.prod.yml up -d"

