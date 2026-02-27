"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  ClipboardList,
  Percent,
  FolderKanban,
  Megaphone,
  PiggyBank,
} from "lucide-react";
import { Download } from "lucide-react";
import { cn, formatKZT, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-csv";
import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/ui/kpi-card";
import type { BudgetChannel } from "@/types/database";

// ── Channel labels ─────────────────────────────────────────────────
const CHANNEL_LABELS: Record<BudgetChannel, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  influencer: "Инфлюенсеры",
  seo: "SEO",
  email: "Email",
  other: "Другое",
};

const CHANNEL_COLORS: Record<BudgetChannel, string> = {
  meta_ads: "#3b82f6",
  google_ads: "#22c55e",
  influencer: "#f59e0b",
  seo: "#8b5cf6",
  email: "#ec4899",
  other: "#6b7280",
};

// ── Types for props ────────────────────────────────────────────────
interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  shortName: string;
  color: string;
  planned: number;
  actual: number;
  usagePercent: number;
}

interface ChannelBreakdown {
  channel: BudgetChannel;
  planned: number;
  actual: number;
  usagePercent: number;
}

interface AnalyticsViewProps {
  totalSpend: number;
  totalPlanned: number;
  budgetUsagePercent: number;
  remainingBudget: number;
  projectCount: number;
  topChannelName: string;
  topChannelSpend: number;
  perProjectBreakdown: ProjectBreakdown[];
  channelBreakdown: ChannelBreakdown[];
  currentMonth: string;
}

// ── Custom Tooltip for Recharts ────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-[var(--card)] p-3 shadow-lg">
      <p className="mb-1 text-sm font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatKZT(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function AnalyticsView({
  totalSpend,
  totalPlanned,
  budgetUsagePercent,
  remainingBudget,
  projectCount,
  topChannelName,
  topChannelSpend,
  perProjectBreakdown,
  channelBreakdown,
  currentMonth,
}: AnalyticsViewProps) {
  const monthLabel = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date(currentMonth));

  // Prepare chart data for Recharts
  const chartData = perProjectBreakdown.map((p) => ({
    name: p.shortName,
    "Факт": p.actual,
    "План": p.planned,
  }));

  return (
    <div>
      <Topbar title="Аналитика бюджета" />

      <div className="p-4 md:p-6">
        {/* Month label + export */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Данные за: <span className="font-medium capitalize">{monthLabel}</span>
          </p>
          <button
            onClick={() => {
              const headers = ["Проект", "Факт (KZT)", "План (KZT)", "Использовано (%)"];
              const rows = perProjectBreakdown.map((p) => [
                p.projectName,
                String(p.actual),
                String(p.planned),
                p.planned > 0 ? String(Math.round((p.actual / p.planned) * 100)) : "0",
              ]);
              rows.push(["ИТОГО", String(totalSpend), String(totalPlanned), String(budgetUsagePercent)]);
              exportToCSV(`budget-${currentMonth}`, headers, rows);
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Общий расход"
            value={formatKZT(totalSpend)}
            icon={Wallet}
            iconColor="bg-blue-500/10 text-blue-500"
          />
          <KpiCard
            title="Запланировано"
            value={formatKZT(totalPlanned)}
            icon={ClipboardList}
            iconColor="bg-violet-500/10 text-violet-500"
          />
          <KpiCard
            title="Использование"
            value={`${budgetUsagePercent}%`}
            change={
              budgetUsagePercent > 90
                ? "Бюджет почти исчерпан"
                : budgetUsagePercent > 70
                  ? "Расход выше среднего"
                  : "В пределах нормы"
            }
            changeType={
              budgetUsagePercent > 90
                ? "negative"
                : budgetUsagePercent > 70
                  ? "neutral"
                  : "positive"
            }
            icon={Percent}
            iconColor="bg-amber-500/10 text-amber-500"
          />
          <KpiCard
            title="Проектов"
            value={String(projectCount)}
            icon={FolderKanban}
            iconColor="bg-green-500/10 text-green-500"
          />
          <KpiCard
            title="Топ канал"
            value={CHANNEL_LABELS[topChannelName as BudgetChannel] ?? topChannelName}
            change={topChannelSpend > 0 ? formatKZT(topChannelSpend) : undefined}
            changeType="neutral"
            icon={Megaphone}
            iconColor="bg-pink-500/10 text-pink-500"
          />
          <KpiCard
            title="Остаток"
            value={formatKZT(remainingBudget)}
            change={
              remainingBudget < 0 ? "Перерасход!" : undefined
            }
            changeType={remainingBudget < 0 ? "negative" : "positive"}
            icon={PiggyBank}
            iconColor="bg-emerald-500/10 text-emerald-500"
          />
        </div>

        {/* ── Recharts Bar Chart: Spend per Project ──────────────── */}
        <div className="mb-6 rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Расходы по проектам</h3>
          {chartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatNumber(v)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="План"
                    fill="#a78bfa"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                  <Bar
                    dataKey="Факт"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-sm text-[var(--muted-foreground)]">
              Нет данных о бюджете за текущий месяц
            </div>
          )}
        </div>

        {/* ── Project Budget Breakdown Table ──────────────────────── */}
        <div className="mb-6 rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Бюджет по проектам</h3>
          {perProjectBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">
                      Проект
                    </th>
                    <th className="pb-3 text-right font-medium text-[var(--muted-foreground)]">
                      План
                    </th>
                    <th className="pb-3 text-right font-medium text-[var(--muted-foreground)]">
                      Факт
                    </th>
                    <th className="pb-3 text-right font-medium text-[var(--muted-foreground)]">
                      % исп.
                    </th>
                    <th className="pb-3 pl-4 font-medium text-[var(--muted-foreground)]">
                      Прогресс
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {perProjectBreakdown.map((p) => (
                    <tr
                      key={p.projectId}
                      className="border-b last:border-0 hover:bg-[var(--muted)]"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="font-medium">{p.projectName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">{formatKZT(p.planned)}</td>
                      <td className="py-3 text-right">{formatKZT(p.actual)}</td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            p.usagePercent > 100
                              ? "text-error"
                              : p.usagePercent > 80
                                ? "text-amber-500"
                                : "text-success"
                          )}
                        >
                          {p.usagePercent}%
                        </span>
                      </td>
                      <td className="py-3 pl-4">
                        <div className="h-2 w-full min-w-[120px] overflow-hidden rounded-full bg-[var(--muted)]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              p.usagePercent > 100
                                ? "bg-error"
                                : p.usagePercent > 80
                                  ? "bg-amber-500"
                                  : "bg-success"
                            )}
                            style={{
                              width: `${Math.min(p.usagePercent, 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              Нет данных о бюджете проектов
            </p>
          )}
        </div>

        {/* ── Channel Breakdown Section ──────────────────────────── */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Расходы по каналам</h3>
          {channelBreakdown.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channelBreakdown.map((ch) => {
                const label = CHANNEL_LABELS[ch.channel] ?? ch.channel;
                const color = CHANNEL_COLORS[ch.channel] ?? "#6b7280";
                return (
                  <div
                    key={ch.channel}
                    className="rounded-lg border p-4 transition-colors hover:bg-[var(--muted)]"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </div>

                    <div className="mb-2 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Факт
                        </p>
                        <p className="text-lg font-bold">
                          {formatKZT(ch.actual)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          План
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {formatKZT(ch.planned)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(ch.usagePercent, 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <p className="text-right text-xs text-[var(--muted-foreground)]">
                      {ch.usagePercent}% использовано
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              Нет данных по каналам
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
