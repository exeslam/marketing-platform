/**
 * Run SQL directly on Supabase PostgreSQL.
 * Usage: node scripts/run-sql.mjs "SQL STATEMENT"
 */

import pg from "pg";
import { readFileSync } from "fs";

// Load .env.local
const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx < 0) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = SB_URL.replace("https://", "").replace(".supabase.co", "");

// Supabase connection string using service role
// Format: postgresql://postgres.[ref]:[service_role_key]@aws-0-[region].pooler.supabase.com:6543/postgres
// Try direct connection first
const connectionString = `postgresql://postgres.${projectRef}:${SB_KEY}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

const sql = process.argv[2];
if (!sql) {
  console.error("Usage: node scripts/run-sql.mjs \"SQL STATEMENT\"");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");
  const result = await client.query(sql);
  console.log("OK:", result.command, result.rowCount ?? 0, "rows");
  if (result.rows?.length > 0) {
    console.table(result.rows.slice(0, 20));
  }
} catch (err) {
  console.error("Error:", err.message);

  // Try different region
  if (err.message.includes("connect") || err.message.includes("ENOTFOUND")) {
    console.log("\nTrying different region endpoints...");
    const regions = ["us-east-1", "us-west-1", "ap-southeast-1", "eu-west-1"];
    for (const region of regions) {
      try {
        const altConn = `postgresql://postgres.${projectRef}:${SB_KEY}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
        const altClient = new pg.Client({ connectionString: altConn, ssl: { rejectUnauthorized: false } });
        await altClient.connect();
        console.log(`Connected via ${region}!`);
        const res = await altClient.query(sql);
        console.log("OK:", res.command, res.rowCount ?? 0, "rows");
        await altClient.end();
        process.exit(0);
      } catch { /* try next */ }
    }
    console.error("Could not connect to any region");
  }
} finally {
  await client.end().catch(() => {});
}
