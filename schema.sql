-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  preferred_theme TEXT DEFAULT 'dark',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Markets table
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  default_lot_config JSONB,
  currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Strategies table
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  sl NUMERIC,
  target NUMERIC,
  pnl NUMERIC,
  pnl_percent NUMERIC,
  net_pnl NUMERIC,
  fees NUMERIC,
  screenshot_url TEXT,
  notes TEXT,
  emotion_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mistake Tags table
CREATE TABLE mistake_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trade Mistake Tags (Many-to-Many)
CREATE TABLE trade_mistake_tags (
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  mistake_tag_id UUID REFERENCES mistake_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, mistake_tag_id)
);

-- Checklists table
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  market_type TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Checklist Items table
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Checklist Responses table (linked to a trade or just standalone)
CREATE TABLE checklist_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  date TEXT, -- YYYY-MM-DD if standalone
  checklist_item_id UUID REFERENCES checklist_items(id) ON DELETE CASCADE NOT NULL,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Daily Journal table
CREATE TABLE daily_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  reflection_text TEXT,
  mood_score TEXT,
  market_bias TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistake_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_mistake_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_journal ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own markets" ON markets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own markets" ON markets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own markets" ON markets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own markets" ON markets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own strategies" ON strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own strategies" ON strategies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategies" ON strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own strategies" ON strategies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mistake tags" ON mistake_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own mistake tags" ON mistake_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mistake tags" ON mistake_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own mistake tags" ON mistake_tags FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trade mistake tags" ON trade_mistake_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_mistake_tags.trade_id AND trades.user_id = auth.uid())
);
CREATE POLICY "Users can insert own trade mistake tags" ON trade_mistake_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_mistake_tags.trade_id AND trades.user_id = auth.uid())
);
CREATE POLICY "Users can delete own trade mistake tags" ON trade_mistake_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_mistake_tags.trade_id AND trades.user_id = auth.uid())
);

CREATE POLICY "Users can view own checklists" ON checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own checklists" ON checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklists" ON checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklists" ON checklists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own checklist items" ON checklist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM checklists WHERE checklists.id = checklist_items.checklist_id AND checklists.user_id = auth.uid())
);
CREATE POLICY "Users can update own checklist items" ON checklist_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM checklists WHERE checklists.id = checklist_items.checklist_id AND checklists.user_id = auth.uid())
);
CREATE POLICY "Users can insert own checklist items" ON checklist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM checklists WHERE checklists.id = checklist_items.checklist_id AND checklists.user_id = auth.uid())
);
CREATE POLICY "Users can delete own checklist items" ON checklist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM checklists WHERE checklists.id = checklist_items.checklist_id AND checklists.user_id = auth.uid())
);

CREATE POLICY "Users can view own checklist responses" ON checklist_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own checklist responses" ON checklist_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklist responses" ON checklist_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklist responses" ON checklist_responses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily journal" ON daily_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own daily journal" ON daily_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily journal" ON daily_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily journal" ON daily_journal FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);
CREATE POLICY "Screenshot upload policy" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Screenshot read policy" ON storage.objects FOR SELECT USING (
  bucket_id = 'screenshots' -- Public bucket, or restrict to user
);
CREATE POLICY "Screenshot delete policy" ON storage.objects FOR DELETE USING (
  bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
