"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ContentPost,
  ContentPlatform,
  ContentPostType,
  ContentStatus,
  Project,
} from "@/types/database";

export interface PostFormData {
  title: string;
  body: string;
  project_id: string;
  platform: ContentPlatform;
  post_type: ContentPostType;
  status: ContentStatus;
  scheduled_at: string;
  hashtags: string[];
  caption: string;
  notes: string;
}

interface PostFormProps {
  post?: ContentPost;
  projects: Project[];
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
}

const platforms: { value: ContentPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "telegram", label: "Telegram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Сайт" },
];

const postTypes: { value: ContentPostType; label: string }[] = [
  { value: "image", label: "Фото" },
  { value: "video", label: "Видео" },
  { value: "carousel", label: "Карусель" },
  { value: "reels", label: "Reels" },
  { value: "stories", label: "Stories" },
  { value: "text", label: "Текст" },
  { value: "article", label: "Статья" },
  { value: "event", label: "Событие" },
];

const statuses: { value: ContentStatus; label: string }[] = [
  { value: "idea", label: "Идея" },
  { value: "draft", label: "Черновик" },
  { value: "in_review", label: "На проверке" },
  { value: "approved", label: "Утверждён" },
  { value: "scheduled", label: "Запланирован" },
  { value: "published", label: "Опубликован" },
  { value: "rejected", label: "Отклонён" },
];

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostForm({ post, projects, onSubmit, onCancel }: PostFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PostFormData>({
    title: post?.title ?? "",
    body: post?.body ?? "",
    project_id: post?.project_id ?? (projects[0]?.id ?? ""),
    platform: post?.platform ?? "instagram",
    post_type: post?.post_type ?? "image",
    status: post?.status ?? "draft",
    scheduled_at: toDateTimeLocal(post?.scheduled_at ?? null),
    hashtags: post?.hashtags ?? [],
    caption: post?.caption ?? "",
    notes: post?.notes ?? "",
  });
  const [hashtagInput, setHashtagInput] = useState("");

  function update<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !form.hashtags.includes(tag)) {
      update("hashtags", [...form.hashtags, tag]);
    }
    setHashtagInput("");
  }

  function removeHashtag(tag: string) {
    update("hashtags", form.hashtags.filter((h) => h !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.project_id) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium">Название *</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Заголовок поста"
          required
          autoFocus
        />
      </div>

      {/* Body */}
      <div>
        <label className="mb-1 block text-sm font-medium">Текст поста</label>
        <textarea
          className={cn(inputCls, "min-h-[100px] resize-y")}
          value={form.body}
          onChange={(e) => update("body", e.target.value)}
          placeholder="Текст поста или описание..."
        />
      </div>

      {/* Project + Platform */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Проект *</label>
          <select className={inputCls} value={form.project_id} onChange={(e) => update("project_id", e.target.value)} required>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.short_name || p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Платформа</label>
          <select className={inputCls} value={form.platform} onChange={(e) => update("platform", e.target.value as ContentPlatform)}>
            {platforms.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Type + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Тип контента</label>
          <select className={inputCls} value={form.post_type} onChange={(e) => update("post_type", e.target.value as ContentPostType)}>
            {postTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Статус</label>
          <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value as ContentStatus)}>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scheduled date */}
      <div>
        <label className="mb-1 block text-sm font-medium">Дата публикации</label>
        <input
          type="datetime-local"
          className={inputCls}
          value={form.scheduled_at}
          onChange={(e) => update("scheduled_at", e.target.value)}
        />
      </div>

      {/* Caption */}
      <div>
        <label className="mb-1 block text-sm font-medium">Подпись (caption)</label>
        <textarea
          className={cn(inputCls, "min-h-[60px] resize-y")}
          value={form.caption}
          onChange={(e) => update("caption", e.target.value)}
          placeholder="Подпись к посту..."
        />
      </div>

      {/* Hashtags */}
      <div>
        <label className="mb-1 block text-sm font-medium">Хештеги</label>
        <div className="flex gap-2">
          <input
            className={cn(inputCls, "flex-1")}
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addHashtag(); }
            }}
            placeholder="#хештег и Enter"
          />
          <button type="button" onClick={addHashtag} className="rounded-lg bg-[var(--muted)] px-3 py-2 text-sm hover:bg-[var(--border)]">+</button>
        </div>
        {form.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.hashtags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                #{tag}
                <button type="button" onClick={() => removeHashtag(tag)} className="ml-0.5 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium">Заметки</label>
        <textarea
          className={cn(inputCls, "min-h-[60px] resize-y")}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Внутренние заметки..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--muted)]">
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading || !form.title.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {post ? "Сохранить" : "Создать"}
        </button>
      </div>
    </form>
  );
}
