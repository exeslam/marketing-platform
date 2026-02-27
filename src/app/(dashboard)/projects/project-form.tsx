"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, ProjectType, ProjectStatus } from "@/types/database";
import { createProjectAction, updateProjectAction } from "@/lib/actions";

export interface ProjectFormData {
  name: string;
  short_name: string;
  type: ProjectType;
  status: ProjectStatus;
  description: string;
  city: string;
  address: string;
  website_url: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  youtube_url: string;
  telegram_url: string;
  monthly_budget_kzt: number;
  color: string;
}

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "school", label: "Школа" },
  { value: "university", label: "Университет" },
  { value: "college", label: "Колледж" },
];

const projectStatuses: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Активный" },
  { value: "paused", label: "На паузе" },
  { value: "archived", label: "Архивирован" },
];

const colors = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#06B6D4", "#6366F1", "#F97316", "#14B8A6",
];

interface ProjectFormPageProps {
  project?: Project;
}

export function ProjectFormPage({ project }: ProjectFormPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProjectFormData>({
    name: project?.name ?? "",
    short_name: project?.short_name ?? "",
    type: project?.type ?? "school",
    status: project?.status ?? "active",
    description: project?.description ?? "",
    city: project?.city ?? "",
    address: project?.address ?? "",
    website_url: project?.website_url ?? "",
    contact_person: project?.contact_person ?? "",
    contact_phone: project?.contact_phone ?? "",
    contact_email: project?.contact_email ?? "",
    instagram_url: project?.instagram_url ?? "",
    facebook_url: project?.facebook_url ?? "",
    tiktok_url: project?.tiktok_url ?? "",
    youtube_url: project?.youtube_url ?? "",
    telegram_url: project?.telegram_url ?? "",
    monthly_budget_kzt: project?.monthly_budget_kzt ?? 500000,
    color: project?.color ?? colors[0],
  });

  function update<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError("");

    const payload = {
      name: form.name,
      short_name: form.short_name || null,
      type: form.type,
      status: form.status,
      description: form.description || null,
      city: form.city || null,
      address: form.address || null,
      website_url: form.website_url || null,
      logo_url: project?.logo_url ?? null,
      cover_image_url: project?.cover_image_url ?? null,
      contact_person: form.contact_person || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      instagram_url: form.instagram_url || null,
      facebook_url: form.facebook_url || null,
      tiktok_url: form.tiktok_url || null,
      youtube_url: form.youtube_url || null,
      telegram_url: form.telegram_url || null,
      meta_ad_account_id: project?.meta_ad_account_id ?? null,
      meta_page_id: project?.meta_page_id ?? null,
      google_ads_customer_id: project?.google_ads_customer_id ?? null,
      monthly_budget_kzt: form.monthly_budget_kzt,
      color: form.color,
      created_by: project?.created_by ?? null,
    };

    try {
      if (project) {
        const result = await updateProjectAction(project.id, payload);
        if (!result.success) { setError(result.error); setLoading(false); return; }
        router.push(`/projects/${project.id}`);
      } else {
        const result = await createProjectAction(payload);
        if (!result.success) { setError(result.error); setLoading(false); return; }
        router.push("/projects");
      }
    } catch {
      setError("Произошла ошибка");
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold">
        {project ? "Редактировать проект" : "Новый проект"}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">Основная информация</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Название *</label>
                <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Полное название" required autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Сокращение</label>
                <input className={inputCls} value={form.short_name} onChange={(e) => update("short_name", e.target.value)} placeholder="Краткое" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Тип</label>
                <select className={inputCls} value={form.type} onChange={(e) => update("type", e.target.value as ProjectType)}>
                  {projectTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Статус</label>
                <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value as ProjectStatus)}>
                  {projectStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Описание</label>
              <textarea className={cn(inputCls, "min-h-[80px] resize-y")} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Описание проекта..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Город</label>
                <input className={inputCls} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Город" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Адрес</label>
                <input className={inputCls} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Адрес" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Сайт</label>
              <input className={inputCls} value={form.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://..." />
            </div>

            {/* Color picker */}
            <div>
              <label className="mb-2 block text-sm font-medium">Цвет</label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("color", c)}
                    className={cn("h-8 w-8 rounded-full border-2 transition-transform", form.color === c ? "scale-110 border-white shadow-lg" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">Контактная информация</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Контактное лицо</label>
                <input className={inputCls} value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Телефон</label>
                <input className={inputCls} value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input className={inputCls} value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">Социальные сети</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Instagram</label>
              <input className={inputCls} value={form.instagram_url} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Facebook</label>
              <input className={inputCls} value={form.facebook_url} onChange={(e) => update("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">TikTok</label>
              <input className={inputCls} value={form.tiktok_url} onChange={(e) => update("tiktok_url", e.target.value)} placeholder="https://tiktok.com/..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">YouTube</label>
              <input className={inputCls} value={form.youtube_url} onChange={(e) => update("youtube_url", e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telegram</label>
              <input className={inputCls} value={form.telegram_url} onChange={(e) => update("telegram_url", e.target.value)} placeholder="https://t.me/..." />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">Бюджет</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Месячный бюджет (KZT)</label>
            <input
              type="number"
              className={inputCls}
              value={form.monthly_budget_kzt}
              onChange={(e) => update("monthly_budget_kzt", Number(e.target.value))}
              min={0}
              step={10000}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--muted)]">
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {project ? "Сохранить" : "Создать проект"}
          </button>
        </div>
      </form>
    </div>
  );
}
