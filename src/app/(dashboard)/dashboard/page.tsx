import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Wallet,
  Eye,
  Megaphone,
  ListChecks,
  CalendarClock,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import {
  getDashboardStats,
  getProjects,
  getProjectSpend,
  getUpcomingDeadlines,
  getRecentActivity,
} from "@/lib/supabase/queries";
import { formatKZT, formatNumber, formatDate } from "@/lib/utils";
import type { Project } from "@/types/database";
import Link from "next/link";

export default async function DashboardPage() {
  // Fetch all data in parallel
  const [stats, activeProjects, projectSpendData, deadlines, activity] =
    await Promise.all([
      getDashboardStats(),
      getProjects({ status: "active" }),
      getProjectSpend(),
      getUpcomingDeadlines(5),
      getRecentActivity(5),
    ]);

  // Build a project lookup map for names and colors
  const projectMap = new Map<string, Project>();
  for (const p of activeProjects) {
    projectMap.set(p.id, p);
  }

  // Merge project spend data with project info
  const spendBars = projectSpendData
    .map((s) => {
      const project = projectMap.get(s.project_id);
      return {
        name: project?.name ?? "Проект",
        color: project?.color ?? "#6366F1",
        spend: s.total_actual,
        budget: s.total_planned,
      };
    })
    .filter((s) => s.budget > 0)
    .sort((a, b) => b.spend - a.spend);

  // Prepare KPI cards
  const kpiCards = [
    {
      title: "Расход за месяц",
      value: formatKZT(stats.totalActualSpend),
      change: stats.totalPlannedBudget > 0
        ? `план ${formatKZT(stats.totalPlannedBudget)}`
        : undefined,
      changeType: "negative" as const,
      icon: Wallet,
      iconColor: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    },
    {
      title: "Всего постов",
      value: formatNumber(stats.totalPosts),
      change: `${stats.scheduledPosts} запланировано`,
      changeType: "positive" as const,
      icon: Eye,
      iconColor: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      title: "Активные проекты",
      value: String(stats.activeProjects),
      change: `${stats.totalTasks} задач всего`,
      changeType: "neutral" as const,
      icon: Megaphone,
      iconColor:
        "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
    {
      title: "Задачи на этой неделе",
      value: String(stats.weekTasks),
      change: stats.overdueTasks > 0
        ? `${stats.overdueTasks} просрочено`
        : "нет просроченных",
      changeType: stats.overdueTasks > 0 ? ("negative" as const) : ("positive" as const),
      icon: ListChecks,
      iconColor:
        "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    },
    {
      title: "Запланированные посты",
      value: String(stats.scheduledPosts),
      change: "на ближайшие 7 дней",
      changeType: "neutral" as const,
      icon: CalendarClock,
      iconColor:
        "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
    },
    {
      title: "Использование бюджета",
      value: `${stats.budgetUsagePercent}%`,
      change: stats.totalPlannedBudget > 0
        ? `до лимита ${formatKZT(stats.totalPlannedBudget)}`
        : "бюджет не задан",
      changeType: "neutral" as const,
      icon: TrendingUp,
      iconColor: "bg-primary/10 text-primary",
    },
  ];

  // Format relative time for activity
  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMin = Math.round((now - then) / 60000);
    if (diffMin < 1) return "только что";
    if (diffMin < 60) return `${diffMin} мин назад`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} дн назад`;
  }

  return (
    <div>
      <Topbar title="Дашборд" />

      <div className="p-4 md:p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpiCards.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Main Grid: Project Spend + Upcoming Deadlines */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Spend by Project -- 2 cols */}
          <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Расход по проектам</h2>
            {spendBars.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Нет данных о бюджете за текущий месяц
              </p>
            ) : (
              <div className="space-y-3">
                {spendBars.map((project) => {
                  const pct =
                    project.budget > 0
                      ? Math.round((project.spend / project.budget) * 100)
                      : 0;
                  return (
                    <div key={project.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-[var(--muted-foreground)]">
                          {formatNumber(project.spend)} /{" "}
                          {formatNumber(project.budget)} ₸
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor:
                              pct > 80 ? "#EF4444" : project.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines -- 1 col */}
          <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Ближайшие дедлайны</h2>
            {deadlines.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Нет предстоящих дедлайнов
              </p>
            ) : (
              <div className="space-y-3">
                {deadlines.map((task) => {
                  const project = projectMap.get(task.project_id);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--muted)]"
                    >
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          task.priority === "urgent"
                            ? "bg-error"
                            : task.priority === "high"
                              ? "bg-warning"
                              : "bg-info"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span>{project?.name ?? "Проект"}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.due_date ? formatDate(task.due_date) : "—"}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed & Quick Actions */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Activity Feed -- 2 cols */}
          <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Последняя активность</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Нет недавней активности
              </p>
            ) : (
              <div className="space-y-3">
                {activity.map((item) => {
                  const user = item.user as
                    | { full_name: string; avatar_url: string | null }
                    | null;
                  const project = item.project as
                    | { name: string; color: string }
                    | null;
                  const userName = user?.full_name ?? "Пользователь";
                  const initial = userName[0] ?? "?";

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--muted)]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <span className="font-medium">{userName}</span>{" "}
                          {item.action}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          {project?.name && <span>{project.name}</span>}
                          {project?.name && <span>·</span>}
                          <span>{timeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions -- 1 col */}
          <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Быстрые действия</h2>
            <div className="space-y-2">
              <Link
                href="/tasks"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[var(--muted)]"
              >
                <ListChecks className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Новая задача</span>
              </Link>
              <Link
                href="/content"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[var(--muted)]"
              >
                <CalendarClock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Новый пост</span>
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[var(--muted)]"
              >
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Отчёты</span>
              </Link>
              <Link
                href="/projects"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[var(--muted)]"
              >
                <Megaphone className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Все проекты</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
