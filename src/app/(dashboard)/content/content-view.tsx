"use client";

import { useState, useMemo, useTransition } from "react";
import { Topbar } from "@/components/layout/topbar";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  Instagram,
  Facebook,
  Send,
  Youtube,
  Pencil,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { cn, formatDate, formatNumber, getInitials } from "@/lib/utils";
import type { ContentPost, Project } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import { PostForm, type PostFormData } from "./post-form";
import {
  createContentPostAction,
  updateContentPostAction,
  deleteContentPostAction,
} from "@/lib/actions";

// ── Types ────────────────────────────────────────────────────────────

type ViewMode = "calendar" | "list";

interface ContentViewProps {
  posts: ContentPost[];
  projects: Project[];
}

// ── Platform config ──────────────────────────────────────────────────

const platformIcons: Record<string, { icon: typeof Instagram; color: string }> = {
  instagram: { icon: Instagram, color: "#E4405F" },
  facebook: { icon: Facebook, color: "#1877F2" },
  telegram: { icon: Send, color: "#26A5E4" },
  youtube: { icon: Youtube, color: "#FF0000" },
  tiktok: { icon: Send, color: "#000000" },
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  telegram: "Telegram",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  website: "Сайт",
};

// ── Status config ────────────────────────────────────────────────────

const statusLabels: Record<string, { label: string; color: string }> = {
  idea: { label: "Идея", color: "bg-gray-100 text-gray-700" },
  draft: { label: "Черновик", color: "bg-gray-100 text-gray-700" },
  in_review: { label: "На проверке", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Утверждён", color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Запланирован", color: "bg-purple-100 text-purple-700" },
  published: { label: "Опубликован", color: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонён", color: "bg-red-100 text-red-700" },
};

const postTypeLabels: Record<string, string> = {
  image: "Фото",
  video: "Видео",
  carousel: "Карусель",
  reels: "Reels",
  stories: "Stories",
  text: "Текст",
  article: "Статья",
  event: "Событие",
};

// ── Calendar helpers ─────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// ── Component ────────────────────────────────────────────────────────

export function ContentView({ posts, projects }: ContentViewProps) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterProject, setFilterProject] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const hasFilters = filterProject || filterPlatform || filterStatus;

  const filteredPosts = useMemo(() => {
    if (!hasFilters) return posts;
    return posts.filter((p) => {
      if (filterProject && p.project_id !== filterProject) return false;
      if (filterPlatform && p.platform !== filterPlatform) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [posts, filterProject, filterPlatform, filterStatus, hasFilters]);

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  }

  const postsByDate = useMemo(() => {
    const map = new Map<string, ContentPost[]>();
    for (const p of filteredPosts) {
      if (!p.scheduled_at) continue;
      const key = p.scheduled_at.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [filteredPosts]);

  function getPostsForDay(day: number): ContentPost[] {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return postsByDate.get(dateStr) ?? [];
  }

  function isToday(day: number): boolean {
    return day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
  }

  function getProjectForPost(post: ContentPost): Project | undefined {
    return projectMap.get(post.project_id);
  }

  function closeModal() { setModalMode(null); setSelectedPost(null); }

  async function handleCreate(data: PostFormData) {
    await createContentPostAction({
      title: data.title || null,
      body: data.body || null,
      project_id: data.project_id,
      platform: data.platform,
      post_type: data.post_type,
      status: data.status,
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null,
      published_at: null,
      author_id: null,
      reviewer_id: null,
      media_urls: [],
      thumbnail_url: null,
      hashtags: data.hashtags,
      caption: data.caption || null,
      actual_reach: null,
      actual_likes: null,
      actual_comments: null,
      actual_shares: null,
      notes: data.notes || null,
      rejection_reason: null,
      created_by: null,
    });
    closeModal();
  }

  async function handleUpdate(data: PostFormData) {
    if (!selectedPost) return;
    await updateContentPostAction(selectedPost.id, {
      title: data.title || null,
      body: data.body || null,
      project_id: data.project_id,
      platform: data.platform,
      post_type: data.post_type,
      status: data.status,
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null,
      hashtags: data.hashtags,
      caption: data.caption || null,
      notes: data.notes || null,
    });
    closeModal();
  }

  async function handleDelete() {
    if (!selectedPost) return;
    startTransition(async () => {
      await deleteContentPostAction(selectedPost.id);
      closeModal();
    });
  }

  return (
    <div>
      <Topbar title="Контент-план" />

      <div className="p-4 md:p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-lg bg-[var(--card)] p-1">
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                  viewMode === "calendar" ? "bg-primary text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                )}
              >
                <Calendar className="h-4 w-4" /> Календарь
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                  viewMode === "list" ? "bg-primary text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                )}
              >
                <List className="h-4 w-4" /> Список
              </button>
            </div>

            {viewMode === "calendar" && (
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-[var(--card)]">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-[140px] text-center text-sm font-semibold">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-[var(--card)]">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setFiltersOpen(!filtersOpen)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-[var(--muted)]", hasFilters && "border-primary text-primary")}>
              <Filter className="h-4 w-4" /> Фильтры {hasFilters && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">!</span>}
            </button>
            {hasFilters && (
              <button onClick={() => { setFilterProject(""); setFilterPlatform(""); setFilterStatus(""); }} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]" title="Сбросить">
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => { setSelectedPost(null); setModalMode("create"); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" /> Новый пост
            </button>
          </div>
        </div>

        {/* Filters */}
        {filtersOpen && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--card)] p-4 shadow-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Проект</label>
              <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary">
                <option value="">Все</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Платформа</label>
              <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary">
                <option value="">Все</option>
                {Object.entries(platformLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Статус</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary">
                <option value="">Все</option>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="rounded-xl bg-[var(--card)] shadow-sm">
            <div className="grid grid-cols-7 border-b">
              {dayNames.map((day) => (
                <div key={day} className="px-2 py-3 text-center text-xs font-medium text-[var(--muted-foreground)]">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px] border-b border-r p-1" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayPosts = getPostsForDay(day);
                const today = isToday(day);
                return (
                  <div key={day} className="min-h-[100px] border-b border-r p-1">
                    <span className={cn("mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs", today ? "bg-primary font-bold text-white" : "text-[var(--muted-foreground)]")}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayPosts.map((post) => {
                        const pl = platformIcons[post.platform];
                        const project = getProjectForPost(post);
                        return (
                          <div
                            key={post.id}
                            onClick={() => { setSelectedPost(post); setModalMode("edit"); }}
                            className="group flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-[10px] transition-colors hover:bg-[var(--muted)]"
                            style={{ borderLeft: `2px solid ${project?.color ?? "#94a3b8"}` }}
                          >
                            {pl && <pl.icon className="h-3 w-3 shrink-0" style={{ color: pl.color }} />}
                            <span className="truncate font-medium">{post.title ?? "Без названия"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">Пост</th>
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">Проект</th>
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">Платформа</th>
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">Статус</th>
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">Автор</th>
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]">Дата</th>
                    <th className="pb-3 text-right font-medium text-[var(--muted-foreground)]">Охват</th>
                    <th className="pb-3 font-medium text-[var(--muted-foreground)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-[var(--muted-foreground)]">Нет контент-постов</td></tr>
                  )}
                  {filteredPosts.map((post) => {
                    const status = statusLabels[post.status];
                    const project = getProjectForPost(post);
                    const pl = platformIcons[post.platform];
                    const typeLabel = postTypeLabels[post.post_type] ?? post.post_type;
                    return (
                      <tr key={post.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                        <td className="py-3">
                          <div className="cursor-pointer font-medium hover:text-primary" onClick={() => { setSelectedPost(post); setModalMode("edit"); }}>
                            {post.title ?? "Без названия"}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">{typeLabel}</div>
                        </td>
                        <td className="py-3">
                          {project ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
                              {project.name}
                            </div>
                          ) : <span className="text-[var(--muted-foreground)]">—</span>}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            {pl && <pl.icon className="h-4 w-4" style={{ color: pl.color }} />}
                            {platformLabels[post.platform] ?? post.platform}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", status?.color)}>
                            {status?.label ?? post.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {post.author ? (
                            <div className="flex items-center gap-2">
                              {post.author.avatar_url ? (
                                <img src={post.author.avatar_url} alt={post.author.full_name} className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                  {getInitials(post.author.full_name)}
                                </div>
                              )}
                              <span className="text-sm">{post.author.full_name}</span>
                            </div>
                          ) : <span className="text-[var(--muted-foreground)]">—</span>}
                        </td>
                        <td className="py-3 text-[var(--muted-foreground)]">
                          {post.scheduled_at ? formatDate(post.scheduled_at) : "—"}
                        </td>
                        <td className="py-3 text-right">
                          {post.status === "published" && post.actual_reach != null ? formatNumber(post.actual_reach) : "—"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setSelectedPost(post); setModalMode("edit"); }} className="rounded p-1 hover:bg-[var(--muted)]">
                              <Pencil className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                            </button>
                            <button onClick={() => { setSelectedPost(post); setModalMode("delete"); }} className="rounded p-1 hover:bg-[var(--muted)]">
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Modal ─────────────────────────────────────── */}
      <Modal open={modalMode === "create"} onClose={closeModal} title="Новый пост" maxWidth="max-w-xl">
        <PostForm projects={projects} onSubmit={handleCreate} onCancel={closeModal} />
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────────── */}
      <Modal open={modalMode === "edit"} onClose={closeModal} title="Редактировать пост" maxWidth="max-w-xl">
        {selectedPost && (
          <PostForm post={selectedPost} projects={projects} onSubmit={handleUpdate} onCancel={closeModal} />
        )}
      </Modal>

      {/* ── Delete Modal ─────────────────────────────────────── */}
      <Modal open={modalMode === "delete"} onClose={closeModal} title="Удалить пост">
        {selectedPost && (
          <div className="space-y-4">
            <p className="text-sm">
              Удалить пост <strong>{selectedPost.title ?? "Без названия"}</strong>? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--muted)]">Отмена</button>
              <button onClick={handleDelete} disabled={isPending} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
