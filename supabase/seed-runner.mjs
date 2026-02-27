/**
 * Seed runner — заливает тестовые данные через Supabase Admin Client.
 * Запуск: node supabase/seed-runner.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_ID = "033ce1df-909c-46db-81cd-b447d685180a";

async function seed() {
  console.log("🌱 Starting seed...");

  // 1. Projects
  const { data: projects, error: projErr } = await supabase.from("projects").upsert([
    { id: "11111111-1111-1111-1111-111111111111", name: "НИШ Астана", short_name: "NIS", type: "school", description: "Назарбаев Интеллектуальные школы — школа для одарённых детей", city: "Астана", website_url: "https://nis.edu.kz", contact_person: "Асель Нурланова", contact_phone: "+7 701 234 5678", contact_email: "asel@nis.edu.kz", instagram_url: "https://instagram.com/nis_astana", facebook_url: "https://facebook.com/nis.astana", telegram_url: "https://t.me/nis_astana", youtube_url: "https://youtube.com/@nis_astana", meta_ad_account_id: "act_1234567890", google_ads_customer_id: "123-456-7890", monthly_budget_kzt: 800000, color: "#2563EB", created_by: ADMIN_ID },
    { id: "22222222-2222-2222-2222-222222222222", name: "IITU", short_name: "IITU", type: "university", description: "Международный университет информационных технологий", city: "Алматы", website_url: "https://iitu.edu.kz", contact_person: "Марат Сулейменов", contact_phone: "+7 702 345 6789", contact_email: "marat@iitu.edu.kz", instagram_url: "https://instagram.com/iitu_edu", facebook_url: "https://facebook.com/iitu.edu", telegram_url: "https://t.me/iitu_official", tiktok_url: "https://tiktok.com/@iitu_edu", youtube_url: "https://youtube.com/@iitu", meta_ad_account_id: "act_2345678901", google_ads_customer_id: "234-567-8901", monthly_budget_kzt: 700000, color: "#7C3AED", created_by: ADMIN_ID },
    { id: "33333333-3333-3333-3333-333333333333", name: "Haileybury Almaty", short_name: "Haileybury", type: "school", description: "Международная школа с британской программой обучения", city: "Алматы", website_url: "https://haileybury.kz", contact_person: "Динара Ахметова", contact_phone: "+7 703 456 7890", contact_email: "dinara@haileybury.kz", instagram_url: "https://instagram.com/haileybury_almaty", facebook_url: "https://facebook.com/haileybury.almaty", meta_ad_account_id: "act_3456789012", monthly_budget_kzt: 600000, color: "#059669", created_by: ADMIN_ID },
    { id: "44444444-4444-4444-4444-444444444444", name: "Колледж ОСШО", short_name: "ОСШО", type: "college", description: "Отраслевой специализированный колледж", city: "Караганда", website_url: "https://ossho.kz", contact_person: "Бауыржан Касымов", contact_phone: "+7 704 567 8901", contact_email: "baurzhan@ossho.kz", instagram_url: "https://instagram.com/ossho_college", telegram_url: "https://t.me/ossho_college", monthly_budget_kzt: 500000, color: "#D97706", created_by: ADMIN_ID },
    { id: "55555555-5555-5555-5555-555555555555", name: "РФМШ", short_name: "РФМШ", type: "school", description: "Республиканская физико-математическая школа", city: "Астана", website_url: "https://rfms.edu.kz", contact_person: "Гульнар Тлеубаева", contact_phone: "+7 705 678 9012", contact_email: "gulnar@rfms.edu.kz", instagram_url: "https://instagram.com/rfms_astana", telegram_url: "https://t.me/rfms_official", youtube_url: "https://youtube.com/@rfms", meta_ad_account_id: "act_5678901234", google_ads_customer_id: "567-890-1234", monthly_budget_kzt: 500000, color: "#DC2626", created_by: ADMIN_ID },
    { id: "66666666-6666-6666-6666-666666666666", name: "Колледж Мирас", short_name: "Мирас", type: "college", description: "Международный колледж Мирас", city: "Шымкент", website_url: "https://miras.edu.kz", contact_person: "Алия Жумабаева", contact_phone: "+7 706 789 0123", contact_email: "aliya@miras.edu.kz", instagram_url: "https://instagram.com/miras_college", telegram_url: "https://t.me/miras_college", tiktok_url: "https://tiktok.com/@miras_college", monthly_budget_kzt: 500000, color: "#EC4899", created_by: ADMIN_ID },
  ], { onConflict: "id" }).select("id, short_name");

  if (projErr) console.error("❌ Projects:", projErr.message);
  else console.log(`✅ Projects: ${projects.length} upserted`);

  // 2. Project Members
  const { error: pmErr } = await supabase.from("project_members").upsert([
    { project_id: "11111111-1111-1111-1111-111111111111", user_id: ADMIN_ID, role_in_project: "lead" },
    { project_id: "22222222-2222-2222-2222-222222222222", user_id: ADMIN_ID, role_in_project: "lead" },
    { project_id: "33333333-3333-3333-3333-333333333333", user_id: ADMIN_ID, role_in_project: "lead" },
    { project_id: "44444444-4444-4444-4444-444444444444", user_id: ADMIN_ID, role_in_project: "lead" },
    { project_id: "55555555-5555-5555-5555-555555555555", user_id: ADMIN_ID, role_in_project: "lead" },
    { project_id: "66666666-6666-6666-6666-666666666666", user_id: ADMIN_ID, role_in_project: "lead" },
  ], { onConflict: "project_id,user_id" });

  if (pmErr) console.error("❌ Project Members:", pmErr.message);
  else console.log("✅ Project Members: 6 upserted");

  // 3. Task Boards
  const { error: tbErr } = await supabase.from("task_boards").upsert([
    { id: "b1111111-1111-1111-1111-111111111111", project_id: "11111111-1111-1111-1111-111111111111", name: "Основная доска" },
    { id: "b2222222-2222-2222-2222-222222222222", project_id: "22222222-2222-2222-2222-222222222222", name: "Основная доска" },
    { id: "b3333333-3333-3333-3333-333333333333", project_id: "33333333-3333-3333-3333-333333333333", name: "Основная доска" },
  ], { onConflict: "id" });

  if (tbErr) console.error("❌ Task Boards:", tbErr.message);
  else console.log("✅ Task Boards: 3 upserted");

  // 4. Task Columns
  const { error: tcErr } = await supabase.from("task_columns").upsert([
    { id: "c0000001-0000-0000-0000-000000000001", board_id: "b1111111-1111-1111-1111-111111111111", name: "Бэклог", color: "#6B7280", sort_order: 0 },
    { id: "c0000001-0000-0000-0000-000000000002", board_id: "b1111111-1111-1111-1111-111111111111", name: "К выполнению", color: "#3B82F6", sort_order: 1 },
    { id: "c0000001-0000-0000-0000-000000000003", board_id: "b1111111-1111-1111-1111-111111111111", name: "В работе", color: "#F59E0B", sort_order: 2 },
    { id: "c0000001-0000-0000-0000-000000000004", board_id: "b1111111-1111-1111-1111-111111111111", name: "На согласовании", color: "#8B5CF6", sort_order: 3 },
    { id: "c0000001-0000-0000-0000-000000000005", board_id: "b1111111-1111-1111-1111-111111111111", name: "Готово", color: "#10B981", sort_order: 4 },
    { id: "c0000002-0000-0000-0000-000000000001", board_id: "b2222222-2222-2222-2222-222222222222", name: "Бэклог", color: "#6B7280", sort_order: 0 },
    { id: "c0000002-0000-0000-0000-000000000002", board_id: "b2222222-2222-2222-2222-222222222222", name: "К выполнению", color: "#3B82F6", sort_order: 1 },
    { id: "c0000002-0000-0000-0000-000000000003", board_id: "b2222222-2222-2222-2222-222222222222", name: "В работе", color: "#F59E0B", sort_order: 2 },
    { id: "c0000002-0000-0000-0000-000000000004", board_id: "b2222222-2222-2222-2222-222222222222", name: "На согласовании", color: "#8B5CF6", sort_order: 3 },
    { id: "c0000002-0000-0000-0000-000000000005", board_id: "b2222222-2222-2222-2222-222222222222", name: "Готово", color: "#10B981", sort_order: 4 },
  ], { onConflict: "id" });

  if (tcErr) console.error("❌ Task Columns:", tcErr.message);
  else console.log("✅ Task Columns: 10 upserted");

  // 5. Tasks
  const { error: taskErr } = await supabase.from("tasks").upsert([
    { id: "a0000001-0000-0000-0000-000000000001", column_id: "c0000001-0000-0000-0000-000000000001", project_id: "11111111-1111-1111-1111-111111111111", title: "Подготовить контент-план на март", description: "Составить план публикаций для Instagram и Telegram на март", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "medium", category: "content", due_date: "2026-03-05", sort_order: 0, labels: ["планирование"] },
    { id: "a0000001-0000-0000-0000-000000000002", column_id: "c0000001-0000-0000-0000-000000000001", project_id: "11111111-1111-1111-1111-111111111111", title: "Обновить баннеры на сайте", description: "Новые баннеры для приёмной кампании 2026", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "low", category: "design", due_date: "2026-03-15", sort_order: 1, labels: ["дизайн", "сайт"] },
    { id: "a0000001-0000-0000-0000-000000000003", column_id: "c0000001-0000-0000-0000-000000000002", project_id: "11111111-1111-1111-1111-111111111111", title: "Настроить ретаргетинг Meta Ads", description: "Создать аудитории и запустить ретаргетинг", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "high", category: "target", due_date: "2026-03-01", sort_order: 0, labels: ["meta", "реклама"] },
    { id: "a0000001-0000-0000-0000-000000000004", column_id: "c0000001-0000-0000-0000-000000000003", project_id: "11111111-1111-1111-1111-111111111111", title: "Создать баннеры для Stories", description: "5 баннеров для Instagram Stories — приёмка", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "high", category: "design", due_date: "2026-02-28", sort_order: 0, labels: ["instagram", "stories"] },
    { id: "a0000001-0000-0000-0000-000000000005", column_id: "c0000001-0000-0000-0000-000000000004", project_id: "11111111-1111-1111-1111-111111111111", title: "Утвердить видео для Reels", description: "Видео о школе для Instagram Reels", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "medium", category: "smm", due_date: "2026-02-27", sort_order: 0, labels: ["видео", "reels"] },
    { id: "a0000001-0000-0000-0000-000000000006", column_id: "c0000001-0000-0000-0000-000000000005", project_id: "11111111-1111-1111-1111-111111111111", title: "Запустить кампанию Google Ads", description: "Поисковая кампания по ключевым запросам", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "urgent", category: "target", due_date: "2026-02-25", sort_order: 0, labels: ["google", "поиск"] },
    { id: "a0000002-0000-0000-0000-000000000001", column_id: "c0000002-0000-0000-0000-000000000001", project_id: "22222222-2222-2222-2222-222222222222", title: "Анализ конкурентов в Instagram", description: "Проанализировать аккаунты конкурентных вузов", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "medium", category: "smm", due_date: "2026-03-10", sort_order: 0, labels: ["исследование"] },
    { id: "a0000002-0000-0000-0000-000000000002", column_id: "c0000002-0000-0000-0000-000000000003", project_id: "22222222-2222-2222-2222-222222222222", title: "Запуск кампании летний набор", description: "Meta Ads кампания для летнего набора 2026", assignee_id: ADMIN_ID, created_by: ADMIN_ID, priority: "urgent", category: "target", due_date: "2026-03-01", sort_order: 0, labels: ["meta", "набор"] },
  ], { onConflict: "id" });

  if (taskErr) console.error("❌ Tasks:", taskErr.message);
  else console.log("✅ Tasks: 8 upserted");

  // 6. Content Posts
  const { error: cpErr } = await supabase.from("content_posts").upsert([
    { id: "d0000001-0000-0000-0000-000000000001", project_id: "11111111-1111-1111-1111-111111111111", title: "День открытых дверей НИШ", body: "Приглашаем на день открытых дверей!", post_type: "carousel", platform: "instagram", scheduled_at: "2026-03-01T10:00:00+06:00", status: "scheduled", author_id: ADMIN_ID, created_by: ADMIN_ID },
    { id: "d0000001-0000-0000-0000-000000000002", project_id: "11111111-1111-1111-1111-111111111111", title: "Итоги олимпиады", body: "Наши ученики заняли призовые места!", post_type: "image", platform: "instagram", scheduled_at: "2026-02-25T12:00:00+06:00", status: "published", author_id: ADMIN_ID, created_by: ADMIN_ID, actual_reach: 15200, actual_likes: 342, actual_comments: 28 },
    { id: "d0000001-0000-0000-0000-000000000003", project_id: "11111111-1111-1111-1111-111111111111", title: "Видео-тур по школе", body: "Виртуальная экскурсия по НИШ Астана", post_type: "reels", platform: "instagram", scheduled_at: "2026-03-05T14:00:00+06:00", status: "in_review", author_id: ADMIN_ID, created_by: ADMIN_ID },
    { id: "d0000001-0000-0000-0000-000000000004", project_id: "11111111-1111-1111-1111-111111111111", title: "Приёмка 2026 — старт", body: "Объявляем начало приёма документов", post_type: "text", platform: "telegram", scheduled_at: "2026-03-10T09:00:00+06:00", status: "draft", author_id: ADMIN_ID, created_by: ADMIN_ID },
    { id: "d0000002-0000-0000-0000-000000000001", project_id: "22222222-2222-2222-2222-222222222222", title: "IITU Open Doors", body: "День открытых дверей IITU", post_type: "video", platform: "youtube", scheduled_at: "2026-03-03T11:00:00+06:00", status: "approved", author_id: ADMIN_ID, created_by: ADMIN_ID },
    { id: "d0000002-0000-0000-0000-000000000002", project_id: "22222222-2222-2222-2222-222222222222", title: "IT-хакатон 2026", body: "Регистрация на хакатон открыта!", post_type: "carousel", platform: "instagram", scheduled_at: "2026-03-08T15:00:00+06:00", status: "scheduled", author_id: ADMIN_ID, created_by: ADMIN_ID },
  ], { onConflict: "id" });

  if (cpErr) console.error("❌ Content Posts:", cpErr.message);
  else console.log("✅ Content Posts: 6 upserted");

  // 7. Budget Records
  const { error: brErr } = await supabase.from("budget_records").upsert([
    { project_id: "11111111-1111-1111-1111-111111111111", month: "2026-02-01", channel: "meta_ads", planned_budget_kzt: 350000, actual_spend_kzt: 310000 },
    { project_id: "11111111-1111-1111-1111-111111111111", month: "2026-02-01", channel: "google_ads", planned_budget_kzt: 250000, actual_spend_kzt: 220000 },
    { project_id: "11111111-1111-1111-1111-111111111111", month: "2026-02-01", channel: "influencer", planned_budget_kzt: 100000, actual_spend_kzt: 80000 },
    { project_id: "11111111-1111-1111-1111-111111111111", month: "2026-02-01", channel: "seo", planned_budget_kzt: 50000, actual_spend_kzt: 40000 },
    { project_id: "11111111-1111-1111-1111-111111111111", month: "2026-02-01", channel: "email", planned_budget_kzt: 30000, actual_spend_kzt: 0 },
    { project_id: "11111111-1111-1111-1111-111111111111", month: "2026-02-01", channel: "other", planned_budget_kzt: 20000, actual_spend_kzt: 0 },
    { project_id: "22222222-2222-2222-2222-222222222222", month: "2026-02-01", channel: "meta_ads", planned_budget_kzt: 300000, actual_spend_kzt: 270000 },
    { project_id: "22222222-2222-2222-2222-222222222222", month: "2026-02-01", channel: "google_ads", planned_budget_kzt: 200000, actual_spend_kzt: 180000 },
    { project_id: "22222222-2222-2222-2222-222222222222", month: "2026-02-01", channel: "influencer", planned_budget_kzt: 100000, actual_spend_kzt: 70000 },
    { project_id: "33333333-3333-3333-3333-333333333333", month: "2026-02-01", channel: "meta_ads", planned_budget_kzt: 280000, actual_spend_kzt: 250000 },
    { project_id: "33333333-3333-3333-3333-333333333333", month: "2026-02-01", channel: "google_ads", planned_budget_kzt: 200000, actual_spend_kzt: 180000 },
    { project_id: "33333333-3333-3333-3333-333333333333", month: "2026-02-01", channel: "influencer", planned_budget_kzt: 70000, actual_spend_kzt: 50000 },
    { project_id: "44444444-4444-4444-4444-444444444444", month: "2026-02-01", channel: "meta_ads", planned_budget_kzt: 250000, actual_spend_kzt: 200000 },
    { project_id: "44444444-4444-4444-4444-444444444444", month: "2026-02-01", channel: "google_ads", planned_budget_kzt: 150000, actual_spend_kzt: 150000 },
    { project_id: "55555555-5555-5555-5555-555555555555", month: "2026-02-01", channel: "meta_ads", planned_budget_kzt: 200000, actual_spend_kzt: 180000 },
    { project_id: "55555555-5555-5555-5555-555555555555", month: "2026-02-01", channel: "google_ads", planned_budget_kzt: 150000, actual_spend_kzt: 100000 },
    { project_id: "66666666-6666-6666-6666-666666666666", month: "2026-02-01", channel: "meta_ads", planned_budget_kzt: 150000, actual_spend_kzt: 120000 },
    { project_id: "66666666-6666-6666-6666-666666666666", month: "2026-02-01", channel: "google_ads", planned_budget_kzt: 100000, actual_spend_kzt: 50000 },
  ], { onConflict: "project_id,month,channel" });

  if (brErr) console.error("❌ Budget Records:", brErr.message);
  else console.log("✅ Budget Records: 18 upserted");

  // 8. Activity Log
  const { error: alErr } = await supabase.from("activity_log").insert([
    { user_id: ADMIN_ID, project_id: "11111111-1111-1111-1111-111111111111", action: "Опубликовал пост \"Итоги олимпиады\"", entity_type: "content_post", details: { platform: "instagram" } },
    { user_id: ADMIN_ID, project_id: "22222222-2222-2222-2222-222222222222", action: "Создал кампанию \"Летний набор\"", entity_type: "ad_campaign", details: { platform: "meta" } },
    { user_id: ADMIN_ID, project_id: "11111111-1111-1111-1111-111111111111", action: "Изменил бюджет на март", entity_type: "budget", details: { amount: 800000 } },
    { user_id: ADMIN_ID, project_id: "33333333-3333-3333-3333-333333333333", action: "Добавил задачу \"Баннеры для Stories\"", entity_type: "task", details: {} },
    { user_id: ADMIN_ID, project_id: "55555555-5555-5555-5555-555555555555", action: "Обновил контакты проекта", entity_type: "project", details: {} },
  ]);

  if (alErr) console.error("❌ Activity Log:", alErr.message);
  else console.log("✅ Activity Log: 5 inserted");

  // Verify
  const { count } = await supabase.from("projects").select("id", { count: "exact", head: true });
  console.log(`\n📊 Verification: ${count} projects in DB`);
  console.log("🎉 Seed complete!");
}

seed().catch(console.error);
