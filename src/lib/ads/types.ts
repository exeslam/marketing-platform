/** Raw response types from Meta Marketing API */
export interface MetaCampaignRaw {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaInsightRow {
  date_start: string;
  date_stop: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions?: Array<{ action_type: string; value: string }>;
  video_views?: string;
  frequency?: string;
}

/** Raw response types from Google Ads API */
export interface GoogleCampaignRow {
  campaign: {
    resource_name: string;
    id: number;
    name: string;
    status: number;
  };
  campaign_budget?: {
    amount_micros: number;
  };
}

export interface GoogleMetricRow {
  campaign: { id: number };
  segments: { date: string };
  metrics: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    ctr: number;
    average_cpc: number;
    conversions: number;
    conversions_value: number;
    video_views: number;
  };
}

/** Sync operation result */
export interface SyncResult {
  platform: "meta" | "google";
  campaignsSynced: number;
  metricDaysSynced: number;
  error?: string;
}
