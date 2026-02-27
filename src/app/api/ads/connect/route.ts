import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, upsertAdPlatformConnection, disconnectAdPlatform } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const { action, projectId, platform, accountId, accountName } = await req.json();

    if (!projectId || !platform) {
      return NextResponse.json({ error: "projectId и platform обязательны" }, { status: 400 });
    }

    if (action === "disconnect") {
      await disconnectAdPlatform(projectId, platform);
      return NextResponse.json({ success: true });
    }

    // Connect
    if (!accountId) {
      return NextResponse.json({ error: "accountId обязателен для подключения" }, { status: 400 });
    }

    const connection = await upsertAdPlatformConnection(projectId, platform, accountId, accountName);
    return NextResponse.json({ success: true, connection });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка подключения";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
