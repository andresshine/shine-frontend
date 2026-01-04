-- Shine Database Schema
-- Complete schema for video testimonial platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COMPANIES TABLE
-- Stores company/organization information
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BRAND_CUSTOMIZATIONS TABLE
-- Stores brand theming for each company
-- ============================================
CREATE TABLE brand_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  brandmark_light_url TEXT,
  brandmark_dark_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#8F84C2',
  secondary_color TEXT NOT NULL DEFAULT '#FB7185',
  tertiary_color TEXT NOT NULL DEFAULT '#D19648',
  button_style TEXT NOT NULL DEFAULT 'gradient' CHECK (button_style IN ('solid', 'gradient')),
  corner_radius INTEGER NOT NULL DEFAULT 16 CHECK (corner_radius IN (4, 8, 12, 16, 24)),
  font_family TEXT NOT NULL DEFAULT 'Inter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- ============================================
-- CAMPAIGNS TABLE
-- Stores campaign configurations with questions
-- ============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSIONS TABLE
-- Individual interview sessions for respondents
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  respondent_email TEXT,
  respondent_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
  current_question_index INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast session_id lookups
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_campaign_id ON sessions(campaign_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- ============================================
-- RECORDINGS TABLE
-- Individual question recordings within a session
-- ============================================
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  duration_seconds DECIMAL(10, 2),
  transcription TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  video_status TEXT DEFAULT 'processing' CHECK (video_status IN ('processing', 'ready', 'failed')),
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for recordings
CREATE INDEX idx_recordings_session_id ON recordings(session_id);
CREATE INDEX idx_recordings_mux_asset_id ON recordings(mux_asset_id);

-- ============================================
-- USERS TABLE (for admin/company users)
-- Manages authentication and access
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_customizations_updated_at BEFORE UPDATE ON brand_customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - COMPANIES
-- ============================================

-- Users can read their own company
CREATE POLICY "Users can read own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their own company
CREATE POLICY "Users can update own company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - BRAND_CUSTOMIZATIONS
-- ============================================

-- Users can read their company's brand customization
CREATE POLICY "Users can read own company brand"
  ON brand_customizations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their company's brand customization
CREATE POLICY "Users can update own company brand"
  ON brand_customizations FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can insert brand customization for their company
CREATE POLICY "Users can insert own company brand"
  ON brand_customizations FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - CAMPAIGNS
-- ============================================

-- Users can read their company's campaigns
CREATE POLICY "Users can read own company campaigns"
  ON campaigns FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can create campaigns for their company
CREATE POLICY "Users can create own company campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their company's campaigns
CREATE POLICY "Users can update own company campaigns"
  ON campaigns FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete their company's campaigns
CREATE POLICY "Users can delete own company campaigns"
  ON campaigns FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - SESSIONS
-- ============================================

-- Anyone can read sessions by session_id (for interview page)
-- This allows respondents to access their interview without auth
CREATE POLICY "Public read access by session_id"
  ON sessions FOR SELECT
  USING (true);

-- Users can read their company's sessions
CREATE POLICY "Users can read own company sessions"
  ON sessions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can create sessions for their company
CREATE POLICY "Users can create own company sessions"
  ON sessions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their company's sessions
CREATE POLICY "Users can update own company sessions"
  ON sessions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Sessions can be updated by session_id (for recording progress)
CREATE POLICY "Public update by session_id"
  ON sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS POLICIES - RECORDINGS
-- ============================================

-- Anyone can read recordings for a session
CREATE POLICY "Public read access to recordings"
  ON recordings FOR SELECT
  USING (true);

-- Anyone can insert recordings (for interview page)
CREATE POLICY "Public insert recordings"
  ON recordings FOR INSERT
  WITH CHECK (true);

-- Users can read their company's recordings
CREATE POLICY "Users can read own company recordings"
  ON recordings FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS POLICIES - USERS
-- ============================================

-- Users can read their own user record
CREATE POLICY "Users can read own user"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own user record
CREATE POLICY "Users can update own user"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- SEED DATA (for testing)
-- ============================================

-- Insert demo company
INSERT INTO companies (id, name, logo_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp', NULL),
  ('00000000-0000-0000-0000-000000000002', 'TechStartup Inc', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200'),
  ('00000000-0000-0000-0000-000000000003', 'Demo Company', NULL);

-- Insert brand customizations
INSERT INTO brand_customizations (company_id, primary_color, secondary_color, tertiary_color, button_style, corner_radius, font_family) VALUES
  ('00000000-0000-0000-0000-000000000001', '#8F84C2', '#FB7185', '#D19648', 'gradient', 16, 'Inter'),
  ('00000000-0000-0000-0000-000000000002', '#3B82F6', '#8B5CF6', '#EC4899', 'solid', 12, 'Poppins'),
  ('00000000-0000-0000-0000-000000000003', '#8F84C2', '#FB7185', '#D19648', 'gradient', 16, 'Inter');

-- Insert demo campaigns with questions
INSERT INTO campaigns (id, company_id, name, description, questions) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Customer Success Stories',
    'Collect video testimonials from satisfied customers',
    '[
      {"id": "q_role_001", "text": "What is your role, team size, and industry?", "intent": "Establishing context about your position and organization to help viewers relate to your experience."},
      {"id": "q_problem_001", "text": "What problem were you trying to solve before using our product?", "intent": "Identifying the core pain points and challenges you faced that led you to seek a solution."},
      {"id": "q_alternatives_001", "text": "What alternatives or previous solutions were you using, and why did you switch?", "intent": "Understanding your decision-making process and what made our product stand out from competitors."},
      {"id": "q_onboarding_001", "text": "What was the setup or onboarding experience like? Any integration hurdles?", "intent": "Capturing honest feedback about the initial implementation and any technical challenges encountered."},
      {"id": "q_results_001", "text": "What results have you seen since implementing the product?", "intent": "Highlighting tangible outcomes and business impact from using our solution."},
      {"id": "q_metrics_001", "text": "Can you share any specific metrics or ROI (time-to-value, $, %, hours saved, etc.)?", "intent": "Quantifying the value with concrete numbers that demonstrate measurable success."},
      {"id": "q_feature_001", "text": "What feature or capability has delivered the most value?", "intent": "Identifying the key functionality that drives the most benefit for your use case."},
      {"id": "q_challenges_001", "text": "What limitation or challenge have you experienced, and how did you work around it?", "intent": "Providing balanced perspective on areas for improvement and practical solutions you have found."},
      {"id": "q_support_001", "text": "How responsive or effective has support been?", "intent": "Sharing your experience with our customer success and technical support teams."},
      {"id": "q_surprise_001", "text": "What surprised you most about using the product?", "intent": "Uncovering unexpected benefits or delightful moments that exceeded your expectations."},
      {"id": "q_recommendation_001", "text": "Would you recommend us to someone else? Why? (0–10 scale allowed)", "intent": "Measuring your likelihood to recommend and understanding the key reasons behind your advocacy."},
      {"id": "q_permission_001", "text": "Is it okay for us to quote you using your name, title, and company?", "intent": "Obtaining permission to use your testimonial in marketing materials with proper attribution."}
    ]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Quick Feedback',
    'Short 5-question testimonial collection',
    '[
      {"id": "q_role_001", "text": "What is your role, team size, and industry?", "intent": "Establishing context about your position and organization to help viewers relate to your experience."},
      {"id": "q_problem_001", "text": "What problem were you trying to solve before using our product?", "intent": "Identifying the core pain points and challenges you faced that led you to seek a solution."},
      {"id": "q_results_001", "text": "What results have you seen since implementing the product?", "intent": "Highlighting tangible outcomes and business impact from using our solution."},
      {"id": "q_feature_001", "text": "What feature or capability has delivered the most value?", "intent": "Identifying the key functionality that drives the most benefit for your use case."},
      {"id": "q_recommendation_001", "text": "Would you recommend us to someone else? Why?", "intent": "Measuring your likelihood to recommend and understanding the key reasons behind your advocacy."}
    ]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Demo Campaign',
    'Medium-length testimonial collection',
    '[
      {"id": "q_role_001", "text": "What is your role, team size, and industry?"},
      {"id": "q_problem_001", "text": "What problem were you trying to solve?"},
      {"id": "q_alternatives_001", "text": "What alternatives were you using?"},
      {"id": "q_results_001", "text": "What results have you seen?"},
      {"id": "q_metrics_001", "text": "Can you share specific metrics?"},
      {"id": "q_recommendation_001", "text": "Would you recommend us?"}
    ]'::jsonb
  );

-- Insert demo sessions
INSERT INTO sessions (session_id, campaign_id, company_id, status, expires_at) VALUES
  ('session_abc123', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'pending', NOW() + INTERVAL '30 days'),
  ('session_xyz789', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'pending', NOW() + INTERVAL '30 days'),
  ('session_demo', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'pending', NOW() + INTERVAL '30 days');
