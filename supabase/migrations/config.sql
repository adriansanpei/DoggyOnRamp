-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bot_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default config
INSERT INTO bot_config (key, value) VALUES ('referral_min_mxn', '10') ON CONFLICT (key) DO NOTHING;
INSERT INTO bot_config (key, value) VALUES ('referral_reward_doggy', '2000') ON CONFLICT (key) DO NOTHING;
