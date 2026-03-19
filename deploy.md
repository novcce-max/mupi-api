# Mupi API (NestJS) Docker 部署指南（宝塔/服务器通用）

本目录提供两套生产部署方式：
1) 在线部署：服务器具备 `docker compose`/`docker-compose`，可直接用生产 compose 文件拉起（会联网拉基础镜像）。
2) 离线部署：服务器被墙/不方便装 compose，只需要有 Docker，就可以用离线镜像包一键启动。

> 注意：API 在应用里设置了全局前缀 `/api`，因此健康检查为 `/api/health`，Swagger 为 `/api/docs`。

---

## 1) 服务器上传目录结构（推荐）

建议上传到服务器 `/opt/mupi-api`：

```
/opt/mupi-api
  ├─ docker-compose.prod.yml
  ├─ .env.production.template    # 生产环境请复制成 .env.production 并填写真实值
  ├─ nginx/
  │   └─ conf.d/
  │      └─ default.conf
  ├─ scripts/
  │   └─ backup-postgres.sh
  ├─ data/
  │   ├─ postgres/   # PostgreSQL 持久化数据
  │   └─ redis/      # Redis 持久化数据（AOF 持久化）
  └─ backups/        # 数据库备份输出目录（脚本会自动创建）
```

---

## 2) 服务器前置条件

你已具备：

- Docker Engine
- （可选）Docker Compose（在线方式需要）

验证：

```bash
docker --version
docker compose version || docker-compose version || true
```

---

## 3) 上传项目到服务器

从本机上传 `mupi-api` 目录到服务器（示例）：

```bash
scp -r ./mupi-api ubuntu@<SERVER_IP>:/opt/mupi-api
```

登录服务器：

```bash
ssh ubuntu@<SERVER_IP>
cd /opt/mupi-api
```

---

## 4) 配置 `.env.production`（所有密码都放这里）

复制模板并修改：

```bash
cp .env.production.template .env.production
vim .env.production
```

至少需要设置（生产强校验推荐项）：

- **应用与数据库**
  - `JWT_SECRET`
  - `CORS_ORIGIN`
  - `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE`
  - `REDIS_PASSWORD`

- **Admin / 内部调用安全**
  - `INTERNAL_RPC_TOKEN` 或 `INTERNAL_RPC_TOKENS`（至少配置一个，随机、足够长，仅用于后端之间调用）
  - `ADMIN_TRUSTED_IPS`（逗号分隔，仅允许的来源 IP，例如内网网关或 Next 服务器 IP）

> 注意：`INTERNAL_RPC_*` 仅应在后端使用，**绝不能配置为 `NEXT_PUBLIC_*` 或出现在任何前端打包代码中**。

---

## 5) 启动服务（在线/离线二选一）

### 5.1 在线方式（有 compose）

在 `/opt/mupi-api` 执行：

```bash
docker compose -f docker-compose.prod.yml up -d
# 若你的系统是 docker-compose(v1)：
# docker-compose -f docker-compose.prod.yml up -d
```

检查状态与日志：

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f mupi-nginx
docker compose -f docker-compose.prod.yml logs -f mupi-api
```

本机验证：

```bash
curl -sS http://127.0.0.1/api/health
```

对外访问：

- `http://<SERVER_IP>/api/health`
- `http://<SERVER_IP>/api/docs`

---

### 5.2 离线方式（不依赖 compose / 适合被墙）

把你本机生成的 `mupi-api-bt-offline.zip` 上传到服务器（本机可执行：`bash scripts/package-bt-offline-zip.sh`），并解压到目录（示例：`/opt/mupi-api-offline`）：

```bash
cd /opt
unzip mupi-api-bt-offline.zip -d mupi-api-offline
cd mupi-api-offline
```

然后启动（不依赖 docker compose）：

```bash
bash bt-offline-start.sh
```

验证：

```bash
curl -sS http://127.0.0.1/api/health
```

---

## 6) 数据持久化说明

- PostgreSQL：挂载到 `./data/postgres`
- Redis：挂载到 `./data/redis`（开启 AOF，容器重启数据仍在）

---

## 7) PostgreSQL 备份脚本

脚本位置：`scripts/backup-postgres.sh`  
输出目录：`./backups/`（自动创建）

首次使用给执行权限：

```bash
chmod +x scripts/backup-postgres.sh
```

执行备份：

```bash
./scripts/backup-postgres.sh
```

会生成类似文件：`backups/postgres_20260305_120000.sql.gz`

