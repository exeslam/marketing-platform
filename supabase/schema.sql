-- =============================================
-- Marketing Platform — Полная схема БД
-- Выполнить в Supabase SQL Editor
-- =============================================

-- USERS & AUTH
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'manager', 'marketer', 'viewer')),
  phone TEXT,
  position TEXT,
  telegram_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('school', 'university', 'college')),
  description TEXT,
  city TEXT,
  address TEXT,
  website_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  telegram_url TEXT,
  meta_ad_account_id TEXT,
  meta_page_id TEXT,
  google_ads_customer_id TEXT,
  monthly_budget_kzt NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  color TEXT DEFAULT '#2563EB',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_project TEXT DEFAULT 'member'
    CHECK (role_in_project IN ('lead', 'member', 'viewer')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- TASKS (Kanban)
CREATE TABLE public.task_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Основная доска',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.task_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.task_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.task_columns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.profiles(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT CHECK (category IN ('smm', 'target', 'seo', 'email', 'influencer', 'design', 'content', 'other')),
  due_date DATE,
  start_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TARGET ANALYTICS
CREATE TABLE public.ad_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  account_id TEXT NOT NULL,
  account_name TEXT,
  currency TEXT DEFAULT 'KZT',
  is_connected BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, platform)
);

CREATE TABLE public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES public.ad_platforms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  objective TEXT,
  daily_budget_kzt NUMERIC(12,2),
  lifetime_budget_kzt NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform_id, external_id)
);

CREATE TABLE public.ad_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend_kzt NUMERIC(12,2) DEFAULT 0,
  link_clicks BIGINT DEFAULT 0,
  ctr NUMERIC(6,4) DEFAULT 0,
  cpc_kzt NUMERIC(10,2) DEFAULT 0,
  cpm_kzt NUMERIC(10,2) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  conversion_value_kzt NUMERIC(12,2) DEFAULT 0,
  cost_per_conversion_kzt NUMERIC(10,2) DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  frequency NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- CONTENT PLAN
CREATE TABLE public.content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  post_type TEXT NOT NULL CHECK (post_type IN ('image', 'video', 'carousel', 'reels', 'stories', 'text', 'article', 'event')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'telegram', 'linkedin', 'website')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected')),
  author_id UUID REFERENCES public.profiles(id),
  reviewer_id UUID REFERENCES public.profiles(id),
  media_urls TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  caption TEXT,
  actual_reach BIGINT,
  actual_likes BIGINT,
  actual_comments BIGINT,
  actual_shares BIGINT,
  notes TEXT,
  rejection_reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.content_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BUDGET
CREATE TABLE public.budget_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('meta_ads', 'google_ads', 'influencer', 'seo', 'email', 'other')),
  planned_budget_kzt NUMERIC(12,2) DEFAULT 0,
  actual_spend_kzt NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, month, channel)
);

-- ACTIVITY LOG
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  project_id UUID REFERENCES public.projects(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_due', 'content_review', 'budget_alert', 'system')),
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_column_id ON public.tasks(column_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_ad_metrics_campaign_date ON public.ad_metrics_daily(campaign_id, date);
CREATE INDEX idx_ad_metrics_project_date ON public.ad_metrics_daily(project_id, date);
CREATE INDEX idx_content_posts_project_scheduled ON public.content_posts(project_id, scheduled_at);
CREATE INDEX idx_content_posts_status ON public.content_posts(status);
CREATE INDEX idx_budget_records_project_month ON public.budget_records(project_id, month);
CREATE INDEX idx_activity_log_project ON public.activity_log(project_id, created_at DESC);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: admins see all, members see assigned
CREATE POLICY "Admins full access to projects" ON public.projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Members can view assigned projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

-- Project members
CREATE POLICY "Admins manage project members" ON public.project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Members view project members" ON public.project_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid())
);

-- Tasks: project members can manage
CREATE POLICY "Project members manage tasks" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Task comments
CREATE POLICY "Project members manage task comments" ON public.task_comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_comments.task_id AND pm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Content posts
CREATE POLICY "Project members manage content" ON public.content_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = content_posts.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications: users see own
CREATE POLICY "Users view own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Budget: project members can view, admins/managers can edit
CREATE POLICY "Project members view budget" ON public.budget_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = budget_records.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage budget" ON public.budget_records FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Activity log: project members can view
CREATE POLICY "Project members view activity" ON public.activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = activity_log.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Authenticated users insert activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ad platforms & campaigns & metrics: project members can view
CREATE POLICY "Project members view ad platforms" ON public.ad_platforms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = ad_platforms.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage ad platforms" ON public.ad_platforms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Project members view campaigns" ON public.ad_campaigns FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = ad_campaigns.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Project members view metrics" ON public.ad_metrics_daily FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = ad_metrics_daily.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Task boards & columns: project members
CREATE POLICY "Project members manage boards" ON public.task_boards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = task_boards.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Board members manage columns" ON public.task_columns FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.task_boards b
    JOIN public.project_members pm ON pm.project_id = b.project_id
    WHERE b.id = task_columns.board_id AND pm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Task attachments
CREATE POLICY "Project members manage attachments" ON public.task_attachments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_attachments.task_id AND pm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Content post comments
CREATE POLICY "Project members manage post comments" ON public.content_post_comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.content_posts p
    JOIN public.project_members pm ON pm.project_id = p.project_id
    WHERE p.id = content_post_comments.post_id AND pm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
