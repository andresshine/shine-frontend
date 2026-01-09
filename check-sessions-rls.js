/**
 * Check Sessions RLS with both keys
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDM4NDUsImV4cCI6MjA4Mjc3OTg0NX0.s96pM1jNZKu9811IwGyhTNH-EfBat2jFo9BmV21mRS0';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0';

async function checkRLS() {
  console.log('🔍 Checking Sessions RLS...\n');

  // Test with service role
  console.log('1️⃣ Service role key:');
  const supabaseService = createClient(supabaseUrl, serviceKey);
  const { data: serviceSessions, error: serviceError } = await supabaseService
    .from('sessions')
    .select('session_id, status');

  if (serviceError) {
    console.error('❌ Error:', serviceError);
  } else {
    console.log('✅ Sessions found:', serviceSessions.length);
    serviceSessions.forEach(s => console.log(`   - ${s.session_id}`));
  }

  // Test with anon key
  console.log('\n2️⃣ Anon key (public):');
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  const { data: anonSessions, error: anonError } = await supabaseAnon
    .from('sessions')
    .select('session_id, status');

  if (anonError) {
    console.error('❌ Error:', anonError);
  } else {
    console.log('✅ Sessions found:', anonSessions.length);
    if (anonSessions.length === 0) {
      console.log('⚠️  RLS policy is blocking anon read access!');
    }
  }
}

checkRLS();
