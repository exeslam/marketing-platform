"use client";

import { useState, useTransition } from "react";
import type { AdCampaign } from "@/types/database";
import type { CampaignMetricsSummary } from "./ads-view";
import { updateCampaignTagsAction } from "@/lib/actions";
import { Plus, X } from "lucide-react";

interface Props {
  campaigns: AdCampaign[];
  campaignMetrics: Record<string, CampaignMetricsSummary>;
}

const fmt = (n: number | null) =>
  n != null ? new Intl.NumberFormat("ru-RU").format(Math.round(n)) : "—";

const fmtDec = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  enabled: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  removed: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const TAG_COLORS: Record<string, string> = {
  "лиды": "bg-blue-100 text-blue-700",
  "трафик": "bg-green-100 text-green-700",
  "бренд": "bg-purple-100 text-purple-700",
  "ретаргет": "bg-orange-100 text-orange-700",
  "видео": "bg-pink-100 text-pink-700",
  "конверсии": "bg-emerald-100 text-emerald-700",
  "вовлечённость": "bg-sky-100 text-sky-700",
  "сообщения": "bg-indigo-100 text-indigo-700",
};

const SUGGESTED_TAGS = ["лиды", "трафик", "бренд", "ретаргет", "видео", "конверсии", "вовлечённость", "сообщения"];

function TagEditor({ campaign }: { campaign: AdCampaign }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const tags = campaign.tags ?? [];

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    const updated = [...tags, trimmed];
    startTransition(async () => {
      await updateCampaignTagsAction(campaign.id, updated);
    });
    setNewTag("");
  }

  function removeTag(tag: string) {
    const updated = tags.filter((t) => t !== tag);
    startTransition(async () => {
      await updateCampaignTagsAction(campaign.id, updated);
    });
  }

  const unusedSuggestions = SUGGESTED_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-700"}`}
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="ml-0.5 hover:opacity-70"
            disabled={isPending}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {open ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { addTag(newTag); setOpen(false); }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="тег..."
            className="w-20 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px]"
            autoFocus
          />
          {unusedSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {unusedSuggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => { addTag(s); setOpen(false); }}
                  className="rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[10px] hover:bg-[var(--muted)]/80"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center rounded-full bg-[var(--muted)] p-0.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
          title="Добавить тег"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function CampaignsTable({ campaigns, campaignMetrics }: Props) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)] shadow-sm">
        Нет кампаний. Синхронизируйте данные с рекламных платформ.
      </div>
    );
  }

  // Sort: campaigns with most spend first
  const sorted = [...campaigns].sort((a, b) => {
    const aSpend = campaignMetrics[a.id]?.spend ?? 0;
    const bSpend = campaignMetrics[b.id]?.spend ?? 0;
    return bSpend - aSpend;
  });

  return (
    <div className="overflow-x-auto rounded-xl bg-[var(--card)] shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
              Название
            </th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
              Период
            </th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
              Статус
            </th>
            <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
              Теги
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">
              Расход
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">
              Показы
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">
              Клики
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">
              Лиды
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">
              Цена лида
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">
              Бюджет/день
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const m = campaignMetrics[c.id];
            return (
              <tr
                key={c.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50"
              >
                <td className="max-w-[250px] truncate px-4 py-3 font-medium" title={c.name}>
                  {c.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {c.start_date
                    ? `${new Date(c.start_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })}${c.end_date ? ` — ${new Date(c.end_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })}` : " — ..."}`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusColors[c.status ?? ""] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.status ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <TagEditor campaign={c} />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {m?.spend ? `$${fmtDec(m.spend)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">
                  {m?.impressions ? fmt(m.impressions) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">
                  {m?.clicks ? fmt(m.clicks) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={m?.leads ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                    {m?.leads ? fmt(m.leads) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={m?.costPerLead ? "font-semibold" : ""}>
                    {m?.costPerLead ? `$${fmtDec(m.costPerLead)}` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.daily_budget_kzt ? `$${fmt(c.daily_budget_kzt)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
