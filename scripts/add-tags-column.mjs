/**
 * Add tags column to ad_campaigns via Supabase REST API.
 * Run: node scripts/add-tags-column.mjs
 */

import { readFileSync } from "fs";

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

const sql = `ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];`;

const res = await fetch(`${SB_URL}/rest/v1/rpc/`, {
  method: "POST",
  headers: {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

// Try via SQL directly using Supabase management API
// If RPC doesn't work, fall back to direct SQL
if (!res.ok) {
  console.log("RPC approach didn't work, trying pg_query...");

  // Use Supabase's pg endpoint
  const pgRes = await fetch(`${SB_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  if (!pgRes.ok) {
    console.log("\nCannot run SQL via API. Please run this SQL manually in Supabase SQL Editor:\n");
    console.log("  " + sql);
    console.log("\nGo to: https://supabase.com/dashboard → SQL Editor → paste the SQL above → Run");
  } else {
    console.log("Tags column added successfully!");
  }
} else {
  console.log("Tags column added successfully!");
}
