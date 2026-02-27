"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  School,
  GraduationCap,
  Building2,
  Users,
  MoreVertical,
  MapPin,
} from "lucide-react";
import { cn, formatKZT, getProjectTypeLabel } from "@/lib/utils";
import type { Project } from "@/types/database";

type ProjectWithStats = Project & {
  memberCount: number;
  currentSpend: number;
};

function ProjectTypeIcon({ type }: { type: string }) {
  if (type === "university") return <GraduationCap className="h-5 w-5" />;
  if (type === "college") return <Building2 className="h-5 w-5" />;
  return <School className="h-5 w-5" />;
}

export function ProjectsList({ projects }: { projects: ProjectWithStats[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all" ? projects : projects.filter((p) => p.type === filter);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "Все" },
            { key: "school", label: "Школы" },
            { key: "university", label: "Университеты" },
            { key: "college", label: "Колледжи" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-white"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Link
          href="/projects/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить проект
        </Link>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
            <School className="h-8 w-8 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">Нет проектов</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Создайте первый проект для начала работы
          </p>
        </div>
      )}

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => {
          const budgetPct =
            project.monthly_budget_kzt > 0
              ? Math.round(
                  (project.currentSpend / project.monthly_budget_kzt) * 100
                )
              : 0;
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group rounded-xl bg-[var(--card)] p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    <ProjectTypeIcon type={project.type} />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-tight group-hover:text-primary">
                      {project.short_name || project.name}
                    </h3>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {getProjectTypeLabel(project.type)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="rounded p-1 opacity-0 transition-opacity hover:bg-[var(--muted)] group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
                </button>
              </div>

              {/* City */}
              {project.city && (
                <div className="mb-3 flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.city}
                </div>
              )}

              {/* Stats */}
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{project.memberCount}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    В команде
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{budgetPct}%</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Бюджет
                  </p>
                </div>
              </div>

              {/* Budget Bar */}
              <div>
                <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
                  <span>{formatKZT(project.currentSpend)}</span>
                  <span>{formatKZT(project.monthly_budget_kzt)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(budgetPct, 100)}%`,
                      backgroundColor:
                        budgetPct > 80 ? "#EF4444" : project.color,
                    }}
                  />
                </div>
              </div>

              {/* Team avatars */}
              <div className="mt-3 flex items-center gap-1">
                <Users className="mr-1 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                {Array.from({
                  length: Math.min(project.memberCount, 3),
                }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {project.memberCount > 3 && (
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    +{project.memberCount - 3}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
