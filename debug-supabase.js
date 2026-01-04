/**
 * Debug Supabase - Check what's happening
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDM4NDUsImV4cCI6MjA4Mjc3OTg0NX0.s96pM1jNZKu9811IwGyhTNH-EfBat2jFo9BmV21mRS0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('🔍 Debugging Supabase...\n');

  // Try to insert a simple company
  console.log('1️⃣ Attempting to insert a test company...');
  const { data: insertData, error: insertError } = await supabase
    .from('companies')
    .insert({ name: 'Test Company' })
    .select();

  if (insertError) {
    console.error('❌ Insert failed:', insertError);
  } else {
    console.log('✅ Insert succeeded:', insertData);
  }

  // Check if we can read it back
  console.log('\n2️⃣ Reading all companies...');
  const { data: companies, error: readError } = await supabase
    .from('companies')
    .select('*');

  if (readError) {
    console.error('❌ Read failed:', readError);
  } else {
    console.log('✅ Companies found:', companies?.length || 0);
    console.log('Data:', companies);
  }

  // Check brand_customizations table
  console.log('\n3️⃣ Checking brand_customizations...');
  const { data: brands, error: brandError } = await supabase
    .from('brand_customizations')
    .select('*');

  if (brandError) {
    console.error('❌ Brand customizations read failed:', brandError);
  } else {
    console.log('✅ Brand customizations found:', brands?.length || 0);
  }

  // Check campaigns
  console.log('\n4️⃣ Checking campaigns...');
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('*');

  if (campaignError) {
    console.error('❌ Campaigns read failed:', campaignError);
  } else {
    console.log('✅ Campaigns found:', campaigns?.length || 0);
  }
}

debug().then(() => process.exit(0));
