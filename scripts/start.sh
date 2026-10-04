#!/usr/bin/env sh
set -eu

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3001}"

exec node dist/main.js
