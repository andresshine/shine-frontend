-- Fix RLS Policies for Public Interview Access
-- This migration adds public read access to campaigns, companies, and brand_customizations
-- so that unauthenticated users can view interview sessions

-- ============================================
-- PUBLIC READ ACCESS FOR CAMPAIGNS
-- ============================================

-- Allow anyone to read campaigns (needed for public interview sessions)
CREATE POLICY "Public read access to campaigns"
  ON campaigns FOR SELECT
  USING (true);

-- ============================================
-- PUBLIC READ ACCESS FOR COMPANIES
-- ============================================

-- Allow anyone to read companies (needed for public interview sessions)
CREATE POLICY "Public read access to companies"
  ON companies FOR SELECT
  USING (true);

-- ============================================
-- PUBLIC READ ACCESS FOR BRAND CUSTOMIZATIONS
-- ============================================

-- Allow anyone to read brand customizations (needed for public interview sessions)
CREATE POLICY "Public read access to brand_customizations"
  ON brand_customizations FOR SELECT
  USING (true);
