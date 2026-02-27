import { getBudgetRecords, getProjects, getProjectSpend } from "@/lib/supabase/queries";
import type { Project, BudgetRecord, BudgetChannel } from "@/types/database";
import { AnalyticsView } from "./analytics-view";

export default async function AnalyticsPage() {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  // Fetch all data in parallel
  const [budgetRecords, projects, projectSpend] = await Promise.all([
    getBudgetRecords({ month: currentMonth }),
    getProjects(),
    getProjectSpend(currentMonth),
  ]);

  // --- Total spend & planned for current month ---
  const totalSpend = budgetRecords.reduce(
    (sum, r) => sum + Number(r.actual_spend_kzt),
    0
  );
  const totalPlanned = budgetRecords.reduce(
    (sum, r) => sum + Number(r.planned_budget_kzt),
    0
  );
  const budgetUsagePercent =
    totalPlanned > 0 ? Math.round((totalSpend / totalPlanned) * 100) : 0;
  const remainingBudget = totalPlanned - totalSpend;

  // --- Per-project spend breakdown ---
  const projectMap = new Map<string, Project>();
  for (const p of projects) {
    projectMap.set(p.id, p);
  }

  const perProjectBreakdown = projectSpend.map((ps) => {
    const project = projectMap.get(ps.project_id);
    return {
      projectId: ps.project_id,
      projectName: project?.name ?? "Неизвестный проект",
      shortName: project?.short_name ?? project?.name ?? "N/A",
      color: project?.color ?? "#6366f1",
      planned: ps.total_planned,
      actual: ps.total_actual,
      usagePercent:
        ps.total_planned > 0
          ? Math.round((ps.total_actual / ps.total_planned) * 100)
          : 0,
    };
  });

  // --- Per-channel spend breakdown ---
  const channelMap = new Map<
    BudgetChannel,
    { planned: number; actual: number }
  >();
  for (const r of budgetRecords) {
    const entry = channelMap.get(r.channel) ?? { planned: 0, actual: 0 };
    entry.planned += Number(r.planned_budget_kzt);
    entry.actual += Number(r.actual_spend_kzt);
    channelMap.set(r.channel, entry);
  }

  const channelBreakdown = Array.from(channelMap.entries()).map(
    ([channel, data]) => ({
      channel,
      planned: data.planned,
      actual: data.actual,
      usagePercent:
        data.planned > 0
          ? Math.round((data.actual / data.planned) * 100)
          : 0,
    })
  );

  // --- Find top channel by spend ---
  let topChannelName = "—";
  let topChannelSpend = 0;
  for (const ch of channelBreakdown) {
    if (ch.actual > topChannelSpend) {
      topChannelSpend = ch.actual;
      topChannelName = ch.channel;
    }
  }

  return (
    <AnalyticsView
      totalSpend={totalSpend}
      totalPlanned={totalPlanned}
      budgetUsagePercent={budgetUsagePercent}
      remainingBudget={remainingBudget}
      projectCount={projects.length}
      topChannelName={topChannelName}
      topChannelSpend={topChannelSpend}
      perProjectBreakdown={perProjectBreakdown}
      channelBreakdown={channelBreakdown}
      currentMonth={currentMonth}
    />
  );
}
