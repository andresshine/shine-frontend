/**
 * Debug Session Fetch
 * Test why sessions aren't loading in the browser
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDM4NDUsImV4cCI6MjA4Mjc3OTg0NX0.s96pM1jNZKu9811IwGyhTNH-EfBat2jFo9BmV21mRS0';

const supabase = createClient(supabaseUrl, anonKey);

async function debugSessionFetch() {
  console.log('🔍 Debugging session fetch...\n');

  const sessionId = 'session_abc123';

  // Test 1: Simple session query
  console.log('1️⃣ Testing simple session query...');
  const { data: session1, error: error1 } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error1) {
    console.error('❌ Error:', error1);
  } else {
    console.log('✅ Session found:', session1?.session_id);
  }

  // Test 2: Query with campaigns join
  console.log('\n2️⃣ Testing with campaigns join...');
  const { data: session2, error: error2 } = await supabase
    .from('sessions')
    .select(`
      *,
      campaigns (
        id,
        name,
        questions
      )
    `)
    .eq('session_id', sessionId)
    .single();

  if (error2) {
    console.error('❌ Error:', error2);
  } else {
    console.log('✅ Session with campaign:', session2?.session_id);
    console.log('   Campaign:', session2?.campaigns?.name);
  }

  // Test 3: Full query as in the app
  console.log('\n3️⃣ Testing full query (like in app)...');
  const { data: session3, error: error3 } = await supabase
    .from('sessions')
    .select(`
      *,
      campaigns (
        id,
        name,
        questions
      ),
      companies (
        id,
        name,
        logo_url
      ),
      brand_customizations:companies!inner (
        primary_color,
        secondary_color,
        tertiary_color,
        button_style,
        corner_radius,
        font_family,
        brandmark_light_url,
        brandmark_dark_url
      )
    `)
    .eq('session_id', sessionId)
    .single();

  if (error3) {
    console.error('❌ Error:', error3);
    console.error('Full error object:', JSON.stringify(error3, null, 2));
  } else {
    console.log('✅ Full session data retrieved!');
    console.log('   Session:', session3?.session_id);
    console.log('   Company:', session3?.companies?.name);
    console.log('   Campaign:', session3?.campaigns?.name);
  }
}

debugSessionFetch();
