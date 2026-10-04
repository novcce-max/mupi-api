FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/node:20-alpine AS build
WORKDIR /app

# 安装依赖（包含 dev 依赖以便 nest build）
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --no-audit --no-fund

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm run build

FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# psql：启动时可选执行 scripts/migrations（RUN_SQL_MIGRATIONS=true）
RUN apk add --no-cache postgresql-client

# 仅安装生产依赖
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --omit=dev --no-audit --no-fund \
  && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY scripts/migrations ./scripts/migrations
COPY .env.production ./.env.production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "const port=process.env.PORT||3001;fetch('http://127.0.0.1:'+port+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1));"

CMD ["node", "dist/main.js"]

