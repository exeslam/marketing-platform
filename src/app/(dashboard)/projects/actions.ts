"use server";

import { revalidatePath } from "next/cache";
import {
  getProjects,
  getProjectSpend,
  getProjectMemberCount,
  createProject,
  deleteProject,
  getCurrentUser,
} from "@/lib/supabase/queries";
import type { ProjectType } from "@/types/database";

export async function fetchProjects(type?: string) {
  const filter = type && type !== "all" ? { type: type as ProjectType, status: "active" } : { status: "active" };
  const [projects, spendData] = await Promise.all([
    getProjects(filter),
    getProjectSpend(),
  ]);

  // Get member counts in parallel
  const memberCounts = await Promise.all(
    projects.map((p) => getProjectMemberCount(p.id))
  );

  const spendMap = new Map(spendData.map((s) => [s.project_id, s]));

  return projects.map((p, i) => {
    const spend = spendMap.get(p.id);
    return {
      ...p,
      memberCount: memberCounts[i],
      currentSpend: spend?.total_actual ?? 0,
    };
  });
}

export async function createNewProject(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");

  const project = {
    name: formData.get("name") as string,
    short_name: (formData.get("short_name") as string) || null,
    type: formData.get("type") as ProjectType,
    description: (formData.get("description") as string) || null,
    city: (formData.get("city") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    contact_person: (formData.get("contact_person") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    instagram_url: (formData.get("instagram_url") as string) || null,
    facebook_url: (formData.get("facebook_url") as string) || null,
    telegram_url: (formData.get("telegram_url") as string) || null,
    tiktok_url: (formData.get("tiktok_url") as string) || null,
    youtube_url: (formData.get("youtube_url") as string) || null,
    meta_ad_account_id: (formData.get("meta_ad_account_id") as string) || null,
    meta_page_id: null,
    google_ads_customer_id: (formData.get("google_ads_customer_id") as string) || null,
    monthly_budget_kzt: Number(formData.get("monthly_budget_kzt")) || 0,
    color: (formData.get("color") as string) || "#2563EB",
    status: "active" as const,
    created_by: user.id,
    address: null,
    logo_url: null,
    cover_image_url: null,
  };

  await createProject(project);
  revalidatePath("/projects");
}

export async function deleteProjectAction(id: string) {
  await deleteProject(id);
  revalidatePath("/projects");
}
