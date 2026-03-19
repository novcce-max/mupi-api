#!/usr/bin/env bash
set -euo pipefail

# BaoTa 上不一定有 docker compose，所以用 docker run 直接启动。
# 依赖：当前目录必须是离线包解压后的目录（包含 images.tar / .env.production / nginx/）

ROOT_DIR="$(pwd)"

if [[ ! -f "${ROOT_DIR}/images.tar" ]]; then
  echo "[bt-start] ERROR: images.tar not found in ${ROOT_DIR}"
  exit 1
fi

if [[ ! -f "${ROOT_DIR}/.env.production" ]]; then
  echo "[bt-start] ERROR: .env.production not found in ${ROOT_DIR}"
  exit 1
fi

if [[ ! -f "${ROOT_DIR}/nginx/conf.d/default.conf" ]]; then
  echo "[bt-start] ERROR: nginx/conf.d/default.conf not found in ${ROOT_DIR}"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source "${ROOT_DIR}/.env.production"
if [[ -f "${ROOT_DIR}/.env" ]]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
fi
set +a

if [[ -z "${DB_USERNAME:-}" || -z "${DB_PASSWORD:-}" || -z "${DB_DATABASE:-}" ]]; then
  echo "[bt-start] ERROR: DB_USERNAME/DB_PASSWORD/DB_DATABASE must be set in .env.production"
  exit 1
fi

NETWORK_NAME="${NETWORK_NAME:-mupi_internal_net}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-mupi-db}"
REDIS_CONTAINER_NAME="${REDIS_CONTAINER_NAME:-mupi-redis}"
API_CONTAINER_NAME="${API_CONTAINER_NAME:-mupi-api}"
NGINX_CONTAINER_NAME="${NGINX_CONTAINER_NAME:-mupi-nginx}"

POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:16-alpine}"
REDIS_IMAGE="${REDIS_IMAGE:-redis:7-alpine}"
NGINX_IMAGE="${NGINX_IMAGE:-nginx:alpine}"
API_IMAGE="${API_IMAGE:-${MUPI_API_IMAGE:-novcce/muni-api:latest}}"

echo "[bt-start] loading images.tar..."
docker load -i "${ROOT_DIR}/images.tar" >/dev/null

echo "[bt-start] ensuring network: ${NETWORK_NAME}"
if ! docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
  docker network create --internal "${NETWORK_NAME}" >/dev/null
fi

stop_rm_if_exist() {
  local name="$1"
  if docker ps -a --format '{{.Names}}' | grep -Fx "${name}" >/dev/null 2>&1; then
    docker rm -f "${name}" >/dev/null 2>&1 || true
  fi
}

echo "[bt-start] cleaning old containers (if any)..."
stop_rm_if_exist "${NGINX_CONTAINER_NAME}"
stop_rm_if_exist "${API_CONTAINER_NAME}"
stop_rm_if_exist "${DB_CONTAINER_NAME}"
stop_rm_if_exist "${REDIS_CONTAINER_NAME}"

mkdir -p "${ROOT_DIR}/data/postgres" "${ROOT_DIR}/data/redis"

echo "[bt-start] starting postgres..."
docker run -d \
  --name "${DB_CONTAINER_NAME}" \
  --restart always \
  --network "${NETWORK_NAME}" \
  -v "${ROOT_DIR}/data/postgres:/var/lib/postgresql/data" \
  -e "POSTGRES_USER=${DB_USERNAME}" \
  -e "POSTGRES_PASSWORD=${DB_PASSWORD}" \
  -e "POSTGRES_DB=${DB_DATABASE}" \
  "${POSTGRES_IMAGE}" >/dev/null

echo "[bt-start] starting redis..."
docker run -d \
  --name "${REDIS_CONTAINER_NAME}" \
  --restart always \
  --network "${NETWORK_NAME}" \
  -v "${ROOT_DIR}/data/redis:/data" \
  "${REDIS_IMAGE}" \
  redis-server --appendonly yes >/dev/null

echo "[bt-start] starting mupi-api..."
docker run -d \
  --name "${API_CONTAINER_NAME}" \
  --restart always \
  --network "${NETWORK_NAME}" \
  --env-file "${ROOT_DIR}/.env.production" \
  "${API_IMAGE}" >/dev/null

echo "[bt-start] starting nginx..."
docker run -d \
  --name "${NGINX_CONTAINER_NAME}" \
  --restart always \
  -p 80:80 \
  --network "${NETWORK_NAME}" \
  -v "${ROOT_DIR}/nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  "${NGINX_IMAGE}" >/dev/null

echo "[bt-start] all started."
echo "[bt-start] health: curl http://127.0.0.1/api/health"

