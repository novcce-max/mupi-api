/**
 * Apply scripts/migrations/*.sql with node-postgres.
 * Use this for Neon / Vercel, where the function runtime has no psql.
 *
 *   DATABASE_URL='postgres://...?...sslmode=require' npm run db:apply-sql:node
 */
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const dir = join(process.cwd(), 'scripts', 'migrations');
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  if (files.length === 0) {
    console.error(`No SQL files in ${dir}`);
    process.exit(1);
  }

  const ssl =
    /(?:^|[?&])sslmode=(?:require|verify-ca|verify-full)(?:&|$)/i.test(
      connectionString,
    )
      ? { rejectUnauthorized: false }
      : undefined;
  const client = new Client({ connectionString, ssl });
  await client.connect();
  try {
    for (const name of files) {
      const sql = readFileSync(join(dir, name), 'utf8');
      console.log(`==> ${name}`);
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
  console.log(`Applied ${files.length} migration file(s)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
