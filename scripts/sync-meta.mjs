/**
 * One-time script to sync Meta Ads data into Supabase.
 * Run: node scripts/sync-meta.mjs
 */

const TOKEN = process.env.META_AD_ACCESS_TOKEN;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_ID = "11111111-1111-1111-1111-111111111111";
const PLATFORM_ID = "68209b59-6c18-466e-aa3b-c50463bf19b3";
const AD_ACCOUNT = "act_235978272479441";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
  });
  return res.json();
}

async function metaFetch(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set("access_token", TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  return res.json();
}

async function main() {
  console.log("=== Syncing Meta Ads ===");

  // 1. Delete old campaigns & metrics
  await sbFetch(`ad_metrics_daily?platform=eq.meta&project_id=eq.${PROJECT_ID}`, { method: "DELETE" });
  await sbFetch(`ad_campaigns?platform_id=eq.${PLATFORM_ID}`, { method: "DELETE" });
  console.log("Cleaned old data");

  // 2. Fetch campaigns
  const campData = await metaFetch(`${AD_ACCOUNT}/campaigns`, {
    fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
    limit: "50",
  });
  const campaigns = campData.data || [];
  console.log(`Fetched ${campaigns.length} campaigns`);

  // 3. Insert campaigns
  const campRows = campaigns.map((c) => ({
    platform_id: PLATFORM_ID,
    project_id: PROJECT_ID,
    external_id: c.id,
    name: c.name,
    status: c.status.toLowerCase(),
    objective: c.objective || null,
    daily_budget_kzt: c.daily_budget ? Math.round(Number(c.daily_budget) / 100) : null,
    lifetime_budget_kzt: c.lifetime_budget ? Math.round(Number(c.lifetime_budget) / 100) : null,
    start_date: c.start_time ? c.start_time.slice(0, 10) : null,
    end_date: c.stop_time ? c.stop_time.slice(0, 10) : null,
  }));

  const inserted = await sbFetch("ad_campaigns", {
    method: "POST",
    body: JSON.stringify(campRows),
  });
  console.log(`Inserted ${inserted.length} campaigns`);

  // 4. Build campaign ID map
  const campMap = new Map(inserted.map((c) => [c.external_id, c.id]));

  // 5. Fetch daily insights for Feb 2026
  const insightsData = await metaFetch(`${AD_ACCOUNT}/insights`, {
    fields: "campaign_id,impressions,reach,clicks,spend,ctr,cpc,cpm,frequency,actions",
    time_increment: "1",
    time_range: JSON.stringify({ since: "2026-02-01", until: "2026-02-27" }),
    level: "campaign",
    limit: "500",
  });

  const insights = insightsData.data || [];
  console.log(`Fetched ${insights.length} daily insight rows`);

  // 6. Insert metrics
  const metricRows = [];
  for (const row of insights) {
    const dbCampId = campMap.get(row.campaign_id);
    if (!dbCampId) continue;

    const actions = row.actions || [];
    const getAction = (type) => {
      const a = actions.find((a) => a.action_type === type);
      return a ? Number(a.value) : 0;
    };

    metricRows.push({
      campaign_id: dbCampId,
      project_id: PROJECT_ID,
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
      conversions: getAction("lead"),
      link_clicks: getAction("link_click"),
      likes: getAction("like") + getAction("post_reaction"),
      comments: getAction("comment"),
      shares: getAction("post"),
      conversion_value_kzt: 0,
      cost_per_conversion_kzt: 0,
    });
  }

  // Insert in batches of 100
  for (let i = 0; i < metricRows.length; i += 100) {
    const batch = metricRows.slice(i, i + 100);
    await sbFetch("ad_metrics_daily", {
      method: "POST",
      body: JSON.stringify(batch),
    });
    console.log(`  Inserted metrics batch ${i / 100 + 1} (${batch.length} rows)`);
  }

  console.log(`\nTotal: ${inserted.length} campaigns, ${metricRows.length} metric rows`);

  // 7. Update last_synced_at
  await sbFetch(`ad_platforms?id=eq.${PLATFORM_ID}`, {
    method: "PATCH",
    body: JSON.stringify({ last_synced_at: new Date().toISOString(), sync_error: null }),
  });
  console.log("Done! Refresh /ads page.");
}

main().catch(console.error);
