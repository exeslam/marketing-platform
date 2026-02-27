import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const { projectId, platform } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
    }

    const { syncMetaAds, syncGoogleAds, syncAllPlatforms } = await import("@/lib/ads/sync");

    let results;
    if (platform === "meta") results = [await syncMetaAds(projectId)];
    else if (platform === "google") results = [await syncGoogleAds(projectId)];
    else results = await syncAllPlatforms(projectId);

    return NextResponse.json({ success: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка синхронизации";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
