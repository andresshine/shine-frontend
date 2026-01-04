/**
 * Test Session Fetch Fix
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDM4NDUsImV4cCI6MjA4Mjc3OTg0NX0.s96pM1jNZKu9811IwGyhTNH-EfBat2jFo9BmV21mRS0';

const supabase = createClient(supabaseUrl, anonKey);

async function testSessionFix() {
  console.log('🧪 Testing session fetch fix...\n');

  const sessionId = 'session_abc123';

  // Step 1: Fetch session with campaign and company
  const { data: session, error: sessionError } = await supabase
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
      )
    `)
    .eq('session_id', sessionId)
    .single();

  if (sessionError) {
    console.error('❌ Error fetching session:', sessionError);
    return;
  }

  console.log('✅ Session fetched:', session.session_id);
  console.log('   Company:', session.companies.name);
  console.log('   Campaign:', session.campaigns.name);
  console.log('   Questions:', session.campaigns.questions.length);

  // Step 2: Fetch brand customization separately
  const { data: brandCustomization, error: brandError } = await supabase
    .from('brand_customizations')
    .select('*')
    .eq('company_id', session.company_id)
    .single();

  if (brandError) {
    console.error('❌ Error fetching brand:', brandError);
  } else {
    console.log('\n✅ Brand customization fetched:');
    console.log('   Primary color:', brandCustomization.primary_color);
    console.log('   Button style:', brandCustomization.button_style);
    console.log('   Font:', brandCustomization.font_family);
  }

  console.log('\n🎉 Session fetch working correctly!\n');
}

testSessionFix();
