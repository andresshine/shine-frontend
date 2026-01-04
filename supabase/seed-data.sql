-- Seed Data for Shine Database
-- Run this AFTER creating the tables

-- Insert demo companies
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
