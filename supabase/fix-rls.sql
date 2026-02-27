-- =============================================
-- FIX: RLS infinite recursion (error 42P17)
-- project_members policy references itself → infinite loop
-- Solution: SECURITY DEFINER function bypasses RLS
-- =============================================

-- 1. Create helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop ALL existing policies that cause recursion

-- project_members
DROP POLICY IF EXISTS "Admins manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Members view project members" ON public.project_members;

-- projects
DROP POLICY IF EXISTS "Admins full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view assigned projects" ON public.projects;

-- tasks
DROP POLICY IF EXISTS "Project members manage tasks" ON public.tasks;

-- task_comments
DROP POLICY IF EXISTS "Project members manage task comments" ON public.task_comments;

-- task_boards
DROP POLICY IF EXISTS "Project members manage boards" ON public.task_boards;

-- task_columns
DROP POLICY IF EXISTS "Board members manage columns" ON public.task_columns;

-- task_attachments
DROP POLICY IF EXISTS "Project members manage attachments" ON public.task_attachments;

-- content_posts
DROP POLICY IF EXISTS "Project members manage content" ON public.content_posts;

-- content_post_comments
DROP POLICY IF EXISTS "Project members manage post comments" ON public.content_post_comments;

-- budget_records
DROP POLICY IF EXISTS "Project members view budget" ON public.budget_records;
DROP POLICY IF EXISTS "Admins manage budget" ON public.budget_records;

-- activity_log
DROP POLICY IF EXISTS "Project members view activity" ON public.activity_log;

-- ad_platforms
DROP POLICY IF EXISTS "Project members view ad platforms" ON public.ad_platforms;
DROP POLICY IF EXISTS "Admins manage ad platforms" ON public.ad_platforms;

-- ad_campaigns
DROP POLICY IF EXISTS "Project members view campaigns" ON public.ad_campaigns;

-- ad_metrics_daily
DROP POLICY IF EXISTS "Project members view metrics" ON public.ad_metrics_daily;


-- 3. Recreate ALL policies using SECURITY DEFINER functions (no recursion!)

-- project_members: use direct user_id check (no self-reference!)
CREATE POLICY "Members view own project memberships"
  ON public.project_members FOR SELECT
  USING (user_id = auth.uid() OR is_admin_or_manager());

CREATE POLICY "Admins manage project members"
  ON public.project_members FOR ALL
  USING (is_admin_or_manager());

-- projects
CREATE POLICY "Admins full access to projects"
  ON public.projects FOR ALL
  USING (is_admin());

CREATE POLICY "Members can view assigned projects"
  ON public.projects FOR SELECT
  USING (has_project_access(id));

-- tasks
CREATE POLICY "Project members manage tasks"
  ON public.tasks FOR ALL
  USING (has_project_access(project_id));

-- task_comments
CREATE POLICY "Project members manage task comments"
  ON public.task_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id AND has_project_access(t.project_id)
    )
  );

-- task_boards
CREATE POLICY "Project members manage boards"
  ON public.task_boards FOR ALL
  USING (has_project_access(project_id));

-- task_columns
CREATE POLICY "Board members manage columns"
  ON public.task_columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = task_columns.board_id AND has_project_access(b.project_id)
    )
  );

-- task_attachments
CREATE POLICY "Project members manage attachments"
  ON public.task_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_attachments.task_id AND has_project_access(t.project_id)
    )
  );

-- content_posts
CREATE POLICY "Project members manage content"
  ON public.content_posts FOR ALL
  USING (has_project_access(project_id));

-- content_post_comments
CREATE POLICY "Project members manage post comments"
  ON public.content_post_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.content_posts p
      WHERE p.id = content_post_comments.post_id AND has_project_access(p.project_id)
    )
  );

-- budget_records
CREATE POLICY "Project members view budget"
  ON public.budget_records FOR SELECT
  USING (has_project_access(project_id));

CREATE POLICY "Admins manage budget"
  ON public.budget_records FOR ALL
  USING (is_admin_or_manager());

-- activity_log
CREATE POLICY "Project members view activity"
  ON public.activity_log FOR SELECT
  USING (has_project_access(project_id));

-- ad_platforms
CREATE POLICY "Project members view ad platforms"
  ON public.ad_platforms FOR SELECT
  USING (has_project_access(project_id));

CREATE POLICY "Admins manage ad platforms"
  ON public.ad_platforms FOR ALL
  USING (is_admin_or_manager());

-- ad_campaigns
CREATE POLICY "Project members view campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (has_project_access(project_id));

-- ad_metrics_daily
CREATE POLICY "Project members view metrics"
  ON public.ad_metrics_daily FOR SELECT
  USING (has_project_access(project_id));
