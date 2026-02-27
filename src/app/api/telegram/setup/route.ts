import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/queries";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Только администратор" }, { status: 403 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN не настроен" }, { status: 400 });
    }

    const webhookUrl = `${appUrl}/api/telegram/webhook`;

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret || undefined,
        allowed_updates: ["message"],
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 400 });
    }

    return NextResponse.json({ success: true, webhookUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка настройки webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
