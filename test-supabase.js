/**
 * Supabase Connection Test
 * Run with: node test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDM4NDUsImV4cCI6MjA4Mjc3OTg0NX0.s96pM1jNZKu9811IwGyhTNH-EfBat2jFo9BmV21mRS0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  try {
    // Test 1: Check sessions table
    console.log('1️⃣ Testing sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('session_id, status')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Sessions query failed:', sessionsError.message);
      return false;
    }

    console.log('✅ Sessions found:', sessions.length);
    sessions.forEach(s => console.log(`   - ${s.session_id} (${s.status})`));

    // Test 2: Check companies table
    console.log('\n2️⃣ Testing companies table...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('name');

    if (companiesError) {
      console.error('❌ Companies query failed:', companiesError.message);
      return false;
    }

    console.log('✅ Companies found:', companies.length);
    companies.forEach(c => console.log(`   - ${c.name}`));

    // Test 3: Check campaigns with questions
    console.log('\n3️⃣ Testing campaigns table...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('name, questions');

    if (campaignsError) {
      console.error('❌ Campaigns query failed:', campaignsError.message);
      return false;
    }

    console.log('✅ Campaigns found:', campaigns.length);
    campaigns.forEach(c => {
      const questionCount = c.questions ? c.questions.length : 0;
      console.log(`   - ${c.name} (${questionCount} questions)`);
    });

    // Test 4: Fetch a specific session with related data
    console.log('\n4️⃣ Testing session with relations...');
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        session_id,
        status,
        campaigns (
          name,
          questions
        ),
        companies (
          name
        )
      `)
      .eq('session_id', 'session_abc123')
      .single();

    if (sessionError) {
      console.error('❌ Session with relations failed:', sessionError.message);
      return false;
    }

    console.log('✅ Session data retrieved:');
    console.log(`   Session: ${session.session_id}`);
    console.log(`   Company: ${session.companies.name}`);
    console.log(`   Campaign: ${session.campaigns.name}`);
    console.log(`   Questions: ${session.campaigns.questions.length}`);

    console.log('\n🎉 All tests passed! Supabase is connected and working correctly.\n');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
