#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR/mupi-api"

# 默认推送到你的镜像仓库：novcce/muni-api
DOCKER_REPO="${DOCKER_REPO:-novcce/muni-api}"
TAG="${TAG:-latest}"
IMAGE="${DOCKER_REPO}:${TAG}"

# 可选：指定构建平台（buildx 时生效）
PLATFORMS="${PLATFORMS:-linux/amd64}"
USE_BUILDX="${USE_BUILDX:-0}"

echo "[docker] building: ${IMAGE}"
echo "[docker] repo: ${DOCKER_REPO}"
echo "[docker] tag: ${TAG}"

if [[ "${USE_BUILDX}" == "1" ]] && command -v docker >/dev/null 2>&1 && docker buildx version >/dev/null 2>&1; then
  echo "[docker] using buildx (push enabled)"
  # 同时推送 :latest（当 TAG 不是 latest 时）
  if [[ "${TAG}" == "latest" ]]; then
    docker buildx build --platform "${PLATFORMS}" -t "${IMAGE}" --push .
  else
    docker buildx build --platform "${PLATFORMS}" -t "${IMAGE}" -t "${DOCKER_REPO}:latest" --push .
  fi
else
  docker build -t "${IMAGE}" .

  docker push "${IMAGE}"
  if [[ "${TAG}" != "latest" ]]; then
    docker tag "${IMAGE}" "${DOCKER_REPO}:latest"
    docker push "${DOCKER_REPO}:latest"
  fi
fi

echo "[docker] done"

