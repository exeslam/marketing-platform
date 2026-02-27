"use client";

import { useState } from "react";
import type { AdCampaign, AdMetricsDaily, AdPlatformConnection, Project } from "@/types/database";
import { CampaignsTable } from "./campaigns-table";
import { PlatformComparison } from "./platform-comparison";
import { exportToCSV } from "@/lib/export-csv";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Target,
  Users,
  Download,
  RefreshCw,
} from "lucide-react";

interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgCPC: number;
  totalReach: number;
}

export interface CampaignMetricsSummary {
  spend: number;
  leads: number;
  costPerLead: number;
  clicks: number;
  impressions: number;
}

interface Props {
  campaigns: AdCampaign[];
  aggregated: AggregatedMetrics | null;
  dailyMetrics: AdMetricsDaily[];
  connections: AdPlatformConnection[];
  projects: Project[];
  currentMonth: string;
  campaignMetrics: Record<string, CampaignMetricsSummary>;
}

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));
const fmtDec = (n: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);

export function AdsView({ campaigns, aggregated, dailyMetrics, connections, projects, currentMonth, campaignMetrics }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Get project IDs that have connections
  const projectsWithAds = projects.filter((p) =>
    connections.some((c) => c.project_id === p.id)
  );

  // Filter campaigns by project
  const projectCampaigns =
    projectFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.project_id === projectFilter);

  // Filter by tag
  const filteredCampaigns =
    tagFilter === "all"
      ? projectCampaigns
      : projectCampaigns.filter((c) => c.tags?.includes(tagFilter));

  // Collect all tags
  const allTags = [...new Set(campaigns.flatMap((c) => c.tags ?? []))].sort();

  // Filter daily metrics by project
  const filteredMetrics =
    projectFilter === "all"
      ? dailyMetrics
      : dailyMetrics.filter((m) => m.project_id === projectFilter);

  // Compute KPIs from filtered metrics
  const kpi = filteredMetrics.length > 0
    ? {
        totalSpend: filteredMetrics.reduce((s, r) => s + Number(r.spend_kzt), 0),
        totalImpressions: filteredMetrics.reduce((s, r) => s + Number(r.impressions), 0),
        totalClicks: filteredMetrics.reduce((s, r) => s + Number(r.clicks), 0),
        totalConversions: filteredMetrics.reduce((s, r) => s + Number(r.conversions), 0),
        avgCTR: filteredMetrics.reduce((s, r) => s + Number(r.ctr), 0) / filteredMetrics.length,
        avgCPC: filteredMetrics.reduce((s, r) => s + Number(r.cpc_kzt), 0) / filteredMetrics.length,
        totalReach: filteredMetrics.reduce((s, r) => s + Number(r.reach), 0),
      }
    : aggregated;

  async function handleSync() {
    setSyncing(true);
    try {
      const projectId = projectFilter !== "all" ? projectFilter : connections[0]?.project_id;
      if (!projectId) return;
      await fetch("/api/ads/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  }

  function handleExport() {
    if (!kpi) return;
    const headers = ["Метрика", "Значение"];
    const rows = [
      ["Расход", `$${fmtDec(kpi.totalSpend)}`],
      ["Показы", fmt(kpi.totalImpressions)],
      ["Клики", fmt(kpi.totalClicks)],
      ["CTR", `${kpi.avgCTR.toFixed(2)}%`],
      ["CPC", `$${fmtDec(kpi.avgCPC)}`],
      ["Конверсии", fmt(kpi.totalConversions)],
      ["Охват", fmt(kpi.totalReach)],
    ];
    exportToCSV(`ads-report-${currentMonth}`, headers, rows);
  }

  const kpiCards = [
    { label: "Расход", value: kpi ? `$${fmtDec(kpi.totalSpend)}` : "—", icon: DollarSign, color: "text-red-500" },
    { label: "Показы", value: kpi ? fmt(kpi.totalImpressions) : "—", icon: Eye, color: "text-blue-500" },
    { label: "Клики", value: kpi ? fmt(kpi.totalClicks) : "—", icon: MousePointerClick, color: "text-green-500" },
    { label: "CTR", value: kpi ? `${kpi.avgCTR.toFixed(2)}%` : "—", icon: TrendingUp, color: "text-purple-500" },
    { label: "CPC", value: kpi ? `$${fmtDec(kpi.avgCPC)}` : "—", icon: DollarSign, color: "text-orange-500" },
    { label: "Конверсии", value: kpi ? fmt(kpi.totalConversions) : "—", icon: Target, color: "text-emerald-500" },
    { label: "Охват", value: kpi ? fmt(kpi.totalReach) : "—", icon: Users, color: "text-sky-500" },
  ];

  const hasConnections = connections.some((c) => c.is_connected);

  if (!hasConnections && campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-[var(--muted)] p-4">
          <TrendingUp className="h-8 w-8 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Нет подключённых платформ</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Подключите Meta Ads или Google Ads в{" "}
          <a href="/settings/integrations" className="text-primary underline">
            настройках интеграций
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">
            {new Date(currentMonth + "-01").toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
          </h2>

          {/* Project filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
          >
            <option value="all">Все проекты</option>
            {projectsWithAds.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
            >
              <option value="all">Все теги</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={!kpi}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Синхронизировать
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-[var(--card)] p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-[var(--muted-foreground)]">
                {card.label}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <PlatformComparison
        dailyMetrics={filteredMetrics}
        connections={connections}
      />

      {/* Campaigns table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Кампании ({filteredCampaigns.length})</h3>
        </div>
        <CampaignsTable campaigns={filteredCampaigns} campaignMetrics={campaignMetrics} />
      </div>
    </div>
  );
}
