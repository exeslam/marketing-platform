/**
 * Full sync: discover all Meta ad accounts, create projects + connections,
 * sync campaigns & daily metrics for Feb 2026.
 *
 * Run: node scripts/sync-all-meta.mjs
 *
 * Requires .env.local with:
 *   META_AD_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "fs";

// ---------- Load .env.local manually (no dotenv needed) ----------
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

const TOKEN = process.env.META_AD_ACCESS_TOKEN;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!TOKEN || !SB_URL || !SB_KEY) {
  console.error("Missing env vars. Check .env.local");
  process.exit(1);
}

// ---------- Helpers ----------

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function metaFetch(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set("access_token", TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url);
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Step 1: Discover all ad accounts ----------

async function getAllAdAccounts() {
  const me = await metaFetch("me", { fields: "id,name" });
  console.log(`User: ${me.name} (${me.id})`);

  let accounts = [];
  let url = `me/adaccounts`;
  let params = { fields: "id,name,account_id,currency,amount_spent,account_status", limit: "50" };

  while (url) {
    const data = await metaFetch(url, params);
    if (data.data) accounts.push(...data.data);
    url = null;
    params = {};
    if (data.paging?.next) {
      // Extract path from full URL
      const nextUrl = new URL(data.paging.next);
      url = nextUrl.pathname.replace("/v21.0/", "") + nextUrl.search;
      // For next pages, params are in the URL itself
    }
  }

  // Filter: only accounts with actual spend (amount_spent > 0) and active (status 1)
  const active = accounts.filter((a) => Number(a.amount_spent) > 0);
  active.sort((a, b) => Number(b.amount_spent) - Number(a.amount_spent));

  console.log(`\nFound ${accounts.length} accounts total, ${active.length} with spend:\n`);
  for (const a of active) {
    const spent = (Number(a.amount_spent) / 100).toLocaleString("en-US", { style: "currency", currency: a.currency || "USD" });
    console.log(`  ${a.name.padEnd(35)} ${a.id.padEnd(25)} ${spent.padEnd(15)} [${a.currency}]`);
  }

  return active;
}

// ---------- Step 2: Ensure project exists for each account ----------

async function ensureProject(accountName) {
  // Check if project with this name already exists
  const existing = await sbFetch(`projects?name=eq.${encodeURIComponent(accountName)}&select=id,name`);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0];
  }

  // Create new project
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const result = await sbFetch("projects", {
    method: "POST",
    body: JSON.stringify({
      name: accountName,
      color,
      status: "active",
      type: "school",
    }),
  });

  if (Array.isArray(result) && result.length > 0) {
    console.log(`  Created project: ${accountName}`);
    return result[0];
  }
  console.error(`  Failed to create project: ${accountName}`, result);
  return null;
}

// ---------- Step 3: Ensure ad_platform connection ----------

async function ensurePlatformConnection(projectId, adAccountId, accountName) {
  // Check existing
  const existing = await sbFetch(
    `ad_platforms?project_id=eq.${projectId}&platform=eq.meta&select=id,account_id`
  );
  if (Array.isArray(existing) && existing.length > 0) {
    // Update account_id if different
    if (existing[0].account_id !== adAccountId) {
      await sbFetch(`ad_platforms?id=eq.${existing[0].id}`, {
        method: "PATCH",
        body: JSON.stringify({ account_id: adAccountId, account_name: accountName, is_connected: true }),
      });
    }
    return existing[0].id;
  }

  // Create new connection
  const result = await sbFetch("ad_platforms", {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      platform: "meta",
      account_id: adAccountId,
      account_name: accountName,
      is_connected: true,
      currency: "USD",
    }),
  });

  if (Array.isArray(result) && result.length > 0) {
    return result[0].id;
  }
  console.error(`  Failed to create platform connection`, result);
  return null;
}

// ---------- Step 4: Sync campaigns for one account ----------

async function syncCampaigns(adAccountId, projectId, platformId) {
  const campData = await metaFetch(`${adAccountId}/campaigns`, {
    fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
    limit: "100",
  });

  const campaigns = campData.data || [];
  if (campaigns.length === 0) return { campaigns: 0, metrics: 0 };

  // Upsert campaigns (use upsert to avoid duplicates)
  const campRows = campaigns.map((c) => ({
    platform_id: platformId,
    project_id: projectId,
    external_id: c.id,
    name: c.name,
    status: (c.status || "UNKNOWN").toLowerCase(),
    objective: c.objective || null,
    daily_budget_kzt: c.daily_budget ? Math.round(Number(c.daily_budget) / 100) : null,
    lifetime_budget_kzt: c.lifetime_budget ? Math.round(Number(c.lifetime_budget) / 100) : null,
    start_date: c.start_time ? c.start_time.slice(0, 10) : null,
    end_date: c.stop_time ? c.stop_time.slice(0, 10) : null,
    updated_at: new Date().toISOString(),
  }));

  // Delete existing campaigns for this platform to avoid conflict
  await sbFetch(`ad_campaigns?platform_id=eq.${platformId}`, { method: "DELETE" });

  const inserted = await sbFetch("ad_campaigns", {
    method: "POST",
    body: JSON.stringify(campRows),
  });

  const insertedArr = Array.isArray(inserted) ? inserted : [];

  // Build map: external_id -> db id
  const campMap = new Map(insertedArr.map((c) => [c.external_id, c.id]));

  // Fetch daily insights (last 90 days for comprehensive data)
  const today = new Date();
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 86400000);
  const since = ninetyDaysAgo.toISOString().slice(0, 10);
  const until = today.toISOString().slice(0, 10);

  // Delete old metrics for this project+platform
  await sbFetch(`ad_metrics_daily?project_id=eq.${projectId}&platform=eq.meta`, { method: "DELETE" });

  let metricCount = 0;

  // Fetch account-level insights broken down by campaign
  let allInsights = [];
  let insightsUrl = `${adAccountId}/insights`;
  let insightsParams = {
    fields: "campaign_id,impressions,reach,clicks,spend,ctr,cpc,cpm,frequency,actions",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    level: "campaign",
    limit: "500",
  };

  // Paginate through insights
  while (insightsUrl) {
    const insightsData = await metaFetch(insightsUrl, insightsParams);
    if (insightsData.data) allInsights.push(...insightsData.data);

    insightsUrl = null;
    insightsParams = {};
    if (insightsData.paging?.next) {
      const nextUrl = new URL(insightsData.paging.next);
      insightsUrl = nextUrl.pathname.replace("/v21.0/", "") + nextUrl.search;
    }
    // Rate limit
    await sleep(200);
  }

  // Build metric rows
  const metricRows = [];
  for (const row of allInsights) {
    const dbCampId = campMap.get(row.campaign_id);
    if (!dbCampId) continue;

    const actions = row.actions || [];
    const getAction = (type) => {
      const a = actions.find((x) => x.action_type === type);
      return a ? Number(a.value) : 0;
    };

    metricRows.push({
      campaign_id: dbCampId,
      project_id: projectId,
      platform: "meta",
      date: row.date_start,
      impressions: Number(row.impressions) || 0,
      reach: Number(row.reach) || 0,
      clicks: Number(row.clicks) || 0,
      spend_kzt: Number(row.spend) || 0,
      ctr: Number(row.ctr) || 0,
      cpc_kzt: Number(row.cpc) || 0,
      cpm_kzt: Number(row.cpm) || 0,
      frequency: Number(row.frequency) || 0,
      video_views: getAction("video_view"),
      conversions:
        getAction("lead") +
        getAction("onsite_conversion.lead_grouped") +
        getAction("offsite_conversion.fb_pixel_lead") +
        getAction("offsite_conversion.fb_pixel_purchase") +
        getAction("onsite_conversion.messaging_conversation_started_7d") +
        getAction("messaging_conversation_started_7d") +
        getAction("onsite_conversion.messaging_first_reply"),
      link_clicks: getAction("link_click"),
      likes: getAction("like") + getAction("post_reaction"),
      comments: getAction("comment"),
      shares: getAction("post"),
      conversion_value_kzt: 0,
      cost_per_conversion_kzt: 0,
    });
  }

  // Insert in batches
  for (let i = 0; i < metricRows.length; i += 100) {
    const batch = metricRows.slice(i, i + 100);
    await sbFetch("ad_metrics_daily", {
      method: "POST",
      body: JSON.stringify(batch),
      headers: { Prefer: "return=minimal" },
    });
  }

  metricCount = metricRows.length;

  // Update sync timestamp
  await sbFetch(`ad_platforms?id=eq.${platformId}`, {
    method: "PATCH",
    body: JSON.stringify({ last_synced_at: new Date().toISOString(), sync_error: null }),
  });

  return { campaigns: insertedArr.length, metrics: metricCount };
}

// ---------- Main ----------

async function main() {
  console.log("========================================");
  console.log("  Full Meta Ads Sync");
  console.log("========================================\n");

  // 1. Get all ad accounts with spend
  const accounts = await getAllAdAccounts();

  if (accounts.length === 0) {
    console.log("\nNo accounts with spend data found.");
    return;
  }

  console.log(`\n--- Syncing ${accounts.length} accounts ---\n`);

  let totalCampaigns = 0;
  let totalMetrics = 0;

  for (const account of accounts) {
    const accountId = account.id; // "act_XXXXX"
    const accountName = account.name || `Account ${account.account_id}`;

    console.log(`\n[$] ${accountName} (${accountId})`);

    // Ensure project
    const project = await ensureProject(accountName);
    if (!project) {
      console.log(`  SKIP: Could not create project`);
      continue;
    }
    console.log(`  Project: ${project.name} (${project.id})`);

    // Ensure platform connection
    const platformId = await ensurePlatformConnection(project.id, accountId, accountName);
    if (!platformId) {
      console.log(`  SKIP: Could not create platform connection`);
      continue;
    }
    console.log(`  Platform ID: ${platformId}`);

    // Sync campaigns & metrics
    try {
      const result = await syncCampaigns(accountId, project.id, platformId);
      console.log(`  Synced: ${result.campaigns} campaigns, ${result.metrics} daily metric rows`);
      totalCampaigns += result.campaigns;
      totalMetrics += result.metrics;
    } catch (err) {
      console.error(`  ERROR syncing: ${err.message}`);
      // Update error in DB
      await sbFetch(`ad_platforms?id=eq.${platformId}`, {
        method: "PATCH",
        body: JSON.stringify({ sync_error: err.message }),
      });
    }

    // Rate limit between accounts
    await sleep(500);
  }

  console.log("\n========================================");
  console.log(`  Done! ${totalCampaigns} campaigns, ${totalMetrics} metric rows`);
  console.log("========================================");
}

main().catch(console.error);
