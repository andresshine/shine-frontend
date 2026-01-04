/**
 * Verify Database Data
 * Uses service role key to check data
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verify() {
  console.log('🔍 Verifying data with service role key...\n');

  // Check companies
  const { data: companies } = await supabase.from('companies').select('*');
  console.log('Companies:', companies?.length || 0);

  // Check campaigns
  const { data: campaigns } = await supabase.from('campaigns').select('name, questions');
  console.log('Campaigns:', campaigns?.length || 0);
  campaigns?.forEach(c => console.log(`  - ${c.name} (${c.questions.length} questions)`));

  // Check sessions
  const { data: sessions } = await supabase.from('sessions').select('session_id, status');
  console.log('\nSessions:', sessions?.length || 0);
  sessions?.forEach(s => console.log(`  - ${s.session_id} (${s.status})`));

  // Test full query with relations
  console.log('\n✅ Testing session with relations...');
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      session_id,
      status,
      campaigns (name, questions),
      companies (name)
    `)
    .eq('session_id', 'session_abc123')
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('Session:', session.session_id);
    console.log('Company:', session.companies.name);
    console.log('Campaign:', session.campaigns.name);
    console.log('Questions:', session.campaigns.questions.length);
  }
}

verify();
