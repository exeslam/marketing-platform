"use client";

import { useState, useTransition } from "react";
import {
  Shield, ShieldCheck, UserCheck, Eye, Ban, RotateCcw,
  UserPlus, ChevronDown, ChevronUp, X, FolderKanban, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateUserRoleAction,
  toggleUserActiveAction,
  inviteUserAction,
  addUserToProjectAction,
  removeUserFromProjectAction,
} from "@/lib/actions";
import type { Profile, Project, Role } from "@/types/database";

const roleLabels: Record<Role, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Админ", icon: ShieldCheck, color: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400" },
  manager: { label: "Менеджер", icon: Shield, color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400" },
  marketer: { label: "Маркетолог", icon: UserCheck, color: "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400" },
  viewer: { label: "Наблюдатель", icon: Eye, color: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400" },
};

const roles: Role[] = ["admin", "manager", "marketer", "viewer"];

interface Membership {
  user_id: string;
  project_id: string;
  role_in_project: string;
}

interface TeamListProps {
  profiles: Profile[];
  currentUser: Profile;
  memberships: Membership[];
  projects: Project[];
}

export function TeamList({ profiles, currentUser, memberships: initialMemberships, projects }: TeamListProps) {
  const [users, setUsers] = useState(profiles);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [isPending, startTransition] = useTransition();
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", fullName: "", role: "marketer" as Role });
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [addingProjectFor, setAddingProjectFor] = useState<string | null>(null);

  const isAdmin = currentUser.role === "admin";
  const canManage = isAdmin || currentUser.role === "manager";

  function getUserProjects(userId: string) {
    const userMemberships = memberships.filter((m) => m.user_id === userId);
    return userMemberships.map((m) => ({
      ...m,
      project: projects.find((p) => p.id === m.project_id),
    }));
  }

  function getAvailableProjects(userId: string) {
    const userProjectIds = new Set(memberships.filter((m) => m.user_id === userId).map((m) => m.project_id));
    return projects.filter((p) => !userProjectIds.has(p.id));
  }

  function handleRoleChange(userId: string, newRole: Role) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setEditingRoleId(null);
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (!res.success) {
        setUsers(profiles);
        alert(res.error);
      }
    });
  }

  function handleToggleActive(userId: string, isActive: boolean) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u)));
    startTransition(async () => {
      const res = await toggleUserActiveAction(userId, isActive);
      if (!res.success) {
        setUsers(profiles);
        alert(res.error);
      }
    });
  }

  function handleInvite() {
    if (!inviteForm.email || !inviteForm.fullName) {
      setInviteError("Заполните все поля");
      return;
    }
    setInviteError("");
    startTransition(async () => {
      const res = await inviteUserAction(inviteForm.email, inviteForm.fullName, inviteForm.role);
      if (res.success) {
        setInviteForm({ email: "", fullName: "", role: "marketer" });
        setInviteError("");
        setInviteSuccess(true);
        setTimeout(() => { setInviteSuccess(false); setShowInvite(false); }, 3000);
        window.location.reload();
      } else {
        setInviteError(res.error);
      }
    });
  }

  function handleAddToProject(userId: string, projectId: string) {
    setMemberships((prev) => [...prev, { user_id: userId, project_id: projectId, role_in_project: "member" }]);
    setAddingProjectFor(null);
    startTransition(async () => {
      const res = await addUserToProjectAction(userId, projectId);
      if (!res.success) {
        setMemberships(initialMemberships);
        alert(res.error);
      }
    });
  }

  function handleRemoveFromProject(userId: string, projectId: string) {
    setMemberships((prev) => prev.filter((m) => !(m.user_id === userId && m.project_id === projectId)));
    startTransition(async () => {
      const res = await removeUserFromProjectAction(userId, projectId);
      if (!res.success) {
        setMemberships(initialMemberships);
        alert(res.error);
      }
    });
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {users.filter((u) => u.is_active).length} активных из {users.length}
        </p>
        {canManage && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            Пригласить
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="mb-4 rounded-xl border bg-[var(--card)] p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Пригласить нового пользователя</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              type="text"
              placeholder="Имя Фамилия"
              value={inviteForm.fullName}
              onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
              className="rounded-lg border bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="email"
              placeholder="email@example.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg border bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="rounded-lg border bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{roleLabels[r].label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleInvite}
                disabled={isPending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? "..." : "Добавить"}
              </button>
              <button
                onClick={() => { setShowInvite(false); setInviteError(""); }}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-[var(--muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {inviteError && <p className="mt-2 text-sm text-red-500">{inviteError}</p>}
          {inviteSuccess && (
            <p className="mt-2 text-sm text-green-600">
              Приглашение отправлено на email! Пользователь получит ссылку для установки пароля.
            </p>
          )}
          {!inviteSuccess && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              На указанный email будет отправлена ссылка-приглашение. Пользователь установит пароль и получит доступ к системе.
            </p>
          )}
        </div>
      )}

      {/* User list */}
      <div className="space-y-3">
        {users.map((user) => {
          const roleInfo = roleLabels[user.role];
          const RoleIcon = roleInfo.icon;
          const isSelf = user.id === currentUser.id;
          const isExpanded = expandedId === user.id;
          const userProjects = getUserProjects(user.id);
          const availableProjects = getAvailableProjects(user.id);
          const initials = user.full_name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={user.id}
              className={cn(
                "overflow-hidden rounded-xl bg-[var(--card)] shadow-sm",
                !user.is_active && "opacity-60"
              )}
            >
              {/* Main row */}
              <div className="flex items-center gap-3 px-5 py-4">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {initials}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.full_name}
                    {isSelf && <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">(вы)</span>}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="truncate">{user.email}</span>
                    {user.position && (
                      <>
                        <span>·</span>
                        <span className="truncate">{user.position}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Role badge */}
                <div className="hidden sm:block">
                  {editingRoleId === user.id ? (
                    <div className="flex flex-wrap gap-1">
                      {roles.map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(user.id, r)}
                          className={cn(
                            "rounded px-2 py-1 text-xs font-medium transition-colors",
                            r === user.role
                              ? "bg-primary text-white"
                              : "bg-[var(--muted)] hover:bg-[var(--border)]"
                          )}
                        >
                          {roleLabels[r].label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => isAdmin && !isSelf && setEditingRoleId(user.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        roleInfo.color,
                        isAdmin && !isSelf && "cursor-pointer hover:opacity-80"
                      )}
                      disabled={!isAdmin || isSelf}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleInfo.label}
                    </button>
                  )}
                </div>

                {/* Project count */}
                <span className="hidden rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)] sm:inline-flex sm:items-center sm:gap-1">
                  <FolderKanban className="h-3 w-3" />
                  {userProjects.length}
                </span>

                {/* Status */}
                <span
                  className={cn(
                    "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
                    user.is_active ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", user.is_active ? "bg-green-500" : "bg-red-500")} />
                  {user.is_active ? "Активен" : "Неактивен"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isAdmin && !isSelf && (
                    <button
                      onClick={() => handleToggleActive(user.id, !user.is_active)}
                      disabled={isPending}
                      className={cn(
                        "rounded-lg p-2 transition-colors hover:bg-[var(--muted)]",
                        user.is_active ? "text-red-500" : "text-green-600"
                      )}
                      title={user.is_active ? "Деактивировать" : "Активировать"}
                    >
                      {user.is_active ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : user.id)}
                    className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded: Projects */}
              {isExpanded && (
                <div className="border-t px-5 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Проекты ({userProjects.length})
                    </h4>
                    {canManage && availableProjects.length > 0 && (
                      <button
                        onClick={() => setAddingProjectFor(addingProjectFor === user.id ? null : user.id)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3" />
                        Добавить в проект
                      </button>
                    )}
                  </div>

                  {/* Add to project dropdown */}
                  {addingProjectFor === user.id && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {availableProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleAddToProject(user.id, p.id)}
                          disabled={isPending}
                          className="flex items-center gap-2 rounded-lg border bg-[var(--muted)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--border)]"
                        >
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Current projects */}
                  {userProjects.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">Не состоит ни в одном проекте</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userProjects.map((mp) => (
                        <div
                          key={mp.project_id}
                          className="flex items-center gap-2 rounded-lg border bg-[var(--muted)] px-3 py-2"
                        >
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: mp.project?.color ?? "#6366F1" }}
                          />
                          <span className="text-sm font-medium">{mp.project?.name ?? "Проект"}</span>
                          <span className="rounded bg-[var(--card)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                            {mp.role_in_project === "lead" ? "Лид" : mp.role_in_project === "viewer" ? "Наблюд." : "Участник"}
                          </span>
                          {canManage && (
                            <button
                              onClick={() => handleRemoveFromProject(user.id, mp.project_id)}
                              disabled={isPending}
                              className="rounded p-0.5 text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-red-500"
                              title="Убрать из проекта"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
            Нет пользователей
          </p>
        )}
      </div>
    </div>
  );
}
