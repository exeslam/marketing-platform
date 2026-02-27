/**
 * Google Ads API service.
 * Uses google-ads-api to fetch campaigns and metrics via GAQL.
 */

import { GoogleAdsApi } from "google-ads-api";

function getClient() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!clientId || !clientSecret || !developerToken) {
    throw new Error("Google Ads credentials not configured");
  }

  return new GoogleAdsApi({
    client_id: clientId,
    client_secret: clientSecret,
    developer_token: developerToken,
  });
}

function getCustomer(customerId: string) {
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("GOOGLE_ADS_REFRESH_TOKEN not configured");

  const client = getClient();
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  return client.Customer({
    customer_id: customerId.replace(/-/g, ""),
    refresh_token: refreshToken,
    ...(loginCustomerId ? { login_customer_id: loginCustomerId.replace(/-/g, "") } : {}),
  });
}

export interface GoogleCampaignResult {
  id: string;
  name: string;
  status: string;
  budgetMicros: number;
}

export interface GoogleMetricResult {
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  ctr: number;
  cpcMicros: number;
  conversions: number;
  conversionsValue: number;
  videoViews: number;
}

const STATUS_MAP: Record<number, string> = {
  0: "unspecified",
  1: "unknown",
  2: "enabled",
  3: "paused",
  4: "removed",
};

/** Fetch all active campaigns */
export async function fetchGoogleCampaigns(
  customerId: string
): Promise<GoogleCampaignResult[]> {
  const customer = getCustomer(customerId);

  const results = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `);

  return results.map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const campaign = r.campaign as { id: number; name: string; status: number };
    const budget = r.campaign_budget as { amount_micros: number } | undefined;
    return {
      id: String(campaign.id),
      name: campaign.name,
      status: STATUS_MAP[campaign.status] ?? "unknown",
      budgetMicros: budget?.amount_micros ?? 0,
    };
  });
}

/** Fetch daily metrics for all campaigns in a date range */
export async function fetchGoogleMetrics(
  customerId: string,
  dateFrom: string,
  dateTo: string
): Promise<GoogleMetricResult[]> {
  const customer = getCustomer(customerId);

  const results = await customer.query(`
    SELECT
      campaign.id,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.conversions_value,
      metrics.video_views
    FROM campaign
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
      AND campaign.status != 'REMOVED'
  `);

  return results.map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const campaign = r.campaign as { id: number };
    const segments = r.segments as { date: string };
    const m = r.metrics as {
      impressions: number;
      clicks: number;
      cost_micros: number;
      ctr: number;
      average_cpc: number;
      conversions: number;
      conversions_value: number;
      video_views: number;
    };
    return {
      campaignId: String(campaign.id),
      date: segments.date,
      impressions: m.impressions,
      clicks: m.clicks,
      costMicros: m.cost_micros,
      ctr: m.ctr,
      cpcMicros: m.average_cpc,
      conversions: m.conversions,
      conversionsValue: m.conversions_value,
      videoViews: m.video_views,
    };
  });
}

/** Convert Google Ads micros to KZT */
export function microsToKZT(micros: number): number {
  return Math.round(micros / 1_000_000);
}
