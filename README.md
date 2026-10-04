# mupi-api

**环境变量与 mupi-web 对齐**：见**仓库根目录** [`ENV.md`](../ENV.md)。本地开发主文件：**`.env.development`**；生产：**`.env.production`** 或平台注入。

---

## Deployment Guide

This package is ready for Baota Docker Compose deployment.

## Included Files

- `Dockerfile`: multi-stage build for NestJS API (`/app`, output `dist/`)
- `docker-compose.yml`: API + PostgreSQL + Redis
- `scripts/healthcheck.sh`: local health check helper
- `nest-cli.json`, `package.json`, `src/`: standard Nest build/runtime files

## Compose Highlights

- API build/runtime base image (China mirror):
  - `swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/node:20-alpine`
- PostgreSQL image:
  - `swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/postgres:15-alpine`
- Redis image:
  - `swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/redis:7-alpine`
- API service:
  - port mapping `3001:3001`
  - `NODE_ENV=production`, `PORT=3001`
  - `env_file: .env.production`
  - binds `./.env.production:/app/.env.production:ro`
  - health check to `http://127.0.0.1:3001/api/health`

## Deploy Steps (Baota)

1. Upload and extract this package.
2. Edit `.env.production` placeholders (DB/secret values).
3. In Baota Container Compose, paste `docker-compose.yml` or use uploaded file.
4. Start services.
5. Verify:
   - `http://127.0.0.1:3001/api/health`

## Important Notes

- Production config loading is set to prioritize `.env.production`.
- Build (`npm ci` + `npm run build`) runs inside Dockerfile build stage.
- Do not run `npm run build` inside an already running container.
