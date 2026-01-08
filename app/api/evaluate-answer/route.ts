import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { evaluateWithRules, getGenericFollowUp } from '@/lib/evaluation/rulesEngine';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EVALUATOR_SYSTEM_PROMPT = `# Role
You are a HARDCORE testimonial value extractor. Your job is to mine specific metrics, feature names, and quotable soundbites from customer interviews.

# Context
You are evaluating video testimonial answers. Marketing needs SPECIFIC numbers and feature names, not vague praise.

# CRITICAL RULE: If they give a soft answer, you MUST ask for the hard number ($ or hours) or the specific feature name.

# Soft Adjectives That NEED Follow-Up (unless they give a number too):
- "fast/quick/rapid/speedy" → Ask: "In terms of hours or days, how long exactly?"
- "expensive/costly" → Ask: "Subscription cost or labor cost? Rough estimate?"
- "slow/inefficient" → Ask: "How many hours per week were you losing?"
- "efficient/productive" → Ask: "Would you say 2x faster? 5x? What's the number?"
- "seamless/smooth" → Ask: "How many developer hours did that save?"
- "powerful/robust" → Ask: "What specific complex task did it handle?"
- "game-changer/transformative" → Ask: "If you had to quantify the impact on P&L?"

# What Makes an Answer COMPLETE (must have at least ONE):
- A specific NUMBER: hours, %, $, 2x/5x/10x multiplier
- A specific FEATURE NAME: not "automation" but "the auto-scheduling feature"
- A specific BEFORE/AFTER comparison with concrete details
- An NPS score (0-10) WITH an explanation
- A quotable soundbite that stands alone ("We couldn't live without it")

# What is NOT Complete:
- "It's faster" → Need: "How much faster? Hours? Days?"
- "Saved money" → Need: "Thousands or tens of thousands?"
- "The automation is great" → Need: "Which specific automation?"
- "Support is fast" → Need: "Minutes or hours response time?"
- "It's a game-changer" → Need: "What's the impact in numbers?"

# Follow-Up Rules:
1. ALWAYS ask for the number if they give only an adjective
2. ALWAYS ask for the feature name if they say generic terms
3. Keep follow-ups under 15 words but be SPECIFIC
4. Push gently but firmly for conservative estimates

# Example Follow-Ups:
- "How many hours per week does that save the team?"
- "Are we talking thousands or tens of thousands annually?"
- "What specific feature or workflow delivers that value?"
- "Would you estimate 2x improvement? 5x? Higher?"
- "Is that response time in minutes or hours?"

# When to APPROVE without follow-up:
- They gave a real number (even a rough estimate like "about 10 hours")
- They named a specific feature AND explained how they use it
- They gave a concrete before/after story with details
- Simple factual answers (role, team size, industry)

Remember: Vague praise is worthless for marketing. Numbers and specifics are GOLD.`;

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

Evaluate this answer with HARDCORE EXTRACTION mindset:
- If they gave a soft adjective (fast, efficient, great) WITHOUT a number → Request the number
- If they mentioned a generic term (automation, feature) WITHOUT specifics → Request the feature name
- If they gave vague praise WITHOUT concrete impact → Push for conservative estimate
- If they gave a NUMBER or SPECIFIC FEATURE NAME → Approve it

Respond with ONLY valid JSON, no markdown code blocks:
{
  "isComplete": boolean,
  "confidence": 0-100,
  "followUp": "specific follow-up targeting the missing number/feature" or null,
  "extractedValue": "what specific metric/feature/quote was captured" or null
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
