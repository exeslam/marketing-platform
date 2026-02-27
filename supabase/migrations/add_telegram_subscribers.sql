-- Telegram subscribers table for bot notifications
CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  telegram_username TEXT UNIQUE NOT NULL,
  chat_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_username ON telegram_subscribers(telegram_username);
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_active ON telegram_subscribers(is_active) WHERE is_active = true;
