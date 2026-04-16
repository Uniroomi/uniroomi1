-- Enhanced User Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  bio TEXT,
  university_id UUID REFERENCES universities(id),
  student_id TEXT, -- University student ID
  graduation_year INTEGER,
  major TEXT,
  preferences JSONB DEFAULT '{}', -- User preferences (accommodation type, budget, etc.)
  is_verified BOOLEAN DEFAULT false,
  verification_documents TEXT[], -- Array of document URLs
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notification_settings JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
  privacy_settings JSONB DEFAULT '{"profile_public": false, "show_email": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Row Level Security policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow public view of basic profile info for verified users
CREATE POLICY "Public can view basic verified profiles" ON user_profiles
  FOR SELECT USING (
    is_verified = true AND 
    privacy_settings->>'profile_public' = 'true'
  );
