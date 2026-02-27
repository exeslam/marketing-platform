"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  createContentPost,
  updateContentPost,
  deleteContentPost,
  createProject,
  updateProject,
  deleteProject,
  updateProfile,
  updateProfileRole,
  toggleProfileActive,
  inviteUser,
  addProjectMember,
  removeProjectMember,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  getTaskComments,
  createTaskComment,
  deleteTaskComment,
  upsertAdPlatformConnection,
  disconnectAdPlatform,
  updateCampaignTags,
  logActivity,
  getCurrentUser,
} from "@/lib/supabase/queries";
import type {
  Task,
  ContentPost,
  Project,
  Profile,
} from "@/types/database";

// ── Helpers ───────────────────────────────────────────────────────────

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

async function withUser<T>(fn: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Не авторизован" };
    const data = await fn(user.id);
    return { success: true, data };
  } catch (err: unknown) {
    console.error("Action error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
    return { success: false, error: message };
  }
}

// ── Tasks ─────────────────────────────────────────────────────────────

export async function createTaskAction(
  task: Omit<Task, "id" | "created_at" | "updated_at" | "assignee">
) {
  return withUser(async (userId) => {
    const result = await createTask({ ...task, created_by: userId });
    await logActivity({
      user_id: userId,
      project_id: task.project_id,
      action: "created_task",
      entity_type: "task",
      entity_id: result.id,
      details: { title: task.title },
    });
    // Notify assignee
    if (task.assignee_id && task.assignee_id !== userId) {
      await createNotification(
        task.assignee_id,
        "Вам назначена задача",
        task.title,
        "task_assigned",
        "/tasks"
      );
    }
    revalidatePath("/tasks");
    return result;
  });
}

export async function updateTaskAction(
  id: string,
  updates: Partial<Task>
) {
  return withUser(async (userId) => {
    const result = await updateTask(id, updates);
    await logActivity({
      user_id: userId,
      project_id: result.project_id,
      action: "updated_task",
      entity_type: "task",
      entity_id: id,
      details: { title: result.title },
    });
    // Notify new assignee
    if (updates.assignee_id && updates.assignee_id !== userId) {
      await createNotification(
        updates.assignee_id,
        "Вам назначена задача",
        result.title,
        "task_assigned",
        "/tasks"
      );
    }
    revalidatePath("/tasks");
    return result;
  });
}

export async function deleteTaskAction(id: string) {
  return withUser(async (userId) => {
    await deleteTask(id);
    await logActivity({
      user_id: userId,
      action: "deleted_task",
      entity_type: "task",
      entity_id: id,
    });
    revalidatePath("/tasks");
  });
}

export async function moveTaskAction(
  taskId: string,
  newColumnId: string,
  newSortOrder: number
) {
  return withUser(async () => {
    await moveTask(taskId, newColumnId, newSortOrder);
    revalidatePath("/tasks");
  });
}

// ── Content Posts ─────────────────────────────────────────────────────

export async function createContentPostAction(
  post: Omit<ContentPost, "id" | "created_at" | "updated_at" | "author" | "reviewer">
) {
  return withUser(async (userId) => {
    const result = await createContentPost({ ...post, author_id: userId, created_by: userId });
    await logActivity({
      user_id: userId,
      project_id: post.project_id,
      action: "created_post",
      entity_type: "content_post",
      entity_id: result.id,
      details: { title: post.title },
    });
    revalidatePath("/content");
    return result;
  });
}

export async function updateContentPostAction(
  id: string,
  updates: Partial<ContentPost>
) {
  return withUser(async (userId) => {
    const result = await updateContentPost(id, updates);
    await logActivity({
      user_id: userId,
      project_id: result.project_id,
      action: "updated_post",
      entity_type: "content_post",
      entity_id: id,
      details: { title: result.title },
    });
    revalidatePath("/content");
    return result;
  });
}

export async function deleteContentPostAction(id: string) {
  return withUser(async (userId) => {
    await deleteContentPost(id);
    await logActivity({
      user_id: userId,
      action: "deleted_post",
      entity_type: "content_post",
      entity_id: id,
    });
    revalidatePath("/content");
  });
}

// ── Projects ──────────────────────────────────────────────────────────

export async function createProjectAction(
  project: Omit<Project, "id" | "created_at" | "updated_at">
) {
  return withUser(async (userId) => {
    const result = await createProject({ ...project, created_by: userId });
    await logActivity({
      user_id: userId,
      project_id: result.id,
      action: "created_project",
      entity_type: "project",
      entity_id: result.id,
      details: { name: project.name },
    });
    revalidatePath("/projects");
    return result;
  });
}

export async function updateProjectAction(
  id: string,
  updates: Partial<Project>
) {
  return withUser(async (userId) => {
    const result = await updateProject(id, updates);
    await logActivity({
      user_id: userId,
      project_id: id,
      action: "updated_project",
      entity_type: "project",
      entity_id: id,
      details: { name: result.name },
    });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return result;
  });
}

export async function deleteProjectAction(id: string) {
  return withUser(async (userId) => {
    await deleteProject(id);
    await logActivity({
      user_id: userId,
      action: "deleted_project",
      entity_type: "project",
      entity_id: id,
    });
    revalidatePath("/projects");
  });
}

// ── Profile ───────────────────────────────────────────────────────────

export async function updateProfileAction(
  updates: Partial<Pick<Profile, "full_name" | "phone" | "position" | "telegram_username" | "avatar_url">>
) {
  return withUser(async (userId) => {
    const result = await updateProfile(userId, updates);
    revalidatePath("/settings");
    return result;
  });
}

// ── Search ───────────────────────────────────────────────────────────

export async function searchAction(query: string) {
  return withUser(async () => {
    if (!query || query.length < 2) return { tasks: [], projects: [], posts: [] };
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();
    const q = `%${query}%`;

    const [tasksRes, projectsRes, postsRes] = await Promise.all([
      supabase.from("tasks").select("id, title, priority").ilike("title", q).limit(5),
      supabase.from("projects").select("id, name, color").ilike("name", q).limit(5),
      supabase.from("content_posts").select("id, title, platform").ilike("title", q).limit(5),
    ]);

    return {
      tasks: (tasksRes.data ?? []) as { id: string; title: string; priority: string }[],
      projects: (projectsRes.data ?? []) as { id: string; name: string; color: string }[],
      posts: (postsRes.data ?? []) as { id: string; title: string | null; platform: string }[],
    };
  });
}

// ── Notifications ─────────────────────────────────────────────────────

export async function markNotificationReadAction(id: string) {
  return withUser(async () => {
    await markNotificationRead(id);
  });
}

export async function markAllNotificationsReadAction() {
  return withUser(async (userId) => {
    await markAllNotificationsRead(userId);
  });
}

// ── User Management ──────────────────────────────────────────────────

export async function updateUserRoleAction(userId: string, role: string) {
  return withUser(async (currentUserId) => {
    const user = await getCurrentUser();
    if (user?.role !== "admin") throw new Error("Только администратор может менять роли");
    if (userId === currentUserId) throw new Error("Нельзя изменить свою роль");
    const result = await updateProfileRole(userId, role);
    await logActivity({
      user_id: currentUserId,
      action: "updated_user_role",
      entity_type: "profile",
      entity_id: userId,
      details: { role },
    });
    revalidatePath("/settings/team");
    return result;
  });
}

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  return withUser(async (currentUserId) => {
    const user = await getCurrentUser();
    if (user?.role !== "admin") throw new Error("Только администратор может деактивировать пользователей");
    if (userId === currentUserId) throw new Error("Нельзя деактивировать себя");
    const result = await toggleProfileActive(userId, isActive);
    await logActivity({
      user_id: currentUserId,
      action: isActive ? "activated_user" : "deactivated_user",
      entity_type: "profile",
      entity_id: userId,
    });
    revalidatePath("/settings/team");
    return result;
  });
}

export async function inviteUserAction(email: string, fullName: string, role: string) {
  return withUser(async (currentUserId) => {
    const user = await getCurrentUser();
    if (user?.role !== "admin" && user?.role !== "manager") {
      throw new Error("Недостаточно прав для приглашения");
    }
    await inviteUser(email, fullName, role);
    await logActivity({
      user_id: currentUserId,
      action: "invited_user",
      entity_type: "profile",
      details: { email, role },
    });
    revalidatePath("/settings/team");
  });
}

export async function addUserToProjectAction(userId: string, projectId: string, role: string = "member") {
  return withUser(async (currentUserId) => {
    const result = await addProjectMember(projectId, userId, role);
    await logActivity({
      user_id: currentUserId,
      project_id: projectId,
      action: "added_member",
      entity_type: "project_member",
      entity_id: userId,
    });
    revalidatePath("/settings/team");
    revalidatePath(`/projects/${projectId}`);
    return result;
  });
}

export async function deleteUserAction(userId: string) {
  return withUser(async (currentUserId) => {
    const user = await getCurrentUser();
    if (user?.role !== "admin") throw new Error("Только админ может удалять пользователей");
    if (userId === currentUserId) throw new Error("Нельзя удалить себя");
    // Delete profile (cascade will remove project_members, etc.)
    const supabase = createAdminClient();
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
    if (profileError) throw profileError;
    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
    await logActivity({
      user_id: currentUserId,
      action: "deleted_user",
      entity_type: "profile",
      entity_id: userId,
    });
    revalidatePath("/settings/team");
  });
}

export async function removeUserFromProjectAction(userId: string, projectId: string) {
  return withUser(async (currentUserId) => {
    await removeProjectMember(projectId, userId);
    await logActivity({
      user_id: currentUserId,
      project_id: projectId,
      action: "removed_member",
      entity_type: "project_member",
      entity_id: userId,
    });
    revalidatePath("/settings/team");
    revalidatePath(`/projects/${projectId}`);
  });
}

// ── Task Comments ────────────────────────────────────────────────────

export async function getTaskCommentsAction(taskId: string) {
  return withUser(async () => {
    return await getTaskComments(taskId);
  });
}

export async function createTaskCommentAction(taskId: string, content: string) {
  return withUser(async (userId) => {
    const comment = await createTaskComment(taskId, userId, content);
    revalidatePath("/tasks");
    return comment;
  });
}

export async function deleteTaskCommentAction(commentId: string) {
  return withUser(async () => {
    await deleteTaskComment(commentId);
    revalidatePath("/tasks");
  });
}

// ── Ad Integrations ──────────────────────────────────────────────────

export async function connectPlatformAction(
  projectId: string,
  platform: "meta" | "google",
  accountId: string,
  accountName?: string
) {
  return withUser(async (userId) => {
    const user = await getCurrentUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      throw new Error("Недостаточно прав");
    }
    const connection = await upsertAdPlatformConnection(projectId, platform, accountId, accountName);
    await logActivity({
      user_id: userId,
      project_id: projectId,
      action: "connected_platform",
      entity_type: "ad_platform",
      entity_id: connection.id,
      details: { platform, accountId },
    });
    revalidatePath("/settings/integrations");
    revalidatePath("/ads");
    return connection;
  });
}

export async function disconnectPlatformAction(
  projectId: string,
  platform: "meta" | "google"
) {
  return withUser(async (userId) => {
    const user = await getCurrentUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      throw new Error("Недостаточно прав");
    }
    await disconnectAdPlatform(projectId, platform);
    await logActivity({
      user_id: userId,
      project_id: projectId,
      action: "disconnected_platform",
      entity_type: "ad_platform",
      entity_id: projectId,
      details: { platform },
    });
    revalidatePath("/settings/integrations");
    revalidatePath("/ads");
  });
}

export async function syncAdsAction(projectId: string, platform?: "meta" | "google") {
  return withUser(async (userId) => {
    const user = await getCurrentUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      throw new Error("Недостаточно прав");
    }
    // Dynamic import to avoid loading SDK at build time
    const { syncMetaAds, syncGoogleAds, syncAllPlatforms } = await import("@/lib/ads/sync");
    let results;
    if (platform === "meta") results = [await syncMetaAds(projectId)];
    else if (platform === "google") results = [await syncGoogleAds(projectId)];
    else results = await syncAllPlatforms(projectId);

    await logActivity({
      user_id: userId,
      project_id: projectId,
      action: "synced_ads",
      entity_type: "ad_platform",
      entity_id: projectId,
      details: { results },
    });
    revalidatePath("/ads");
    revalidatePath("/analytics");
    return results;
  });
}

// ── Campaign Tags ────────────────────────────────────────────────────

export async function updateCampaignTagsAction(campaignId: string, tags: string[]) {
  return withUser(async () => {
    const result = await updateCampaignTags(campaignId, tags);
    revalidatePath("/ads");
    return result;
  });
}
