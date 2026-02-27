"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  School,
  GraduationCap,
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  Users,
  BarChart3,
  Calendar,
  CheckSquare,
  Wallet,
  Settings,
  Instagram,
  Facebook,
  Pencil,
} from "lucide-react";
import { cn, formatKZT, getInitials } from "@/lib/utils";
import type { Project, ProjectMember, BudgetRecord } from "@/types/database";

const channelLabels: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  influencer: "Инфлюенсеры",
  seo: "SEO",
  email: "Email",
  other: "Другое",
};

const roleLabels: Record<string, string> = {
  lead: "Руководитель",
  member: "Участник",
  viewer: "Наблюдатель",
};

const tabs = [
  { key: "overview", label: "Обзор", icon: BarChart3 },
  { key: "team", label: "Команда", icon: Users },
  { key: "tasks", label: "Задачи", icon: CheckSquare },
  { key: "content", label: "Контент", icon: Calendar },
  { key: "budget", label: "Бюджет", icon: Wallet },
  { key: "settings", label: "Настройки", icon: Settings },
];

function ProjectIcon({ type }: { type: string }) {
  if (type === "university") return <GraduationCap className="h-7 w-7" />;
  if (type === "college") return <Building2 className="h-7 w-7" />;
  return <School className="h-7 w-7" />;
}

export function ProjectDetail({
  project,
  members,
  budgetRecords,
  currentSpend,
}: {
  project: Project;
  members: ProjectMember[];
  budgetRecords: BudgetRecord[];
  currentSpend: number;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const budgetPct =
    project.monthly_budget_kzt > 0
      ? Math.round((currentSpend / project.monthly_budget_kzt) * 100)
      : 0;

  const totalPlanned = budgetRecords.reduce(
    (s, r) => s + Number(r.planned_budget_kzt),
    0
  );

  return (
    <div className="p-4 md:p-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Все проекты
      </Link>

      {/* Project Header Card */}
      <div className="mb-6 rounded-xl bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: project.color }}
            >
              <ProjectIcon type={project.type} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                {project.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.city}
                  </span>
                )}
                {project.website_url && (
                  <a
                    href={project.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Сайт
                  </a>
                )}
                {project.instagram_url && (
                  <a
                    href={project.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram
                  </a>
                )}
                {project.facebook_url && (
                  <a
                    href={project.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Facebook className="h-3.5 w-3.5" />
                    Facebook
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Edit button */}
            <Link
              href={`/projects/${project.id}/edit`}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-[var(--muted)]"
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </Link>

          {/* Budget indicator */}
          <div className="text-right">
            <p className="text-2xl font-bold">{budgetPct}%</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {formatKZT(currentSpend)} / {formatKZT(project.monthly_budget_kzt)}
            </p>
            <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(budgetPct, 100)}%`,
                  backgroundColor:
                    budgetPct > 80 ? "#EF4444" : project.color,
                }}
              />
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-[var(--card)] p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.key
                ? "bg-primary text-white"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
            <h3 className="mb-4 font-semibold">Контактная информация</h3>
            <div className="space-y-3">
              {project.contact_person && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <span>{project.contact_person}</span>
                </div>
              )}
              {project.contact_phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <span>{project.contact_phone}</span>
                </div>
              )}
              {project.contact_email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <span>{project.contact_email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
            <h3 className="mb-4 font-semibold">О проекте</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {project.description || "Описание не указано"}
            </p>
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Команда проекта ({members.length})</h3>
          </div>
          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              Участники не добавлены
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(m.profile?.full_name || "?")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {m.profile?.full_name || "—"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {m.profile?.position || m.profile?.email || "—"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      m.role_in_project === "lead"
                        ? "bg-primary/10 text-primary"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    )}
                  >
                    {roleLabels[m.role_in_project] || m.role_in_project}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "budget" && (
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Бюджет за февраль 2026</h3>
          {budgetRecords.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              Данные по бюджету отсутствуют
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">
                      Канал
                    </th>
                    <th className="pb-3 text-right font-medium text-[var(--muted-foreground)]">
                      План
                    </th>
                    <th className="pb-3 text-right font-medium text-[var(--muted-foreground)]">
                      Факт
                    </th>
                    <th className="pb-3 text-right font-medium text-[var(--muted-foreground)]">
                      %
                    </th>
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">
                      Прогресс
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRecords.map((row) => {
                    const planned = Number(row.planned_budget_kzt);
                    const actual = Number(row.actual_spend_kzt);
                    const pct =
                      planned > 0 ? Math.round((actual / planned) * 100) : 0;
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">
                          {channelLabels[row.channel] || row.channel}
                        </td>
                        <td className="py-3 text-right">{formatKZT(planned)}</td>
                        <td className="py-3 text-right">{formatKZT(actual)}</td>
                        <td className="py-3 text-right">{pct}%</td>
                        <td className="py-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--muted)]">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="pt-3">Итого</td>
                    <td className="pt-3 text-right">{formatKZT(totalPlanned)}</td>
                    <td className="pt-3 text-right">{formatKZT(currentSpend)}</td>
                    <td className="pt-3 text-right">{budgetPct}%</td>
                    <td className="pt-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="rounded-xl bg-[var(--card)] p-10 text-center shadow-sm">
          <CheckSquare className="mx-auto mb-3 h-12 w-12 text-[var(--muted-foreground)]" />
          <h3 className="mb-1 text-lg font-semibold">Задачи проекта</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Перейдите на страницу{" "}
            <Link href="/tasks" className="text-primary hover:underline">
              Задачи
            </Link>{" "}
            для управления задачами
          </p>
        </div>
      )}

      {activeTab === "content" && (
        <div className="rounded-xl bg-[var(--card)] p-10 text-center shadow-sm">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-[var(--muted-foreground)]" />
          <h3 className="mb-1 text-lg font-semibold">Контент-план</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Перейдите на страницу{" "}
            <Link href="/content" className="text-primary hover:underline">
              Контент
            </Link>{" "}
            для управления публикациями
          </p>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="rounded-xl bg-[var(--card)] p-10 text-center shadow-sm">
          <Settings className="mx-auto mb-3 h-12 w-12 text-[var(--muted-foreground)]" />
          <h3 className="mb-1 text-lg font-semibold">Настройки проекта</h3>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Редактирование проекта и подключение рекламных кабинетов
          </p>
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Pencil className="h-4 w-4" />
            Редактировать проект
          </Link>
        </div>
      )}
    </div>
  );
}
