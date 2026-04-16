-- UniRoomi Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campuses table
CREATE TABLE IF NOT EXISTS campuses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  coordinates POINT, -- PostGIS for location data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('residence', 'apartment', 'house', 'shared')),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  address TEXT NOT NULL,
  coordinates POINT,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id),
  images TEXT[], -- Array of image URLs
  amenities TEXT[], -- Array of amenities
  rooms_available INTEGER DEFAULT 1,
  total_rooms INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Properties table (user bookmarks)
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, accommodation_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false, -- Only verified tenants can review
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, accommodation_id)
);

-- Messages table (for user communication)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accommodations_university_id ON accommodations(university_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_campus_id ON accommodations(campus_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_owner_id ON accommodations(owner_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_price ON accommodations(price);
CREATE INDEX IF NOT EXISTS idx_accommodations_type ON accommodations(type);
CREATE INDEX IF NOT EXISTS idx_accommodations_is_active ON accommodations(is_active);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_accommodation_id ON saved_properties(accommodation_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_accommodation_id ON applications(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_accommodation_id ON reviews(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Accommodations policies
CREATE POLICY "Anyone can view active accommodations" ON accommodations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own accommodations" ON accommodations
  FOR ALL USING (auth.uid() = owner_id);

-- Saved properties policies
CREATE POLICY "Users can manage own saved properties" ON saved_properties
  FOR ALL USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Accommodation owners can view applications" ON applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM accommodations WHERE id = accommodation_id
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campuses_updated_at BEFORE UPDATE ON campuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON accommodations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample universities data
INSERT INTO universities (name, short_name, description, website) VALUES
('University of Cape Town', 'UCT', 'Leading research university in South Africa', 'https://www.uct.ac.za'),
('University of KwaZulu-Natal', 'UKZN', 'Premier African university of choice', 'https://www.ukzn.ac.za'),
('University of Witwatersrand', 'Wits', 'One of Africa''s premier research universities', 'https://www.wits.ac.za'),
('Durban University of Technology', 'DUT', 'Leading university of technology in South Africa', 'https://www.dut.ac.za')
ON CONFLICT (short_name) DO NOTHING;

-- Insert sample campuses data
INSERT INTO campuses (university_id, name, address) VALUES
((SELECT id FROM universities WHERE short_name = 'UCT'), 'Main Campus', 'Rondebosch, Cape Town'),
((SELECT id FROM universities WHERE short_name = 'UCT'), 'Medical Campus', 'Observatory, Cape Town'),
((SELECT id FROM universities WHERE short_name = 'UKZN'), 'Howard College', 'Durban'),
((SELECT id FROM universities WHERE short_name = 'UKZN'), 'Westville Campus', 'Durban'),
((SELECT id FROM universities WHERE short_name = 'Wits'), 'East Campus', 'Johannesburg'),
((SELECT id FROM universities WHERE short_name = 'Wits'), 'West Campus', 'Johannesburg')
ON CONFLICT DO NOTHING;

-- Create a view for accommodation listings with joins
CREATE VIEW accommodation_listings AS
SELECT 
  a.id,
  a.title,
  a.description,
  a.type,
  a.price,
  a.currency,
  a.address,
  a.images,
  a.amenities,
  a.rooms_available,
  a.total_rooms,
  a.is_verified,
  a.created_at,
  u.name as university_name,
  u.short_name as university_short_name,
  c.name as campus_name,
  up.first_name || ' ' || up.last_name as owner_name,
  up.email as owner_email
FROM accommodations a
LEFT JOIN universities u ON a.university_id = u.id
LEFT JOIN campuses c ON a.campus_id = c.id
LEFT JOIN user_profiles up ON a.owner_id = up.id
WHERE a.is_active = true;

-- Grant permissions on the view
GRANT SELECT ON accommodation_listings TO authenticated;
GRANT SELECT ON accommodation_listings TO anon;
