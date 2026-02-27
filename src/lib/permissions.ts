import type { Role } from "@/types/database";

export type Permission =
  | "projects.create"
  | "projects.edit"
  | "projects.delete"
  | "projects.view"
  | "tasks.create"
  | "tasks.edit"
  | "tasks.delete"
  | "tasks.move"
  | "content.create"
  | "content.edit"
  | "content.approve"
  | "content.delete"
  | "analytics.view"
  | "analytics.connect"
  | "budget.edit"
  | "budget.view"
  | "team.manage"
  | "team.view"
  | "reports.export"
  | "settings.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "projects.create",
    "projects.edit",
    "projects.delete",
    "projects.view",
    "tasks.create",
    "tasks.edit",
    "tasks.delete",
    "tasks.move",
    "content.create",
    "content.edit",
    "content.approve",
    "content.delete",
    "analytics.view",
    "analytics.connect",
    "budget.edit",
    "budget.view",
    "team.manage",
    "team.view",
    "reports.export",
    "settings.manage",
  ],
  manager: [
    "projects.create",
    "projects.edit",
    "projects.view",
    "tasks.create",
    "tasks.edit",
    "tasks.delete",
    "tasks.move",
    "content.create",
    "content.edit",
    "content.approve",
    "content.delete",
    "analytics.view",
    "analytics.connect",
    "budget.edit",
    "budget.view",
    "team.manage",
    "team.view",
    "reports.export",
  ],
  marketer: [
    "projects.view",
    "tasks.create",
    "tasks.edit",
    "tasks.move",
    "content.create",
    "content.edit",
    "analytics.view",
    "budget.view",
    "team.view",
    "reports.export",
  ],
  viewer: ["projects.view", "analytics.view", "budget.view", "team.view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
