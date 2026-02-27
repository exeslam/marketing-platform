/**
 * Supabase query layer — все запросы к БД в одном месте.
 * Server-side only (используется в Server Components и Server Actions).
 */

import { createClient, createAdminClient } from "./server";
import type {
  Project,
  ProjectType,
  Profile,
  ProjectMember,
  Task,
  TaskColumn,
  TaskBoard,
  ContentPost,
  BudgetRecord,
  AdCampaign,
  AdMetricsDaily,
  Notification,
  TaskComment,
  AdPlatformConnection,
} from "@/types/database";

// ── Auth & Profile ──────────────────────────────────────────────────

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, "full_name" | "phone" | "position" | "telegram_username" | "avatar_url">>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ── Projects ────────────────────────────────────────────────────────

export async function getProjects(filter?: {
  type?: ProjectType;
  status?: string;
}): Promise<Project[]> {
  const supabase = createAdminClient();
  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });

  if (filter?.type) query = query.eq("type", filter.type);
  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Project;
}

export async function createProject(
  project: Omit<Project, "id" | "created_at" | "updated_at">
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const supabase = createAdminClient();
  // All related tables have ON DELETE CASCADE, so just delete the project
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ── Project Members ─────────────────────────────────────────────────

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("*, profile:profiles(*)")
    .eq("project_id", projectId);
  if (error) throw error;
  return (data ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    profile: m.profile as Profile,
  })) as ProjectMember[];
}

export async function getProjectMemberCount(projectId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("project_members")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}

export async function getProjectMemberCounts(projectIds: string[]): Promise<Record<string, number>> {
  if (projectIds.length === 0) return {};
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id")
    .in("project_id", projectIds);
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
  }
  return counts;
}

export async function addProjectMember(projectId: string, userId: string, role: string = "member") {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role_in_project: role })
    .select("*, profile:profiles(*)")
    .single();
  if (error) throw error;
  return data as ProjectMember;
}

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Tasks ───────────────────────────────────────────────────────────

export async function getTaskBoards(projectId: string): Promise<TaskBoard[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_boards")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw error;
  return (data ?? []) as TaskBoard[];
}

export async function getTaskColumns(boardId: string): Promise<TaskColumn[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_columns")
    .select("*")
    .eq("board_id", boardId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as TaskColumn[];
}

export async function getTasksByColumn(columnId: string): Promise<Task[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
    .eq("column_id", columnId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    assignee: t.assignee as Profile | null,
  })) as Task[];
}

export async function getAllTasks(filters?: {
  projectId?: string;
  assigneeId?: string;
  priority?: string;
  category?: string;
  limit?: number;
}): Promise<Task[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
    .order("sort_order")
    .limit(filters?.limit ?? 200);

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.category) query = query.eq("category", filters.category);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    assignee: t.assignee as Profile | null,
  })) as Task[];
}

export async function createTask(
  task: Omit<Task, "id" | "created_at" | "updated_at" | "assignee">
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(task)
    .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { assignee, ...clean } = updates;
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function moveTask(taskId: string, newColumnId: string, newSortOrder: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tasks")
    .update({ column_id: newColumnId, sort_order: newSortOrder, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw error;
}

export async function getUpcomingDeadlines(limit: number = 5): Promise<Task[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
    .not("due_date", "is", null)
    .gte("due_date", new Date().toISOString().split("T")[0])
    .order("due_date")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTaskCommentCount(taskId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("task_comments")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);
  if (error) return 0;
  return count ?? 0;
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_comments")
    .select("*, author:profiles!task_comments_author_id_fkey(*)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TaskComment[];
}

export async function createTaskComment(
  taskId: string,
  authorId: string,
  content: string
): Promise<TaskComment> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, author_id: authorId, content })
    .select("*, author:profiles!task_comments_author_id_fkey(*)")
    .single();
  if (error) throw error;
  return data as TaskComment;
}

export async function deleteTaskComment(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Content Posts ───────────────────────────────────────────────────

export async function getContentPosts(filters?: {
  projectId?: string;
  status?: string;
  platform?: string;
  from?: string;
  to?: string;
}): Promise<ContentPost[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("content_posts")
    .select("*, author:profiles!content_posts_author_id_fkey(*)")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.platform) query = query.eq("platform", filters.platform);
  if (filters?.from) query = query.gte("scheduled_at", filters.from);
  if (filters?.to) query = query.lte("scheduled_at", filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ContentPost[];
}

export async function createContentPost(
  post: Omit<ContentPost, "id" | "created_at" | "updated_at" | "author" | "reviewer">
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_posts")
    .insert(post)
    .select("*, author:profiles!content_posts_author_id_fkey(*)")
    .single();
  if (error) throw error;
  return data as ContentPost;
}

export async function updateContentPost(id: string, updates: Partial<ContentPost>) {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { author, reviewer, ...clean } = updates;
  const { data, error } = await supabase
    .from("content_posts")
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ContentPost;
}

export async function deleteContentPost(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("content_posts").delete().eq("id", id);
  if (error) throw error;
}

// ── Budget ──────────────────────────────────────────────────────────

export async function getBudgetRecords(filters?: {
  projectId?: string;
  month?: string;
}): Promise<BudgetRecord[]> {
  const supabase = createAdminClient();
  let query = supabase.from("budget_records").select("*").order("month", { ascending: false });

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.month) query = query.eq("month", filters.month);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BudgetRecord[];
}

export async function upsertBudgetRecord(record: Omit<BudgetRecord, "id" | "created_at" | "updated_at">) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("budget_records")
    .upsert(record, { onConflict: "project_id,month,channel" })
    .select()
    .single();
  if (error) throw error;
  return data as BudgetRecord;
}

export async function getProjectSpend(month?: string): Promise<
  { project_id: string; total_planned: number; total_actual: number }[]
> {
  const supabase = createAdminClient();
  const currentMonth = month ?? new Date().toISOString().slice(0, 7) + "-01";

  const { data, error } = await supabase
    .from("budget_records")
    .select("project_id, planned_budget_kzt, actual_spend_kzt")
    .eq("month", currentMonth);

  if (error) throw error;

  // Aggregate per project
  const map = new Map<string, { total_planned: number; total_actual: number }>();
  for (const r of data ?? []) {
    const entry = map.get(r.project_id) ?? { total_planned: 0, total_actual: 0 };
    entry.total_planned += Number(r.planned_budget_kzt);
    entry.total_actual += Number(r.actual_spend_kzt);
    map.set(r.project_id, entry);
  }

  return Array.from(map.entries()).map(([project_id, v]) => ({
    project_id,
    ...v,
  }));
}

// ── Analytics ───────────────────────────────────────────────────────

export async function getAdCampaigns(projectId?: string): Promise<AdCampaign[]> {
  const supabase = createAdminClient();
  let query = supabase.from("ad_campaigns").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((c: Record<string, unknown>) => ({ ...c, tags: c.tags ?? [] })) as AdCampaign[];
}

export async function updateCampaignTags(campaignId: string, tags: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .update({ tags })
    .eq("id", campaignId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAdMetrics(filters?: {
  projectId?: string;
  campaignId?: string;
  from?: string;
  to?: string;
}): Promise<AdMetricsDaily[]> {
  const supabase = createAdminClient();
  let query = supabase.from("ad_metrics_daily").select("*").order("date", { ascending: false });

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.campaignId) query = query.eq("campaign_id", filters.campaignId);
  if (filters?.from) query = query.gte("date", filters.from);
  if (filters?.to) query = query.lte("date", filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AdMetricsDaily[];
}

export async function getCampaignMetricsSummary(campaignIds: string[]): Promise<
  Record<string, { spend: number; leads: number; costPerLead: number; clicks: number; impressions: number }>
> {
  if (campaignIds.length === 0) return {};
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_metrics_daily")
    .select("campaign_id, spend_kzt, conversions, clicks, impressions")
    .in("campaign_id", campaignIds);
  if (error) throw error;

  const map: Record<string, { spend: number; leads: number; costPerLead: number; clicks: number; impressions: number }> = {};
  for (const row of data ?? []) {
    const id = row.campaign_id as string;
    if (!map[id]) map[id] = { spend: 0, leads: 0, costPerLead: 0, clicks: 0, impressions: 0 };
    map[id].spend += Number(row.spend_kzt) || 0;
    map[id].leads += Number(row.conversions) || 0;
    map[id].clicks += Number(row.clicks) || 0;
    map[id].impressions += Number(row.impressions) || 0;
  }
  // Calculate cost per lead
  for (const v of Object.values(map)) {
    v.costPerLead = v.leads > 0 ? v.spend / v.leads : 0;
  }
  return map;
}

export async function getAggregatedMetrics(projectId?: string, month?: string) {
  const supabase = createAdminClient();
  const currentMonth = month ?? new Date().toISOString().slice(0, 7);
  const [y, m] = currentMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const from = `${currentMonth}-01`;
  const to = `${currentMonth}-${String(lastDay).padStart(2, "0")}`;

  let query = supabase
    .from("ad_metrics_daily")
    .select("impressions, reach, clicks, spend_kzt, conversions, ctr, cpc_kzt")
    .gte("date", from)
    .lte("date", to);

  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return null;

  return {
    totalSpend: rows.reduce((s, r) => s + Number(r.spend_kzt), 0),
    totalImpressions: rows.reduce((s, r) => s + Number(r.impressions), 0),
    totalClicks: rows.reduce((s, r) => s + Number(r.clicks), 0),
    totalConversions: rows.reduce((s, r) => s + Number(r.conversions), 0),
    avgCTR: rows.reduce((s, r) => s + Number(r.ctr), 0) / rows.length,
    avgCPC: rows.reduce((s, r) => s + Number(r.cpc_kzt), 0) / rows.length,
    totalReach: rows.reduce((s, r) => s + Number(r.reach), 0),
  };
}

// ── Ad Platform Connections ──────────────────────────────────────────

export async function getAdPlatformConnections(
  projectId?: string
): Promise<AdPlatformConnection[]> {
  const supabase = createAdminClient();
  let query = supabase.from("ad_platforms").select("*");
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AdPlatformConnection[];
}

export async function upsertAdPlatformConnection(
  projectId: string,
  platform: "meta" | "google",
  accountId: string,
  accountName?: string
): Promise<AdPlatformConnection> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_platforms")
    .upsert(
      {
        project_id: projectId,
        platform,
        account_id: accountId,
        account_name: accountName ?? null,
        is_connected: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,platform" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as AdPlatformConnection;
}

export async function disconnectAdPlatform(
  projectId: string,
  platform: "meta" | "google"
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ad_platforms")
    .update({ is_connected: false, updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("platform", platform);
  if (error) throw error;
}

// ── Activity Log ────────────────────────────────────────────────────

export async function getRecentActivity(limit: number = 10) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*, user:profiles(*), project:projects(name, color)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function logActivity(entry: {
  user_id: string;
  project_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_log").insert(entry);
  if (error) throw error;
}

// ── Notifications ───────────────────────────────────────────────────

export async function getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

export async function createNotification(
  userId: string,
  title: string,
  body: string | null,
  type: string,
  link: string | null = null
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, title, body, type, link, is_read: false });
  if (error) throw error;
}

// ── Team / All Profiles ─────────────────────────────────────────────

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfileRole(userId: string, role: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getUserProjectMemberships(userId: string): Promise<(ProjectMember & { project?: Project })[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("*, project:projects(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    project: m.project as Project | undefined,
  })) as (ProjectMember & { project?: Project })[];
}

export async function getAllProjectMemberships(): Promise<{ user_id: string; project_id: string; role_in_project: string }[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id, project_id, role_in_project");
  if (error) throw error;
  return (data ?? []) as { user_id: string; project_id: string; role_in_project: string }[];
}

export async function inviteUser(email: string, fullName: string, role: string) {
  const supabase = createAdminClient();

  // Check if user already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();
  if (existing) throw new Error("Пользователь с этим email уже существует");

  // Invite via Supabase — sends real email with magic link
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/setup-password`;

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, invited_role: role },
    redirectTo,
  });
  if (error) throw error;

  // Trigger creates profile automatically; update role + name
  if (data.user) {
    // Small delay for trigger to fire
    await new Promise((r) => setTimeout(r, 500));
    await supabase
      .from("profiles")
      .update({ role, full_name: fullName })
      .eq("id", data.user.id);
  }

  return data.user;
}

export async function toggleProfileActive(userId: string, isActive: boolean) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ── Dashboard Aggregates ────────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = createAdminClient();
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  // Parallel queries
  const [projectsRes, tasksRes, postsRes, budgetRes] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tasks").select("id, due_date, completed_at"),
    supabase.from("content_posts").select("id, status, scheduled_at"),
    supabase.from("budget_records").select("planned_budget_kzt, actual_spend_kzt").eq("month", currentMonth),
  ]);

  const tasks = tasksRes.data ?? [];
  const posts = postsRes.data ?? [];
  const budgets = budgetRes.data ?? [];

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now && !t.completed_at
  ).length;

  const weekTasks = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) >= now &&
      new Date(t.due_date) <= weekLater &&
      !t.completed_at
  ).length;

  const scheduledPosts = posts.filter(
    (p) =>
      p.status === "scheduled" &&
      p.scheduled_at &&
      new Date(p.scheduled_at) >= now &&
      new Date(p.scheduled_at) <= weekLater
  ).length;

  const totalPlanned = budgets.reduce((s, b) => s + Number(b.planned_budget_kzt), 0);
  const totalActual = budgets.reduce((s, b) => s + Number(b.actual_spend_kzt), 0);

  return {
    activeProjects: projectsRes.count ?? 0,
    totalTasks: tasks.length,
    weekTasks,
    overdueTasks,
    scheduledPosts,
    totalPosts: posts.length,
    totalPlannedBudget: totalPlanned,
    totalActualSpend: totalActual,
    budgetUsagePercent: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0,
  };
}
