-- 1. Enable UUID Extension (Use modern uuid-ossp instead of ossp-uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up any existing bad tables or triggers (Don't worry, this only removes conflicting schemas)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- It's safer to recreate the tables with the EXACT camelCase naming required by the app. 
-- Note: the double quotes are important! E.g. "userId" instead of user_id for some tables.

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  email text,
  role text default 'USER',
  subscription text default 'FREE',
  expiry_date timestamp with time zone,
  country text,
  is_blocked boolean default false,
  profile_pic text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles to prevent infinite recursion from old policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END
$$;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (true);

-- TRIGGER FOR AUTH USERS (This fixes the "Database error saving new user")
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'username', ''));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- PREDICTIONS
CREATE TABLE IF NOT EXISTS public.predictions (
  id uuid default uuid_generate_v4() primary key,
  league text,
  match text,
  tip text,
  odds text,
  "kickoffTime" text,
  category text,
  result text default 'PENDING',
  date text,
  score text
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "predictions_all" ON predictions;
CREATE POLICY "predictions_all" ON predictions FOR ALL USING (true);

-- PAYMENT_REQUESTS (Requires exact "userId", "proofUrl" casing)
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid default uuid_generate_v4() primary key,
  "userId" uuid references auth.users(id) on delete cascade,
  username text,
  plan text,
  amount text,
  "proofUrl" text,
  status text default 'PENDING',
  date text,
  method text
);
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_all" ON payment_requests;
CREATE POLICY "payments_all" ON payment_requests FOR ALL USING (true);

-- APP_CONFIG (Requires exact camelCase fields)
CREATE TABLE IF NOT EXISTS public.app_config (
  id integer primary key,
  currency text default 'XAF',
  exchange_rate numeric default 600,
  logo text,
  "momoNumber" text default '',
  "momoName" text default '',
  "btcAddress" text default '',
  "usdtAddress" text default '',
  "ltcAddress" text default '',
  "ethAddress" text default '',
  "solAddress" text default '',
  ticker_speed integer default 20,
  youtube_video_id text default 'qXf6n3m03sA',
  popup jsonb default '{"active": false, "title": "", "content": ""}'::jsonb,
  prices jsonb default '{"VIP": 10, "VVIP": 30}'::jsonb
);
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS youtube_video_id text default 'qXf6n3m03sA';
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "config_all" ON app_config;
CREATE POLICY "config_all" ON app_config FOR ALL USING (true);

-- Insert default config
INSERT INTO public.app_config (id, currency, exchange_rate, popup, prices)
VALUES (1, 'XAF', 600, '{"active": false, "title": "", "content": ""}'::jsonb, '{"VIP": 10, "VVIP": 30}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- SUPPORT_MESSAGES (Requires exact "userId", "adminReply", "replyDate" casing)
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  "userId" uuid references auth.users(id) on delete cascade,
  username text,
  content text,
  date text,
  "adminReply" text,
  "replyDate" text
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_all" ON support_messages;
CREATE POLICY "support_all" ON support_messages FOR ALL USING (true);

-- TESTIMONIALS (Uses user_id, profile_pic)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  username text,
  profile_pic text,
  content text,
  rating integer,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testimonials_all" ON testimonials;
CREATE POLICY "testimonials_all" ON testimonials FOR ALL USING (true);

-- COUPONS (Uses "isActive")
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique,
  discount integer,
  "isActive" boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_all" ON coupons;
CREATE POLICY "coupons_all" ON coupons FOR ALL USING (true);

-- TICKER_MESSAGES
CREATE TABLE IF NOT EXISTS public.ticker_messages (
  id uuid default uuid_generate_v4() primary key,
  content text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE public.ticker_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticker_all" ON ticker_messages;
CREATE POLICY "ticker_all" ON ticker_messages FOR ALL USING (true);

-- STORAGE BUCKETS
-- It creates a bucket named "payment_proofs" and sets it public
insert into storage.buckets (id, name, public) values ('payment_proofs', 'payment_proofs', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('profiles', 'profiles', true) on conflict do nothing;

-- Reload schema cache to ensure column alterations reflect immediately on the PostgREST API
NOTIFY pgrst, 'reload schema';
