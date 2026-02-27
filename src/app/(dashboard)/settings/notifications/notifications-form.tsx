"use client";

import { useState } from "react";
import { Bell, Mail, MessageCircle, CheckCircle2, AlertTriangle, CalendarClock, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface NotificationChannel {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  enabled: boolean;
}

interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  email: boolean;
  push: boolean;
}

interface NotificationsFormProps {
  user: Profile;
}

export function NotificationsForm({ user }: NotificationsFormProps) {
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: "email",
      label: "Email",
      description: `Уведомления на ${user.email}`,
      icon: Mail,
      enabled: true,
    },
    {
      id: "push",
      label: "Push-уведомления",
      description: "Уведомления в браузере",
      icon: Bell,
      enabled: true,
    },
    {
      id: "telegram",
      label: "Telegram бот",
      description: user.telegram_username
        ? `Подключён: ${user.telegram_username}`
        : "Не подключён",
      icon: MessageCircle,
      enabled: false,
    },
  ]);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: "task_assigned",
      label: "Назначение задач",
      description: "Когда вам назначают задачу",
      icon: CheckCircle2,
      email: true,
      push: true,
    },
    {
      id: "task_due",
      label: "Дедлайны задач",
      description: "Напоминания о приближающихся сроках",
      icon: CalendarClock,
      email: true,
      push: true,
    },
    {
      id: "content_review",
      label: "Контент на ревью",
      description: "Когда пост отправлен на проверку",
      icon: AlertTriangle,
      email: true,
      push: true,
    },
    {
      id: "budget_alert",
      label: "Бюджетные алерты",
      description: "Когда расход приближается к лимиту",
      icon: Wallet,
      email: true,
      push: false,
    },
  ]);

  const [saved, setSaved] = useState(false);

  function toggleChannel(id: string) {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, enabled: !ch.enabled } : ch))
    );
    setSaved(false);
  }

  function toggleCategory(id: string, field: "email" | "push") {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c))
    );
    setSaved(false);
  }

  function handleSave() {
    // In the future: save to notification_preferences table
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Channels */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Каналы уведомлений</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Выберите, куда отправлять уведомления
          </p>

          <div className="space-y-3">
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <div
                  key={ch.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ch.label}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ch.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChannel(ch.id)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      ch.enabled ? "bg-primary" : "bg-[var(--border)]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        ch.enabled && "translate-x-5"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-xl bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Типы уведомлений</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Настройте, какие уведомления получать
          </p>

          <div className="overflow-hidden rounded-lg border">
            <div className="hidden border-b bg-[var(--muted)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] md:grid md:grid-cols-[1fr_80px_80px]">
              <span>Тип</span>
              <span className="text-center">Email</span>
              <span className="text-center">Push</span>
            </div>

            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="grid items-center gap-3 border-b px-4 py-3.5 last:border-0 md:grid-cols-[1fr_80px_80px]"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                    <div>
                      <p className="text-sm font-medium">{cat.label}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleCategory(cat.id, "email")}
                      className={cn(
                        "h-5 w-5 rounded border-2 transition-colors",
                        cat.email
                          ? "border-primary bg-primary"
                          : "border-[var(--border)] bg-transparent"
                      )}
                    >
                      {cat.email && (
                        <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleCategory(cat.id, "push")}
                      className={cn(
                        "h-5 w-5 rounded border-2 transition-colors",
                        cat.push
                          ? "border-primary bg-primary"
                          : "border-[var(--border)] bg-transparent"
                      )}
                    >
                      {cat.push && (
                        <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={cn(
              "rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors",
              saved ? "bg-green-500" : "bg-primary hover:bg-primary/90"
            )}
          >
            {saved ? "Сохранено!" : "Сохранить настройки"}
          </button>
        </div>
      </div>
    </div>
  );
}
