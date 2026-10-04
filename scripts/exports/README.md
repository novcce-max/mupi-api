# 数据库导出（pg_dump）

本目录下的 `*.sql` 已加入 `.gitignore`，避免把会员哈希等敏感数据提交进 Git。

## 重新生成「完整」开发库备份

```bash
cd mupi-api
mkdir -p scripts/exports
pg_dump -h localhost -p 5432 -U mupi_user -d mupi_dev \
  --format=plain \
  --clean --if-exists \
  --no-owner --no-acl \
  --encoding=UTF8 \
  -f scripts/exports/mupi_dev_full_export_$(date +%Y%m%d).sql
```

说明：

- **`--clean --if-exists`**：还原时会先 `DROP` 再 `CREATE`，适合在**空库或允许整库替换**的场景。
- **`--no-owner --no-acl`**：线上用别的数据库用户也能 `psql` 还原，少权限报错。

## 覆盖还原到线上（务必先备份生产）

1. **先**对生产库再做一份备份：`pg_dump ... -f production_backup_xxx.sql`
2. 在能访问生产 Postgres 的机器上：

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f mupi_dev_full_export_YYYYMMDD.sql
```

或使用拆分的主机/库名/用户：

```bash
psql -h <主机> -p 5432 -U <用户> -d <库名> -v ON_ERROR_STOP=1 -f mupi_dev_full_export_YYYYMMDD.sql
```

3. **版本**：导出端为 PostgreSQL **16**；线上主版本若更低，建议用同大版本客户端做 dump/restore，或仅在版本兼容的前提下操作。

**警告**：该文件会删掉 dump 里涉及的所有 `public` 对象再重建，并装入 **mupi_dev 的数据**，线上业务数据会被替换为开发库内容，请确认意图后再执行。
