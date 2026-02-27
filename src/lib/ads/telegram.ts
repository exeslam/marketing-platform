/**
 * Telegram Bot service.
 * Uses Telegraf for command handling via webhook.
 * Never call bot.launch() in serverless — only use handleUpdate().
 */

import { Telegraf } from "telegraf";
import { createAdminClient } from "@/lib/supabase/server";
import { getAggregatedMetrics, getAdCampaigns } from "@/lib/supabase/queries";

const token = process.env.TELEGRAM_BOT_TOKEN || "";

// Create bot instance (lazy — won't crash if no token during build)
export const bot = token ? new Telegraf(token) : null;

if (bot) {
  // /start — register chat_id by matching telegram_username
  bot.start(async (ctx) => {
    const username = ctx.from.username;
    if (!username) {
      ctx.reply("Для регистрации нужен Telegram username. Установите его в настройках Telegram.");
      return;
    }

    const supabase = createAdminClient();

    // Find user by telegram_username in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, telegram_username")
      .ilike("telegram_username", username)
      .single();

    if (!profile) {
      ctx.reply(
        `Пользователь @${username} не найден в системе.\n\nУбедитесь, что ваш Telegram username указан в профиле на платформе.`
      );
      return;
    }

    // Upsert subscriber
    await supabase.from("telegram_subscribers").upsert(
      {
        user_id: profile.id,
        telegram_username: username,
        chat_id: String(ctx.chat.id),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "telegram_username" }
    );

    ctx.reply(
      `Привет, ${profile.full_name}! Вы подключены к системе уведомлений.\n\n` +
        "Доступные команды:\n" +
        "/report — отчёт за текущий месяц\n" +
        "/status — статус кампаний\n" +
        "/help — список команд"
    );
  });

  // /report — send aggregated metrics
  bot.command("report", async (ctx) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const metrics = await getAggregatedMetrics(undefined, currentMonth);

      if (!metrics) {
        ctx.reply("Нет данных за текущий месяц.");
        return;
      }

      const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

      ctx.reply(
        `📊 <b>Отчёт за ${currentMonth}</b>\n\n` +
          `💰 Расход: <code>${fmt(metrics.totalSpend)} ₸</code>\n` +
          `👁 Показы: <code>${fmt(metrics.totalImpressions)}</code>\n` +
          `🖱 Клики: <code>${fmt(metrics.totalClicks)}</code>\n` +
          `📈 CTR: <code>${metrics.avgCTR.toFixed(2)}%</code>\n` +
          `💵 CPC: <code>${fmt(metrics.avgCPC)} ₸</code>\n` +
          `🎯 Конверсии: <code>${fmt(metrics.totalConversions)}</code>\n` +
          `👥 Охват: <code>${fmt(metrics.totalReach)}</code>`,
        { parse_mode: "HTML" }
      );
    } catch {
      ctx.reply("Ошибка получения отчёта. Попробуйте позже.");
    }
  });

  // /status — campaign statuses
  bot.command("status", async (ctx) => {
    try {
      const campaigns = await getAdCampaigns();

      if (campaigns.length === 0) {
        ctx.reply("Нет активных кампаний.");
        return;
      }

      const statusEmoji: Record<string, string> = {
        active: "🟢",
        enabled: "🟢",
        paused: "🟡",
        archived: "⚫",
        removed: "🔴",
      };

      const lines = campaigns.slice(0, 20).map((c) => {
        const emoji = statusEmoji[c.status ?? ""] ?? "⚪";
        return `${emoji} <b>${c.name}</b> — ${c.status}`;
      });

      ctx.reply(
        `📋 <b>Кампании (${campaigns.length})</b>\n\n${lines.join("\n")}`,
        { parse_mode: "HTML" }
      );
    } catch {
      ctx.reply("Ошибка получения данных. Попробуйте позже.");
    }
  });

  // /help
  bot.command("help", (ctx) => {
    ctx.reply(
      "📌 <b>Доступные команды:</b>\n\n" +
        "/start — подключиться к системе\n" +
        "/report — отчёт за текущий месяц\n" +
        "/status — статус рекламных кампаний\n" +
        "/help — список команд",
      { parse_mode: "HTML" }
    );
  });
}

/** Send a message to a specific chat (for proactive notifications) */
export async function sendTelegramMessage(chatId: string, text: string) {
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

/** Send a notification to all active subscribers */
export async function broadcastToSubscribers(text: string) {
  const supabase = createAdminClient();
  const { data: subscribers } = await supabase
    .from("telegram_subscribers")
    .select("chat_id")
    .eq("is_active", true);

  if (!subscribers) return;

  for (const sub of subscribers) {
    await sendTelegramMessage(sub.chat_id, text);
  }
}
