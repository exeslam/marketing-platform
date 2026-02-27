/**
 * Sync orchestrator — pulls data from Meta/Google APIs and upserts into Supabase.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { fetchMetaCampaigns, fetchMetaInsights, normalizeMetaStatus, metaBudgetToKZT } from "./meta";
import { fetchGoogleCampaigns, fetchGoogleMetrics, microsToKZT } from "./google";
import type { SyncResult } from "./types";

/** Sync Meta Ads campaigns and metrics for a project */
export async function syncMetaAds(projectId: string): Promise<SyncResult> {
  const supabase = createAdminClient();
  const result: SyncResult = { platform: "meta", campaignsSynced: 0, metricDaysSynced: 0 };

  try {
    // Get platform connection (account_id stored in ad_platforms)
    const { data: platform } = await supabase
      .from("ad_platforms")
      .select("id, account_id, is_connected")
      .eq("project_id", projectId)
      .eq("platform", "meta")
      .single();

    if (!platform?.is_connected) {
      result.error = "Meta Ads не подключен";
      return result;
    }

    if (!platform.account_id) {
      result.error = "Meta Ad Account ID не указан";
      return result;
    }

    // Fetch campaigns
    const campaigns = await fetchMetaCampaigns(platform.account_id);

    for (const c of campaigns) {
      await supabase.from("ad_campaigns").upsert(
        {
          platform_id: platform.id,
          project_id: projectId,
          external_id: c.id,
          name: c.name,
          status: normalizeMetaStatus(c.status),
          objective: c.objective,
          daily_budget_kzt: metaBudgetToKZT(c.daily_budget),
          lifetime_budget_kzt: metaBudgetToKZT(c.lifetime_budget),
          start_date: c.start_time ? c.start_time.split("T")[0] : null,
          end_date: c.stop_time ? c.stop_time.split("T")[0] : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform_id,external_id" }
      );
      result.campaignsSynced++;
    }

    // Fetch insights for last 7 days
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const dateFrom = weekAgo.toISOString().split("T")[0];
    const dateTo = today.toISOString().split("T")[0];

    // Get our campaign IDs mapped to external IDs
    const { data: dbCampaigns } = await supabase
      .from("ad_campaigns")
      .select("id, external_id")
      .eq("platform_id", platform.id);

    const campaignMap = new Map(
      (dbCampaigns ?? []).map((c: { id: string; external_id: string }) => [c.external_id, c.id])
    );

    for (const c of campaigns) {
      const dbCampaignId = campaignMap.get(c.id);
      if (!dbCampaignId) continue;

      try {
        const insights = await fetchMetaInsights(c.id, dateFrom, dateTo);

        for (const row of insights) {
          await supabase.from("ad_metrics_daily").upsert(
            {
              campaign_id: dbCampaignId,
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
              video_views: Number(row.video_views) || 0,
              frequency: Number(row.frequency) || 0,
              conversions: 0,
              link_clicks: 0,
              conversion_value_kzt: 0,
              cost_per_conversion_kzt: 0,
              likes: 0,
              comments: 0,
              shares: 0,
            },
            { onConflict: "campaign_id,date" }
          );
          result.metricDaysSynced++;
        }
      } catch {
        // Skip failed campaign insights, continue with others
      }
    }

    // Update last synced
    await supabase
      .from("ad_platforms")
      .update({ last_synced_at: new Date().toISOString(), sync_error: null })
      .eq("id", platform.id);

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
    result.error = msg;

    // Store error
    await supabase
      .from("ad_platforms")
      .update({ sync_error: msg })
      .eq("project_id", projectId)
      .eq("platform", "meta");

    return result;
  }
}

/** Sync Google Ads campaigns and metrics for a project */
export async function syncGoogleAds(projectId: string): Promise<SyncResult> {
  const supabase = createAdminClient();
  const result: SyncResult = { platform: "google", campaignsSynced: 0, metricDaysSynced: 0 };

  try {
    const { data: platform } = await supabase
      .from("ad_platforms")
      .select("id, account_id, is_connected")
      .eq("project_id", projectId)
      .eq("platform", "google")
      .single();

    if (!platform?.is_connected) {
      result.error = "Google Ads не подключен";
      return result;
    }

    if (!platform.account_id) {
      result.error = "Google Ads Customer ID не указан";
      return result;
    }

    // Fetch campaigns
    const campaigns = await fetchGoogleCampaigns(platform.account_id);

    for (const c of campaigns) {
      await supabase.from("ad_campaigns").upsert(
        {
          platform_id: platform.id,
          project_id: projectId,
          external_id: c.id,
          name: c.name,
          status: c.status,
          objective: null,
          daily_budget_kzt: microsToKZT(c.budgetMicros),
          lifetime_budget_kzt: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform_id,external_id" }
      );
      result.campaignsSynced++;
    }

    // Fetch metrics for last 7 days
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const dateFrom = weekAgo.toISOString().split("T")[0];
    const dateTo = today.toISOString().split("T")[0];

    const { data: dbCampaigns } = await supabase
      .from("ad_campaigns")
      .select("id, external_id")
      .eq("platform_id", platform.id);

    const campaignMap = new Map(
      (dbCampaigns ?? []).map((c: { id: string; external_id: string }) => [c.external_id, c.id])
    );

    const metrics = await fetchGoogleMetrics(
      platform.account_id,
      dateFrom,
      dateTo
    );

    for (const m of metrics) {
      const dbCampaignId = campaignMap.get(m.campaignId);
      if (!dbCampaignId) continue;

      await supabase.from("ad_metrics_daily").upsert(
        {
          campaign_id: dbCampaignId,
          project_id: projectId,
          platform: "google",
          date: m.date,
          impressions: m.impressions,
          clicks: m.clicks,
          spend_kzt: microsToKZT(m.costMicros),
          ctr: m.ctr,
          cpc_kzt: microsToKZT(m.cpcMicros),
          conversions: m.conversions,
          conversion_value_kzt: Math.round(m.conversionsValue),
          video_views: m.videoViews,
          reach: 0,
          link_clicks: 0,
          cpm_kzt: 0,
          cost_per_conversion_kzt: m.conversions > 0 ? microsToKZT(m.costMicros) / m.conversions : 0,
          likes: 0,
          comments: 0,
          shares: 0,
          frequency: 0,
        },
        { onConflict: "campaign_id,date" }
      );
      result.metricDaysSynced++;
    }

    await supabase
      .from("ad_platforms")
      .update({ last_synced_at: new Date().toISOString(), sync_error: null })
      .eq("id", platform.id);

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
    result.error = msg;

    await supabase
      .from("ad_platforms")
      .update({ sync_error: msg })
      .eq("project_id", projectId)
      .eq("platform", "google");

    return result;
  }
}

/** Sync all connected platforms for a project */
export async function syncAllPlatforms(projectId: string): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  results.push(await syncMetaAds(projectId));
  results.push(await syncGoogleAds(projectId));
  return results;
}
