-- Initial schema for Vibe Labs Kids
-- Run with: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'profiles_handle_check') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_handle_check CHECK (handle ~ '^[a-z0-9_]{3,20}$');
  END IF;
END $$;

-- Profile directory for searching
CREATE TABLE IF NOT EXISTS profile_directory (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  share_id TEXT UNIQUE,
  current_revision_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'visibility') THEN
    ALTER TABLE games ADD COLUMN visibility TEXT DEFAULT 'private';
    ALTER TABLE games ADD CONSTRAINT games_visibility_check CHECK (visibility IN ('private', 'public'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'share_id') THEN
    ALTER TABLE games ADD COLUMN share_id TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'current_revision_id') THEN
    ALTER TABLE games ADD COLUMN current_revision_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'updated_at') THEN
    ALTER TABLE games ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Game revisions table
CREATE TABLE IF NOT EXISTS game_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  message TEXT NOT NULL,
  code_html TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_revisions' AND column_name = 'version_number') THEN
    ALTER TABLE game_revisions ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_revisions' AND column_name = 'message') THEN
    ALTER TABLE game_revisions ADD COLUMN message TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_revisions' AND column_name = 'code_html') THEN
    ALTER TABLE game_revisions ADD COLUMN code_html TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_revisions' AND column_name = 'created_by') THEN
    ALTER TABLE game_revisions ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Game shares table
CREATE TABLE IF NOT EXISTS game_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, shared_with_user_id)
);

-- Friendships table (for future friends-only sharing)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_owner_id ON games(owner_id);
CREATE INDEX IF NOT EXISTS idx_games_current_revision_id ON games(current_revision_id);
CREATE INDEX IF NOT EXISTS idx_game_revisions_game_id ON game_revisions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_revisions_version ON game_revisions(game_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_game_shares_game_id ON game_shares(game_id);
CREATE INDEX IF NOT EXISTS idx_game_shares_user_id ON game_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_directory_handle ON profile_directory(handle);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update profile_directory on profile change
CREATE OR REPLACE FUNCTION sync_profile_directory()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profile_directory (id, handle, display_name)
  VALUES (NEW.id, NEW.handle, NEW.display_name)
  ON CONFLICT (id) DO UPDATE SET
    handle = EXCLUDED.handle,
    display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_directory_trigger ON profiles;
CREATE TRIGGER sync_profile_directory_trigger AFTER INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION sync_profile_directory();

-- RLS Policies

-- Profiles: users can read/update own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Profile directory: public read for searching
ALTER TABLE profile_directory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profile_directory" ON profile_directory;
CREATE POLICY "Public read profile_directory" ON profile_directory FOR SELECT USING (true);

-- Games: users can CRUD own games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own games" ON games;
CREATE POLICY "Users can view own games" ON games FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can insert own games" ON games;
CREATE POLICY "Users can insert own games" ON games FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can update own games" ON games;
CREATE POLICY "Users can update own games" ON games FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can delete own games" ON games;
CREATE POLICY "Users can delete own games" ON games FOR DELETE USING (auth.uid() = owner_id);

-- Shared games: users can read games shared with them
DROP POLICY IF EXISTS "Users can view shared games" ON games;
CREATE POLICY "Users can view shared games" ON games FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM game_shares
    WHERE game_shares.game_id = games.id
    AND game_shares.shared_with_user_id = auth.uid()
  )
);

-- Game revisions: users can CRUD revisions for own games
ALTER TABLE game_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view revisions for own games" ON game_revisions;
CREATE POLICY "Users can view revisions for own games" ON game_revisions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_revisions.game_id
    AND games.owner_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can view revisions for shared games" ON game_revisions;
CREATE POLICY "Users can view revisions for shared games" ON game_revisions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM games
    JOIN game_shares ON game_shares.game_id = games.id
    WHERE games.id = game_revisions.game_id
    AND game_shares.shared_with_user_id = auth.uid()
    AND game_revisions.id = games.current_revision_id
  )
);
DROP POLICY IF EXISTS "Users can insert revisions for own games" ON game_revisions;
CREATE POLICY "Users can insert revisions for own games" ON game_revisions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_revisions.game_id
    AND games.owner_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can update revisions for own games" ON game_revisions;
CREATE POLICY "Users can update revisions for own games" ON game_revisions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_revisions.game_id
    AND games.owner_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can delete revisions for own games" ON game_revisions;
CREATE POLICY "Users can delete revisions for own games" ON game_revisions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_revisions.game_id
    AND games.owner_id = auth.uid()
  )
);

-- Game shares: users can CRUD shares for own games
ALTER TABLE game_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view shares for own games" ON game_shares;
CREATE POLICY "Users can view shares for own games or where shared with them" ON game_shares FOR SELECT USING (
  EXISTS (SELECT 1 FROM games WHERE games.id = game_shares.game_id AND games.owner_id = auth.uid()) OR
  game_shares.shared_with_user_id = auth.uid()
);
DROP POLICY IF EXISTS "Users can insert shares for own games" ON game_shares;
CREATE POLICY "Users can insert shares for own games" ON game_shares FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_shares.game_id
    AND games.owner_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can delete shares for own games" ON game_shares;
CREATE POLICY "Users can delete shares for own games" ON game_shares FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_shares.game_id
    AND games.owner_id = auth.uid()
  )
);

-- Friendships: users can CRUD own friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
DROP POLICY IF EXISTS "Users can insert own friendships" ON friendships;
CREATE POLICY "Users can insert own friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
CREATE POLICY "Users can update own friendships" ON friendships FOR UPDATE USING (auth.uid() = addressee_id);
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
CREATE POLICY "Users can delete own friendships" ON friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Force schema cache refresh
ALTER TABLE game_shares ADD COLUMN temp_refresh TEXT;
ALTER TABLE game_shares DROP COLUMN temp_refresh;