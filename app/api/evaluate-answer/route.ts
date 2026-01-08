import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { evaluateWithRules, getGenericFollowUp } from '@/lib/evaluation/rulesEngine';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EVALUATOR_SYSTEM_PROMPT = `# Role
You are evaluating customer interview responses to determine if they have enough substance for testimonial and marketing purposes.

# Context
You are part of a structured customer interview system. Customers are answering questions on video about their experience with a product. Your job is to evaluate each answer and decide:
1. Is this answer complete enough to move on?
2. If not, what specific follow-up would extract more value?

# Evaluation Philosophy
We want to capture authentic, valuable testimonial content WITHOUT making the interview feel like an interrogation. Balance these priorities:
- **Extract value**: Look for metrics, quotes, specific benefits, before/after comparisons
- **Respect the user**: Don't nitpick every answer or demand perfection
- **Be strategic**: Only follow up when there's clear testimonial value to be gained

# What Makes an Answer "Complete"
An answer is COMPLETE if it contains ANY of the following:
- A specific metric or quantifiable result (time saved, % improvement, etc.)
- A quotable statement expressing satisfaction or enthusiasm
- A concrete before/after comparison
- Mention of specific features and how they helped
- A genuine emotional response (excitement, relief, satisfaction)
- A clear recommendation or endorsement

An answer can also be COMPLETE if:
- It's a simple factual question (role, company size) and they answered it
- They gave a reasonable response even if brief
- The question doesn't lend itself to deep testimonial content

# When to Request Follow-Up
Only request follow-up when:
- They gave a vague answer to a question that SHOULD yield testimonial gold
- They mentioned something intriguing but didn't elaborate (e.g., "it saved us a lot of time")
- They skipped a key part of a multi-part question
- There's an obvious opportunity to capture a metric or quote

Do NOT request follow-up when:
- They answered the question reasonably, even if briefly
- You're just being perfectionist
- The additional info would be nice-to-have, not need-to-have
- They've already given you something quotable

# Follow-Up Style
When you do request follow-up, make it:
- Very specific (not "tell me more" but "how much time does that save weekly?")
- Short (6 words max)
- Encouraging, not demanding
- Focused on extracting ONE specific thing

Examples of good follow-ups:
- "Roughly how much time saved?"
- "Any specific numbers on that?"
- "Which feature helped most?"
- "What were you using before?"

Examples of bad follow-ups:
- "Can you elaborate more on that?"
- "Tell me more about your experience"
- "Could you provide more details?"

# High-Value Extraction Opportunities
Be alert for chances to capture:
- **Metrics**: Time saved, cost reduction, % improvements, cycle time, conversion rates
- **Quotes**: Enthusiastic statements, recommendations, emotional reactions
- **Before/After**: What was painful before, what's better now
- **Features**: Specific product capabilities they value
- **Soundbites**: Punchy, memorable phrases

If they hint at any of these but don't deliver specifics, THAT'S when to follow up.`;

export async function POST(request: NextRequest) {
  try {
    const { question, transcript, questionContext } = await request.json();

    // Don't evaluate if transcript is too short
    if (!transcript || transcript.trim().length < 15) {
      return NextResponse.json({
        isComplete: false,
        confidence: 0,
        followUp: null,
        reason: 'transcript_too_short'
      });
    }

    // =========================================
    // STEP 1: Try rules-based evaluation first
    // =========================================
    const rulesResult = evaluateWithRules(question, transcript);

    // If rules engine gave a definitive answer, use it (faster & cheaper)
    if (!rulesResult.usedAI) {
      console.log(`⚡ [Evaluation] Rules engine handled: ${rulesResult.ruleId || 'fallback'}`);

      if (rulesResult.extractedValue) {
        console.log('📊 Extracted testimonial value:', rulesResult.extractedValue);
      }

      return NextResponse.json({
        isComplete: rulesResult.isComplete,
        confidence: rulesResult.confidence,
        followUp: rulesResult.followUp,
        extractedValue: rulesResult.extractedValue,
        evaluatedBy: 'rules',
        ruleId: rulesResult.ruleId,
      });
    }

    // =========================================
    // STEP 2: Fall back to AI for nuanced cases
    // =========================================
    console.log(`🤖 [Evaluation] Falling back to AI (rule: ${rulesResult.ruleId || 'none'})`);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: EVALUATOR_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `INTERVIEW QUESTION: "${question}"
${questionContext ? `QUESTION CONTEXT: ${questionContext}` : ''}

CUSTOMER'S ANSWER (transcribed): "${transcript}"

Evaluate this answer. Remember:
- Be lenient - if they gave something usable, approve it
- Only follow up if there's clear value to extract
- Follow-ups must be specific and short (6 words max)

Respond with ONLY valid JSON, no markdown code blocks, no explanations before or after:
{
  "isComplete": boolean,
  "confidence": 0-100,
  "followUp": "specific short prompt" or null,
  "extractedValue": "brief note on what testimonial value was captured" or null
}`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      // Remove markdown code blocks and trim
      let cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

      // Extract just the JSON object if there's extra text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const result = JSON.parse(cleanedText);

      // Log extracted value for debugging/analytics
      if (result.extractedValue) {
        console.log('📊 Extracted testimonial value:', result.extractedValue);
      }

      return NextResponse.json({
        ...result,
        evaluatedBy: 'ai',
        ruleId: rulesResult.ruleId, // Include which rule was attempted
      });
    } catch (parseError) {
      console.error('Failed to parse Claude response:', text);
      // Default to complete on parse error to not block the user
      return NextResponse.json({
        isComplete: true,
        confidence: 50,
        followUp: null,
        reason: 'parse_error_defaulted',
        evaluatedBy: 'error',
      });
    }
  } catch (error) {
    console.error('Evaluation API error:', error);
    // Default to complete on error to not block the user
    return NextResponse.json({
      isComplete: true,
      confidence: 50,
      followUp: null,
      reason: 'api_error_defaulted',
      evaluatedBy: 'error',
    });
  }
}
