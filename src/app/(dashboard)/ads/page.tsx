import { Topbar } from "@/components/layout/topbar";
import {
  getAdCampaigns,
  getAggregatedMetrics,
  getAdMetrics,
  getAdPlatformConnections,
  getProjects,
  getCampaignMetricsSummary,
} from "@/lib/supabase/queries";
import { AdsView } from "./ads-view";

export default async function AdsPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const from = `${currentMonth}-01`;
  const [year, month] = currentMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${currentMonth}-${String(lastDay).padStart(2, "0")}`;

  const [campaigns, metrics, dailyMetrics, connections, projects] = await Promise.all([
    getAdCampaigns(),
    getAggregatedMetrics(undefined, currentMonth),
    getAdMetrics({ from, to }),
    getAdPlatformConnections(),
    getProjects(),
  ]);

  // Get per-campaign metrics summary (spend, leads, cost per lead)
  const campaignIds = campaigns.map((c) => c.id);
  const campaignMetrics = await getCampaignMetricsSummary(campaignIds);

  return (
    <div>
      <Topbar title="Реклама" />
      <div className="p-4 md:p-6">
        <AdsView
          campaigns={campaigns}
          aggregated={metrics}
          dailyMetrics={dailyMetrics}
          connections={connections}
          projects={projects}
          currentMonth={currentMonth}
          campaignMetrics={campaignMetrics}
        />
      </div>
    </div>
  );
}
