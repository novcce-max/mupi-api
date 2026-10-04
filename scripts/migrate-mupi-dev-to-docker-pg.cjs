#!/usr/bin/env node
/**
 * 将本地 PostgreSQL 库 mupi_dev 的表数据，按服务端游标分批（FETCH n）迁移到
 * 容器 mupi-postgres 暴露端口上的 mupi_sql。
 *
 * 用法（在 mupi-api 目录）：
 *   node scripts/migrate-mupi-dev-to-docker-pg.cjs
 *
 * 环境变量（可选）：
 *   MIGRATE_SOURCE_HOST=127.0.0.1
 *   MIGRATE_SOURCE_PORT=5432
 *   MIGRATE_SOURCE_USER=mupi_user
 *   MIGRATE_SOURCE_PASSWORD=   （默认同 .env.development 空密码）
 *   MIGRATE_SOURCE_DB=mupi_dev
 *   MIGRATE_TARGET_HOST=127.0.0.1
 *   MIGRATE_TARGET_PORT=5433    （与 .env.docker 中 POSTGRES_PORT 一致）
 *   MIGRATE_TARGET_USER=mupi_user
 *   MIGRATE_TARGET_PASSWORD=    （默认从 .env.docker 读取 DB_PASSWORD）
 *   MIGRATE_TARGET_DB=mupi_sql
 *   MIGRATE_BATCH_SIZE=100
 *   MIGRATE_SKIP_TRUNCATE=1     （不清空目标表，仅追加；可能与唯一约束冲突）
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadDockerDbPassword() {
  const p = path.join(__dirname, "..", ".env.docker");
  if (!fs.existsSync(p)) return "";
  const raw = fs.readFileSync(p, "utf8");
  const m = raw.match(/^DB_PASSWORD=(.*)$/m);
  return m ? m[1].trim() : "";
}

function quoteIdent(id) {
  return '"' + String(id).replace(/"/g, '""') + '"';
}

function env(name, def) {
  const v = process.env[name];
  return v !== undefined && v !== "" ? v : def;
}

const BATCH = Math.max(1, parseInt(env("MIGRATE_BATCH_SIZE", "100"), 10) || 100);
const SKIP_TRUNCATE = env("MIGRATE_SKIP_TRUNCATE", "") === "1";

/** 仅迁移源库中存在的表；顺序满足 members → 子表 → 其余 */
const TABLE_ORDER = [
  "members",
  "member_history",
  "member_stats",
  "wiki_species",
  "problems",
  "materials",
  "cases",
  "content_items",
  "project_kits",
  "settings",
  "typeorm_metadata",
  "admin_logs",
  "analytics_events",
  "contact_logs",
];

const TRUNCATE_TABLES = [
  "member_history",
  "member_stats",
  "members",
  "admin_logs",
  "analytics_events",
  "cases",
  "contact_logs",
  "content_items",
  "materials",
  "problems",
  "project_kits",
  "settings",
  "typeorm_metadata",
  "wiki_species",
];

async function tableExists(client, name) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name],
  );
  return r.rowCount > 0;
}

async function getPKColumns(client, table) {
  const r = await client.query(
    `SELECT a.attname AS col
     FROM pg_index i
     JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
     WHERE i.indrelid = ($1::text)::regclass AND i.indisprimary
     ORDER BY array_position (i.indkey::int[], a.attnum)`,
    [`public.${table}`],
  );
  return r.rows.map((x) => x.col);
}

async function getCommonColumns(source, target, table) {
  const qSource = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position`;
  const qTarget = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
      AND is_generated = 'NEVER'
    ORDER BY ordinal_position`;
  const [s, t] = await Promise.all([source.query(qSource, [table]), target.query(qTarget, [table])]);
  const targetSet = new Set(t.rows.map((r) => r.column_name));
  return s.rows.map((r) => r.column_name).filter((c) => targetSet.has(c));
}

/** 目标列 udt：用于 json/jsonb 绑定（避免 pg 把 JS 数组当成 PostgreSQL array 字面量） */
async function getTargetColumnUdts(target, table) {
  const r = await target.query(
    `
    SELECT column_name, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1 AND is_generated = 'NEVER'`,
    [table],
  );
  const m = new Map();
  for (const row of r.rows) {
    m.set(row.column_name, row.udt_name);
  }
  return m;
}

function formatCellForTarget(value, udtName) {
  if (value === null || value === undefined) return null;
  if (udtName === "json" || udtName === "jsonb") {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }
  return value;
}

function placeholderForColumn(paramIndex, udtName) {
  if (udtName === "json" || udtName === "jsonb") {
    return `$${paramIndex}::jsonb`;
  }
  return `$${paramIndex}`;
}

async function migrateTable(source, target, table, columns, orderCols, targetUdts) {
  if (columns.length === 0) {
    console.log(`  ${table}: skip (no common columns)`);
    return 0;
  }

  const colList = columns.map(quoteIdent).join(", ");
  const orderBy =
    orderCols.length > 0
      ? orderCols.map(quoteIdent).join(", ")
      : columns.map(quoteIdent).join(", ");

  const countR = await source.query(`SELECT COUNT(*)::int AS n FROM ${quoteIdent(table)}`);
  const totalSource = countR.rows[0].n;
  if (totalSource === 0) {
    console.log(`  ${table}: 0 rows (skip)`);
    return 0;
  }

  const safeCur = `migr_${table.replace(/[^a-z0-9_]/gi, "_")}`;

  await source.query("BEGIN");
  let inserted = 0;
  try {
    await source.query(
      `DECLARE ${safeCur} CURSOR FOR SELECT ${colList} FROM ${quoteIdent(table)} ORDER BY ${orderBy}`,
    );

    while (true) {
      const res = await source.query(`FETCH ${BATCH} FROM ${safeCur}`);
      if (res.rows.length === 0) break;

      const rows = res.rows;
      const placeholders = [];
      const vals = [];
      let pi = 1;
      for (const row of rows) {
        const cells = [];
        for (const c of columns) {
          const udt = targetUdts.get(c) || "";
          cells.push(placeholderForColumn(pi, udt));
          vals.push(formatCellForTarget(row[c], udt));
          pi += 1;
        }
        placeholders.push(`(${cells.join(", ")})`);
      }
      const ins = `INSERT INTO ${quoteIdent(table)} (${colList}) VALUES ${placeholders.join(", ")}`;
      await target.query(ins, vals);
      inserted += rows.length;
      process.stdout.write(`\r  ${table}: ${inserted}/${totalSource}`);
    }

    await source.query(`CLOSE ${safeCur}`);
    await source.query("COMMIT");
    console.log(`\r  ${table}: ${inserted} rows`);
    return inserted;
  } catch (e) {
    await source.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

async function syncSerialMax(target, table) {
  const seqR = await target.query(
    `SELECT pg_get_serial_sequence($1::text, 'id') AS seq`,
    [`public.${table}`],
  );
  const seq = seqR.rows[0]?.seq;
  if (!seq) return;
  await target.query(
    `SELECT setval($1::regclass, (SELECT COALESCE(MAX(id), 1) FROM ${quoteIdent(table)}), true)`,
    [seq],
  );
}

async function main() {
  const sourceCfg = {
    host: env("MIGRATE_SOURCE_HOST", "127.0.0.1"),
    port: parseInt(env("MIGRATE_SOURCE_PORT", "5432"), 10),
    user: env("MIGRATE_SOURCE_USER", "mupi_user"),
    password: env("MIGRATE_SOURCE_PASSWORD", ""),
    database: env("MIGRATE_SOURCE_DB", "mupi_dev"),
  };
  const targetCfg = {
    host: env("MIGRATE_TARGET_HOST", "127.0.0.1"),
    port: parseInt(env("MIGRATE_TARGET_PORT", "5433"), 10),
    user: env("MIGRATE_TARGET_USER", "mupi_user"),
    password: env("MIGRATE_TARGET_PASSWORD", loadDockerDbPassword()),
    database: env("MIGRATE_TARGET_DB", "mupi_sql"),
  };

  if (!targetCfg.password) {
    console.error("目标库密码为空：请在 .env.docker 设置 DB_PASSWORD 或导出 MIGRATE_TARGET_PASSWORD");
    process.exit(1);
  }

  const source = new Client(sourceCfg);
  const target = new Client(targetCfg);
  await source.connect();
  await target.connect();

  console.log(
    `源: ${sourceCfg.user}@${sourceCfg.host}:${sourceCfg.port}/${sourceCfg.database}  批大小=${BATCH}（服务端游标 FETCH）`,
  );
  console.log(`目标: ${targetCfg.user}@${targetCfg.host}:${targetCfg.port}/${targetCfg.database}`);

  if (!SKIP_TRUNCATE) {
    console.log("清空目标表（保留 admin_users / auth_*）…");
    await target.query(
      `TRUNCATE TABLE ${TRUNCATE_TABLES.map((t) => `public.${t}`).join(", ")} RESTART IDENTITY CASCADE`,
    );
  } else {
    console.log("MIGRATE_SKIP_TRUNCATE=1：不清空目标表");
  }

  const serialTables = [];

  for (const table of TABLE_ORDER) {
    if (!(await tableExists(source, table)) || !(await tableExists(target, table))) continue;

    const columns = await getCommonColumns(source, target, table);
    const targetUdts = await getTargetColumnUdts(target, table);
    const pk = await getPKColumns(source, table);
    const orderCols = pk.filter((c) => columns.includes(c));
    await migrateTable(source, target, table, columns, orderCols, targetUdts);
    if (columns.includes("id")) serialTables.push(table);
  }

  console.log("同步 id 序列…");
  for (const table of serialTables) {
    try {
      await syncSerialMax(target, table);
    } catch {
      /* 无 serial 的表忽略 */
    }
  }

  await source.end();
  await target.end();
  console.log("完成。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
