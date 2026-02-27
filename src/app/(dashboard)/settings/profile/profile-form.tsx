"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { updateProfileAction } from "@/lib/actions";

export function ProfileForm({ user }: { user: Profile }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone ?? "",
    position: user.position ?? "",
    telegram_username: user.telegram_username ?? "",
    avatar_url: user.avatar_url ?? "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const result = await updateProfileAction({
      full_name: form.full_name,
      phone: form.phone || null,
      position: form.position || null,
      telegram_username: form.telegram_username || null,
      avatar_url: form.avatar_url || null,
    });

    setLoading(false);
    if (result.success) {
      setSaved(true);
    } else {
      setError(result.error);
    }
  }

  const inputCls =
    "w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" /> Настройки
      </Link>

      {/* Avatar preview */}
      <div className="mb-6 flex items-center gap-4">
        {form.avatar_url ? (
          <img src={form.avatar_url} alt={form.full_name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {getInitials(form.full_name)}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold">{form.full_name}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
          <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
            {user.role}
          </span>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {saved && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">Профиль обновлён</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">Личные данные</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Полное имя</label>
              <input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Должность</label>
              <input className={inputCls} value={form.position} onChange={(e) => update("position", e.target.value)} placeholder="Маркетолог" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Телефон</label>
              <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+7 ..." />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Telegram</label>
              <input className={inputCls} value={form.telegram_username} onChange={(e) => update("telegram_username", e.target.value)} placeholder="@username" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">URL аватара</label>
              <input className={inputCls} value={form.avatar_url} onChange={(e) => update("avatar_url", e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
