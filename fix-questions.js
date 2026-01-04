/**
 * Fix Campaign Questions
 * Updates campaigns with the full question sets
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uhtuxvbwlttsrhcbxeou.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixQuestions() {
  console.log('🔧 Fixing campaign questions...\n');

  // Campaign 1: Customer Success Stories (12 questions)
  console.log('1️⃣ Updating Customer Success Stories...');
  const { error: error1 } = await supabase
    .from('campaigns')
    .update({
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
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  if (error1) {
    console.error('❌ Failed:', error1);
  } else {
    console.log('✅ Updated with 12 questions');
  }

  // Campaign 2: Quick Feedback (5 questions)
  console.log('\n2️⃣ Updating Quick Feedback...');
  const { error: error2 } = await supabase
    .from('campaigns')
    .update({
      questions: [
        { id: 'q_role_001', text: 'What is your role, team size, and industry?', intent: 'Establishing context about your position and organization to help viewers relate to your experience.' },
        { id: 'q_problem_001', text: 'What problem were you trying to solve before using our product?', intent: 'Identifying the core pain points and challenges you faced that led you to seek a solution.' },
        { id: 'q_results_001', text: 'What results have you seen since implementing the product?', intent: 'Highlighting tangible outcomes and business impact from using our solution.' },
        { id: 'q_feature_001', text: 'What feature or capability has delivered the most value?', intent: 'Identifying the key functionality that drives the most benefit for your use case.' },
        { id: 'q_recommendation_001', text: 'Would you recommend us to someone else? Why?', intent: 'Measuring your likelihood to recommend and understanding the key reasons behind your advocacy.' }
      ]
    })
    .eq('id', '00000000-0000-0000-0000-000000000002');

  if (error2) {
    console.error('❌ Failed:', error2);
  } else {
    console.log('✅ Updated with 5 questions');
  }

  // Campaign 3: Demo Campaign (6 questions)
  console.log('\n3️⃣ Updating Demo Campaign...');
  const { error: error3 } = await supabase
    .from('campaigns')
    .update({
      questions: [
        { id: 'q_role_001', text: 'What is your role, team size, and industry?' },
        { id: 'q_problem_001', text: 'What problem were you trying to solve?' },
        { id: 'q_alternatives_001', text: 'What alternatives were you using?' },
        { id: 'q_results_001', text: 'What results have you seen?' },
        { id: 'q_metrics_001', text: 'Can you share specific metrics?' },
        { id: 'q_recommendation_001', text: 'Would you recommend us?' }
      ]
    })
    .eq('id', '00000000-0000-0000-0000-000000000003');

  if (error3) {
    console.error('❌ Failed:', error3);
  } else {
    console.log('✅ Updated with 6 questions');
  }

  // Verify the updates
  console.log('\n4️⃣ Verifying updates...');
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('name, questions')
    .order('name');

  campaigns?.forEach(c => {
    const count = c.questions?.length || 0;
    console.log(`   - ${c.name}: ${count} questions`);
  });

  console.log('\n✅ Questions updated successfully!\n');
}

fixQuestions();
