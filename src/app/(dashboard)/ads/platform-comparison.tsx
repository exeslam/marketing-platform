"use client";

import type { AdMetricsDaily, AdPlatformConnection } from "@/types/database";

interface Props {
  dailyMetrics: AdMetricsDaily[];
  connections: AdPlatformConnection[];
}

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

export function PlatformComparison({ dailyMetrics, connections }: Props) {
  if (dailyMetrics.length === 0) {
    return null;
  }

  // Group metrics by platform
  const byPlatform: Record<string, AdMetricsDaily[]> = {};
  for (const m of dailyMetrics) {
    const key = m.platform ?? "unknown";
    if (!byPlatform[key]) byPlatform[key] = [];
    byPlatform[key].push(m);
  }

  const platforms = Object.entries(byPlatform).map(([platform, metrics]) => {
    const totalSpend = metrics.reduce((s, r) => s + Number(r.spend_kzt), 0);
    const totalImpressions = metrics.reduce((s, r) => s + Number(r.impressions), 0);
    const totalClicks = metrics.reduce((s, r) => s + Number(r.clicks), 0);
    const totalConversions = metrics.reduce((s, r) => s + Number(r.conversions), 0);
    const totalReach = metrics.reduce((s, r) => s + Number(r.reach), 0);
    const avgCTR = metrics.length > 0 ? metrics.reduce((s, r) => s + Number(r.ctr), 0) / metrics.length : 0;
    const avgCPC = metrics.length > 0 ? metrics.reduce((s, r) => s + Number(r.cpc_kzt), 0) / metrics.length : 0;

    return {
      platform,
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalReach,
      avgCTR,
      avgCPC,
    };
  });

  const platformColors: Record<string, string> = {
    meta: "border-blue-500",
    google: "border-green-500",
    unknown: "border-gray-400",
  };

  const platformNames: Record<string, string> = {
    meta: "Meta Ads",
    google: "Google Ads",
    unknown: "Другое",
  };

  // Also: Daily spend chart (simplified bar chart)
  const dailySpend: Record<string, Record<string, number>> = {};
  for (const m of dailyMetrics) {
    const date = m.date;
    if (!dailySpend[date]) dailySpend[date] = {};
    const plat = m.platform ?? "unknown";
    dailySpend[date][plat] = (dailySpend[date][plat] ?? 0) + Number(m.spend_kzt);
  }

  const dates = Object.keys(dailySpend).sort();
  const maxDaily = Math.max(
    ...dates.map((d) =>
      Object.values(dailySpend[d]).reduce((s, v) => s + v, 0)
    ),
    1
  );

  return (
    <div className="space-y-6">
      {/* Platform cards side by side */}
      {platforms.length > 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((p) => (
            <div
              key={p.platform}
              className={`rounded-xl border-l-4 bg-[var(--card)] p-5 shadow-sm ${
                platformColors[p.platform] ?? "border-gray-400"
              }`}
            >
              <h4 className="font-semibold">
                {platformNames[p.platform] ?? p.platform}
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[var(--muted-foreground)]">Расход</span>
                  <p className="font-bold">{fmt(p.totalSpend)} ₸</p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Показы</span>
                  <p className="font-bold">{fmt(p.totalImpressions)}</p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Клики</span>
                  <p className="font-bold">{fmt(p.totalClicks)}</p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">CTR</span>
                  <p className="font-bold">{p.avgCTR.toFixed(2)}%</p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">CPC</span>
                  <p className="font-bold">{fmt(p.avgCPC)} ₸</p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Конверсии</span>
                  <p className="font-bold">{fmt(p.totalConversions)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple daily spend chart */}
      {dates.length > 1 && (
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h4 className="mb-4 font-semibold">Расход по дням</h4>
          <div className="flex items-end gap-1" style={{ height: 160 }}>
            {dates.map((date) => {
              const total = Object.values(dailySpend[date]).reduce(
                (s, v) => s + v,
                0
              );
              const heightPct = (total / maxDaily) * 100;
              const day = new Date(date).getDate();
              return (
                <div
                  key={date}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  <div
                    className="w-full max-w-[24px] rounded-t bg-primary/80 transition-colors hover:bg-primary"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    title={`${date}: ${fmt(total)} ₸`}
                  />
                  <span className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                    {day}
                  </span>
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--popover)] px-2 py-1 text-[10px] opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    {fmt(total)} ₸
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
