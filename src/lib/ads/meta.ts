/**
 * Meta (Facebook/Instagram) Ads API service.
 * Uses facebook-nodejs-business-sdk to fetch campaigns and insights.
 */

import type { MetaCampaignRaw, MetaInsightRow } from "./types";

const API_VERSION = "v21.0";

function getBaseUrl() {
  return `https://graph.facebook.com/${API_VERSION}`;
}

function getToken() {
  const token = process.env.META_AD_ACCESS_TOKEN;
  if (!token) throw new Error("META_AD_ACCESS_TOKEN not configured");
  return token;
}

/** Fetch all campaigns for an ad account */
export async function fetchMetaCampaigns(
  adAccountId: string
): Promise<MetaCampaignRaw[]> {
  const url = `${getBaseUrl()}/act_${adAccountId.replace("act_", "")}/campaigns`;
  const params = new URLSearchParams({
    fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
    limit: "100",
    access_token: getToken(),
  });

  const res = await fetch(`${url}?${params}`);
  const json = await res.json();

  if (json.error) {
    throw new Error(`Meta API: ${json.error.message}`);
  }

  return (json.data ?? []) as MetaCampaignRaw[];
}

/** Fetch daily insights for a campaign */
export async function fetchMetaInsights(
  campaignId: string,
  dateFrom: string,
  dateTo: string
): Promise<MetaInsightRow[]> {
  const url = `${getBaseUrl()}/${campaignId}/insights`;
  const params = new URLSearchParams({
    fields: "impressions,reach,clicks,spend,ctr,cpc,cpm,actions,video_views,frequency",
    time_increment: "1",
    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
    access_token: getToken(),
  });

  const res = await fetch(`${url}?${params}`);
  const json = await res.json();

  if (json.error) {
    throw new Error(`Meta API: ${json.error.message}`);
  }

  return (json.data ?? []) as MetaInsightRow[];
}

/** Map Meta status strings to lowercase */
export function normalizeMetaStatus(status: string): string {
  return status.toLowerCase();
}

/** Meta budgets are in cents — convert to whole units */
export function metaBudgetToKZT(cents: string | undefined): number | null {
  if (!cents) return null;
  return Math.round(Number(cents) / 100);
}
