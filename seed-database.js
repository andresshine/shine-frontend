/**
 * Seed Database Script
 * Run with: node seed-database.js
 * Uses service role key to bypass RLS policies
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0';

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedDatabase() {
  console.log('🌱 Seeding Supabase Database...\n');

  try {
    // 1. Insert companies
    console.log('1️⃣ Inserting companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .insert([
        { id: '00000000-0000-0000-0000-000000000001', name: 'Acme Corp', logo_url: null },
        { id: '00000000-0000-0000-0000-000000000002', name: 'TechStartup Inc', logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200' },
        { id: '00000000-0000-0000-0000-000000000003', name: 'Demo Company', logo_url: null }
      ])
      .select();

    if (companiesError) {
      console.error('❌ Failed to insert companies:', companiesError);
      return false;
    }
    console.log('✅ Inserted', companies.length, 'companies');

    // 2. Insert brand customizations
    console.log('\n2️⃣ Inserting brand customizations...');
    const { data: brands, error: brandsError } = await supabase
      .from('brand_customizations')
      .insert([
        {
          company_id: '00000000-0000-0000-0000-000000000001',
          primary_color: '#8F84C2',
          secondary_color: '#FB7185',
          tertiary_color: '#D19648',
          button_style: 'gradient',
          corner_radius: 16,
          font_family: 'Inter'
        },
        {
          company_id: '00000000-0000-0000-0000-000000000002',
          primary_color: '#3B82F6',
          secondary_color: '#8B5CF6',
          tertiary_color: '#EC4899',
          button_style: 'solid',
          corner_radius: 12,
          font_family: 'Poppins'
        },
        {
          company_id: '00000000-0000-0000-0000-000000000003',
          primary_color: '#8F84C2',
          secondary_color: '#FB7185',
          tertiary_color: '#D19648',
          button_style: 'gradient',
          corner_radius: 16,
          font_family: 'Inter'
        }
      ])
      .select();

    if (brandsError) {
      console.error('❌ Failed to insert brand customizations:', brandsError);
      return false;
    }
    console.log('✅ Inserted', brands.length, 'brand customizations');

    // 3. Insert campaigns
    console.log('\n3️⃣ Inserting campaigns...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .insert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          company_id: '00000000-0000-0000-0000-000000000001',
          name: 'Customer Success Stories',
          description: 'Collect video testimonials from satisfied customers',
          questions: [
            { id: 'q_role_001', text: 'What is your role, team size, and industry?', intent: 'Establishing context about your position and organization to help viewers relate to your experience.' },
            { id: 'q_problem_001', text: 'What problem were you trying to solve before using our product?', intent: 'Identifying the core pain points and challenges you faced that led you to seek a solution.' },
            { id: 'q_alternatives_001', text: 'What alternatives or previous solutions were you using, and why did you switch?', intent: 'Understanding your decision-making process and what made our product stand out from competitors.' },
            { id: 'q_onboarding_001', text: 'What was the setup or onboarding experience like? Any integration hurdles?', intent: 'Capturing honest feedback about the initial implementation and any technical challenges encountered.' },
            { id: 'q_results_001', text: 'What results have you seen since implementing the product?', intent: 'Highlighting tangible outcomes and business impact from using our solution.' },
            { id: 'q_metrics_001', text: 'Can you share any specific metrics or ROI (time-to-value, $, %, hours saved, etc.)?', intent: 'Quantifying the value with concrete numbers that demonstrate measurable success.' },
            { id: 'q_feature_001', text: 'What feature or capability has delivered the most value?', intent: 'Identifying the key functionality that drives the most benefit for your use case.' },
            { id: 'q_challenges_001', text: 'What limitation or challenge have you experienced, and how did you work around it?', intent: 'Providing balanced perspective on areas for improvement and practical solutions you have found.' },
            { id: 'q_support_001', text: 'How responsive or effective has support been?', intent: 'Sharing your experience with our customer success and technical support teams.' },
            { id: 'q_surprise_001', text: 'What surprised you most about using the product?', intent: 'Uncovering unexpected benefits or delightful moments that exceeded your expectations.' },
            { id: 'q_recommendation_001', text: 'Would you recommend us to someone else? Why? (0–10 scale allowed)', intent: 'Measuring your likelihood to recommend and understanding the key reasons behind your advocacy.' },
            { id: 'q_permission_001', text: 'Is it okay for us to quote you using your name, title, and company?', intent: 'Obtaining permission to use your testimonial in marketing materials with proper attribution.' }
          ]
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          company_id: '00000000-0000-0000-0000-000000000002',
          name: 'Quick Feedback',
          description: 'Short 5-question testimonial collection',
          questions: [
            { id: 'q_role_001', text: 'What is your role, team size, and industry?', intent: 'Establishing context about your position and organization to help viewers relate to your experience.' },
            { id: 'q_problem_001', text: 'What problem were you trying to solve before using our product?', intent: 'Identifying the core pain points and challenges you faced that led you to seek a solution.' },
            { id: 'q_results_001', text: 'What results have you seen since implementing the product?', intent: 'Highlighting tangible outcomes and business impact from using our solution.' },
            { id: 'q_feature_001', text: 'What feature or capability has delivered the most value?', intent: 'Identifying the key functionality that drives the most benefit for your use case.' },
            { id: 'q_recommendation_001', text: 'Would you recommend us to someone else? Why?', intent: 'Measuring your likelihood to recommend and understanding the key reasons behind your advocacy.' }
          ]
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          company_id: '00000000-0000-0000-0000-000000000003',
          name: 'Demo Campaign',
          description: 'Medium-length testimonial collection',
          questions: [
            { id: 'q_role_001', text: 'What is your role, team size, and industry?' },
            { id: 'q_problem_001', text: 'What problem were you trying to solve?' },
            { id: 'q_alternatives_001', text: 'What alternatives were you using?' },
            { id: 'q_results_001', text: 'What results have you seen?' },
            { id: 'q_metrics_001', text: 'Can you share specific metrics?' },
            { id: 'q_recommendation_001', text: 'Would you recommend us?' }
          ]
        }
      ])
      .select();

    if (campaignsError) {
      console.error('❌ Failed to insert campaigns:', campaignsError);
      return false;
    }
    console.log('✅ Inserted', campaigns.length, 'campaigns');

    // 4. Insert sessions
    console.log('\n4️⃣ Inserting sessions...');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .insert([
        {
          session_id: 'session_abc123',
          campaign_id: '00000000-0000-0000-0000-000000000001',
          company_id: '00000000-0000-0000-0000-000000000001',
          status: 'pending',
          expires_at: expiresAt.toISOString()
        },
        {
          session_id: 'session_xyz789',
          campaign_id: '00000000-0000-0000-0000-000000000002',
          company_id: '00000000-0000-0000-0000-000000000002',
          status: 'pending',
          expires_at: expiresAt.toISOString()
        },
        {
          session_id: 'session_demo',
          campaign_id: '00000000-0000-0000-0000-000000000003',
          company_id: '00000000-0000-0000-0000-000000000003',
          status: 'pending',
          expires_at: expiresAt.toISOString()
        }
      ])
      .select();

    if (sessionsError) {
      console.error('❌ Failed to insert sessions:', sessionsError);
      return false;
    }
    console.log('✅ Inserted', sessions.length, 'sessions');

    console.log('\n🎉 Database seeded successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

seedDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
