"use client";

import { useState, useTransition } from "react";
import {
  connectPlatformAction,
  disconnectPlatformAction,
  syncAdsAction,
} from "@/lib/actions";
import type { AdPlatformConnection } from "@/types/database";
import {
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";

interface Props {
  connections: AdPlatformConnection[];
  isAdmin: boolean;
}

type PlatformKey = "meta" | "google" | "telegram";

const platformInfo: Record<PlatformKey, { name: string; description: string; color: string; fields: { key: string; label: string; placeholder: string }[] }> = {
  meta: {
    name: "Meta Ads",
    description: "Facebook и Instagram реклама",
    color: "bg-blue-500",
    fields: [
      { key: "accountId", label: "Ad Account ID", placeholder: "act_123456789" },
      { key: "accountName", label: "Название (опционально)", placeholder: "Основной аккаунт" },
    ],
  },
  google: {
    name: "Google Ads",
    description: "Google поиск, YouTube, КМС",
    color: "bg-green-500",
    fields: [
      { key: "accountId", label: "Customer ID", placeholder: "123-456-7890" },
      { key: "accountName", label: "Название (опционально)", placeholder: "Основной аккаунт" },
    ],
  },
  telegram: {
    name: "Telegram Bot",
    description: "Уведомления и отчёты в Telegram",
    color: "bg-sky-500",
    fields: [],
  },
};

export function IntegrationsView({ connections, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformKey | null>(null);
  const [formData, setFormData] = useState({ accountId: "", accountName: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const getConnection = (platform: string) =>
    connections.find((c) => c.platform === platform && c.is_connected);

  async function handleConnect(platform: PlatformKey) {
    if (!formData.accountId.trim()) return;
    const projectId = connections[0]?.project_id;
    if (!projectId) {
      setMessage({ type: "error", text: "Сначала создайте проект" });
      return;
    }

    startTransition(async () => {
      const res = await connectPlatformAction(
        projectId,
        platform as "meta" | "google",
        formData.accountId.trim(),
        formData.accountName.trim() || undefined
      );
      if (res.success) {
        setMessage({ type: "success", text: `${platformInfo[platform].name} подключен!` });
        setConnectingPlatform(null);
        setFormData({ accountId: "", accountName: "" });
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  async function handleDisconnect(platform: PlatformKey) {
    const conn = getConnection(platform);
    if (!conn) return;

    startTransition(async () => {
      const res = await disconnectPlatformAction(conn.project_id, platform as "meta" | "google");
      if (res.success) {
        setMessage({ type: "success", text: `${platformInfo[platform].name} отключен` });
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  async function handleSync(platform?: PlatformKey) {
    const projectId = connections[0]?.project_id;
    if (!projectId) return;

    setSyncing(platform ?? "all");
    const res = await syncAdsAction(projectId, platform === "telegram" ? undefined : platform as "meta" | "google" | undefined);
    setSyncing(null);

    if (res.success) {
      setMessage({ type: "success", text: "Синхронизация завершена!" });
    } else {
      setMessage({ type: "error", text: res.error });
    }
  }

  async function handleSetupTelegram() {
    setTelegramStatus("loading");
    try {
      const res = await fetch("/api/telegram/setup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus("success");
        setMessage({ type: "success", text: `Webhook установлен: ${data.webhookUrl}` });
      } else {
        setTelegramStatus("error");
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setTelegramStatus("error");
      setMessage({ type: "error", text: "Ошибка настройки Telegram" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Platform cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(platformInfo) as [PlatformKey, typeof platformInfo.meta][]).map(
          ([key, info]) => {
            const conn = getConnection(key);
            const isConnected = !!conn;
            const isSyncing = syncing === key || syncing === "all";

            return (
              <div
                key={key}
                className="rounded-xl bg-[var(--card)] p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${info.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {key === "meta" ? "M" : key === "google" ? "G" : "T"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{info.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {info.description}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="text-sm">
                    {isConnected ? "Подключен" : "Не подключен"}
                  </span>
                </div>

                {/* Connection details */}
                {conn && (
                  <div className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
                    <p>Account: {conn.account_id}</p>
                    {conn.account_name && <p>{conn.account_name}</p>}
                    {conn.last_synced_at && (
                      <p>
                        Синхр.:{" "}
                        {new Date(conn.last_synced_at).toLocaleString("ru-RU")}
                      </p>
                    )}
                    {conn.sync_error && (
                      <p className="text-red-500">Ошибка: {conn.sync_error}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {isAdmin && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {key === "telegram" ? (
                      <button
                        onClick={handleSetupTelegram}
                        disabled={telegramStatus === "loading"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                      >
                        {telegramStatus === "loading" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Настроить Webhook
                      </button>
                    ) : isConnected ? (
                      <>
                        <button
                          onClick={() => handleSync(key)}
                          disabled={isSyncing || isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                          />
                          Синхронизировать
                        </button>
                        <button
                          onClick={() => handleDisconnect(key)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                          Отключить
                        </button>
                      </>
                    ) : connectingPlatform === key ? (
                      <div className="w-full space-y-2">
                        {info.fields.map((field) => (
                          <input
                            key={field.key}
                            type="text"
                            placeholder={field.placeholder}
                            value={formData[field.key as keyof typeof formData] ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
                          />
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConnect(key)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Link2 className="h-3.5 w-3.5" />
                            )}
                            Подключить
                          </button>
                          <button
                            onClick={() => {
                              setConnectingPlatform(null);
                              setFormData({ accountId: "", accountName: "" });
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConnectingPlatform(key)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Подключить
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Sync all button */}
      {connections.some((c) => c.is_connected) && isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => handleSync()}
            disabled={syncing !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Синхронизировать все
          </button>
        </div>
      )}

      {/* Env hints */}
      {isAdmin && (
        <div className="rounded-xl bg-[var(--muted)]/50 p-5 text-sm">
          <h4 className="font-semibold">Настройка переменных окружения</h4>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Для подключения рекламных платформ добавьте токены в <code className="rounded bg-[var(--muted)] px-1">.env.local</code>:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
            <li><strong>Meta Ads:</strong> META_AD_ACCESS_TOKEN, META_APP_ID, META_APP_SECRET</li>
            <li><strong>Google Ads:</strong> GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_REFRESH_TOKEN</li>
            <li><strong>Telegram:</strong> TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET</li>
          </ul>
        </div>
      )}
    </div>
  );
}
