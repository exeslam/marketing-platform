export type Role = "admin" | "manager" | "marketer" | "viewer";
export type ProjectType = "school" | "university" | "college";
export type ProjectStatus = "active" | "paused" | "archived";
export type ProjectMemberRole = "lead" | "member" | "viewer";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskCategory =
  | "smm"
  | "target"
  | "seo"
  | "email"
  | "influencer"
  | "design"
  | "content"
  | "other";
export type ContentPostType =
  | "image"
  | "video"
  | "carousel"
  | "reels"
  | "stories"
  | "text"
  | "article"
  | "event";
export type ContentPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "telegram"
  | "linkedin"
  | "website";
export type ContentStatus =
  | "idea"
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";
export type AdPlatform = "meta" | "google";
export type BudgetChannel =
  | "meta_ads"
  | "google_ads"
  | "influencer"
  | "seo"
  | "email"
  | "other";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: Role;
  phone: string | null;
  position: string | null;
  telegram_username: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  short_name: string | null;
  type: ProjectType;
  description: string | null;
  city: string | null;
  address: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  telegram_url: string | null;
  meta_ad_account_id: string | null;
  meta_page_id: string | null;
  google_ads_customer_id: string | null;
  monthly_budget_kzt: number;
  status: ProjectStatus;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_in_project: ProjectMemberRole;
  assigned_at: string;
  profile?: Profile;
}

export interface TaskBoard {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface TaskColumn {
  id: string;
  board_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  created_by: string;
  priority: TaskPriority;
  category: TaskCategory | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  sort_order: number;
  labels: string[];
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface AdPlatformConnection {
  id: string;
  project_id: string;
  platform: AdPlatform;
  account_id: string;
  account_name: string | null;
  currency: string;
  is_connected: boolean;
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdCampaign {
  id: string;
  platform_id: string;
  project_id: string;
  external_id: string;
  name: string;
  status: string | null;
  objective: string | null;
  daily_budget_kzt: number | null;
  lifetime_budget_kzt: number | null;
  start_date: string | null;
  end_date: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface AdMetricsDaily {
  id: string;
  campaign_id: string;
  project_id: string;
  platform: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend_kzt: number;
  link_clicks: number;
  ctr: number;
  cpc_kzt: number;
  cpm_kzt: number;
  conversions: number;
  conversion_value_kzt: number;
  cost_per_conversion_kzt: number;
  likes: number;
  comments: number;
  shares: number;
  video_views: number;
  frequency: number;
  created_at: string;
}

export interface ContentPost {
  id: string;
  project_id: string;
  title: string | null;
  body: string | null;
  post_type: ContentPostType;
  platform: ContentPlatform;
  scheduled_at: string | null;
  published_at: string | null;
  status: ContentStatus;
  author_id: string | null;
  reviewer_id: string | null;
  media_urls: string[];
  thumbnail_url: string | null;
  hashtags: string[];
  caption: string | null;
  actual_reach: number | null;
  actual_likes: number | null;
  actual_comments: number | null;
  actual_shares: number | null;
  notes: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  reviewer?: Profile;
}

export interface BudgetRecord {
  id: string;
  project_id: string;
  month: string;
  channel: BudgetChannel;
  planned_budget_kzt: number;
  actual_spend_kzt: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TelegramSubscriber {
  id: string;
  user_id: string | null;
  telegram_username: string;
  chat_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
