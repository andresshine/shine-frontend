/**
 * Rules Engine for Answer Evaluation
 * Evaluates answers using predefined rules before falling back to AI
 */

import {
  QUESTION_RULES,
  FALLBACK_CONFIG,
  METRIC_PATTERNS,
  COMPARISON_PATTERNS,
  ENTHUSIASM_PATTERNS,
  PAIN_PATTERNS,
  INDUSTRY_PATTERNS,
  TITLE_PATTERNS,
  NPS_PATTERNS,
  QuestionRule,
} from './questionRules';

export interface RulesEvaluationResult {
  isComplete: boolean;
  confidence: number;
  followUp: string | null;
  extractedValue: string | null;
  ruleId: string | null;      // Which rule was used
  usedAI: boolean;            // Whether AI fallback is needed
}

/**
 * Check if text contains any metric patterns
 */
function hasMetric(text: string): boolean {
  return METRIC_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if text contains comparison/before-after language
 */
function hasComparison(text: string): boolean {
  return COMPARISON_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if text contains enthusiasm/quotable language
 */
function hasEnthusiasm(text: string): boolean {
  return ENTHUSIASM_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if text contains pain point language
 */
function hasPainPoint(text: string): boolean {
  return PAIN_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if text mentions a specific industry/vertical
 */
function hasIndustry(text: string): boolean {
  return INDUSTRY_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if text mentions a job title
 */
function hasTitle(text: string): boolean {
  return TITLE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if text contains a specific feature name (not generic praise)
 */
function hasSpecificFeature(text: string): boolean {
  // Must mention something specific, not just "ease of use" or "everything"
  const genericPhrases = /(everything|all of it|ease of use|user friendly|simple|the whole thing)/i;
  const specificFeature = /(reporting|dashboard|analytics|automation|integration|workflow|api|notification|alert|export|import|sync|template|scheduler|trigger)/i;

  // Has specific feature name and not just generic praise
  return specificFeature.test(text) ||
    (/(the |our )?\w+( feature| tool| functionality| capability| module)/i.test(text) && !genericPhrases.test(text));
}

/**
 * Check if text contains an NPS score (0-10)
 */
function hasNPSScore(text: string): boolean {
  return NPS_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Find the best matching rule for a question
 */
function findMatchingRule(question: string): QuestionRule | null {
  const lowerQuestion = question.toLowerCase();

  // Score each rule by how many patterns match
  let bestRule: QuestionRule | null = null;
  let bestScore = 0;

  for (const rule of QUESTION_RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (lowerQuestion.includes(pattern)) {
        score += pattern.length; // Longer matches = higher score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  return bestRule;
}

/**
 * Extract what testimonial value was captured
 */
function extractValue(transcript: string, rule: QuestionRule | null): string | null {
  const values: string[] = [];

  // Extract metrics (time, %, money, etc.)
  if (hasMetric(transcript)) {
    const metricMatch = transcript.match(/\d+\s*(%|percent|x|times|hours?|days?|minutes?|weeks?|k|thousand|million|\$)/i);
    if (metricMatch) {
      values.push(`Metric: "${metricMatch[0]}"`);
    }
  }

  // Extract enthusiastic quotes
  if (hasEnthusiasm(transcript)) {
    for (const pattern of ENTHUSIASM_PATTERNS) {
      const match = transcript.match(pattern);
      if (match) {
        values.push(`Quote: "${match[0]}"`);
        break;
      }
    }
  }

  // Extract pain points (valuable for "before" state)
  if (hasPainPoint(transcript)) {
    for (const pattern of PAIN_PATTERNS) {
      const match = transcript.match(pattern);
      if (match) {
        values.push(`Pain: "${match[0]}"`);
        break;
      }
    }
  }

  // Note before/after comparisons
  if (hasComparison(transcript)) {
    values.push('Before/after comparison');
  }

  // Extract job title
  if (hasTitle(transcript)) {
    for (const pattern of TITLE_PATTERNS) {
      const match = transcript.match(pattern);
      if (match) {
        values.push(`Title: "${match[0]}"`);
        break;
      }
    }
  }

  // Extract industry/vertical
  if (hasIndustry(transcript)) {
    for (const pattern of INDUSTRY_PATTERNS) {
      const match = transcript.match(pattern);
      if (match) {
        values.push(`Industry: "${match[0]}"`);
        break;
      }
    }
  }

  // Extract NPS score
  if (hasNPSScore(transcript)) {
    const scoreMatch = transcript.match(/\b(10|9|8|7|6|5|4|3|2|1|0)\b/);
    if (scoreMatch) {
      values.push(`NPS: ${scoreMatch[0]}`);
    }
  }

  // Extract specific feature names
  if (hasSpecificFeature(transcript)) {
    const featureMatch = transcript.match(/(reporting|dashboard|analytics|automation|integration|workflow|api|notification|alert|export|import|sync|template|scheduler|trigger)/i);
    if (featureMatch) {
      values.push(`Feature: "${featureMatch[0]}"`);
    }
  }

  if (values.length === 0) {
    if (rule) {
      return `Answered ${rule.description}`;
    }
    return null;
  }

  return values.join('; ');
}

/**
 * Evaluate an answer using the rules engine
 * Returns result if rules can handle it, or signals to use AI
 */
export function evaluateWithRules(
  question: string,
  transcript: string
): RulesEvaluationResult {
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const lowerTranscript = transcript.toLowerCase();

  // Find matching rule
  const rule = findMatchingRule(question);

  // =========================================
  // CASE 1: Matching rule found
  // =========================================
  if (rule) {
    console.log(`📋 [RulesEngine] Matched rule: ${rule.id}`);

    // Check fast-complete first (instant approval)
    if (rule.fastComplete) {
      const { keywords, minWords } = rule.fastComplete;
      const hasKeyword = keywords.some(kw => lowerTranscript.includes(kw.toLowerCase()));

      if (hasKeyword && (!minWords || wordCount >= minWords)) {
        console.log(`✅ [RulesEngine] Fast-complete triggered for rule: ${rule.id}`);
        return {
          isComplete: true,
          confidence: 85,
          followUp: null,
          extractedValue: extractValue(transcript, rule),
          ruleId: rule.id,
          usedAI: false,
        };
      }
    }

    // Check completion criteria
    const criteria = rule.completionCriteria;
    let meetsAllCriteria = true;
    let failedCriteria: string[] = [];

    if (criteria.minWords && wordCount < criteria.minWords) {
      meetsAllCriteria = false;
      failedCriteria.push('minWords');
    }

    if (criteria.hasMetric && !hasMetric(transcript)) {
      meetsAllCriteria = false;
      failedCriteria.push('hasMetric');
    }

    if (criteria.hasComparison && !hasComparison(transcript)) {
      meetsAllCriteria = false;
      failedCriteria.push('hasComparison');
    }

    if (criteria.mustMentionAny) {
      const mentionsAny = criteria.mustMentionAny.some(kw =>
        lowerTranscript.includes(kw.toLowerCase())
      );
      if (!mentionsAny) {
        meetsAllCriteria = false;
        failedCriteria.push('mustMentionAny');
      }
    }

    if (criteria.mustMentionAll) {
      const mentionsAll = criteria.mustMentionAll.every(kw =>
        lowerTranscript.includes(kw.toLowerCase())
      );
      if (!mentionsAll) {
        meetsAllCriteria = false;
        failedCriteria.push('mustMentionAll');
      }
    }

    if (criteria.hasSpecificFeature && !hasSpecificFeature(transcript)) {
      meetsAllCriteria = false;
      failedCriteria.push('hasSpecificFeature');
    }

    if (criteria.hasNPSScore && !hasNPSScore(transcript)) {
      meetsAllCriteria = false;
      failedCriteria.push('hasNPSScore');
    }

    // If all criteria met, complete!
    if (meetsAllCriteria) {
      console.log(`✅ [RulesEngine] All criteria met for rule: ${rule.id}`);
      return {
        isComplete: true,
        confidence: 80,
        followUp: null,
        extractedValue: extractValue(transcript, rule),
        ruleId: rule.id,
        usedAI: false,
      };
    }

    // Check follow-up conditions
    for (const followUp of rule.followUps) {
      if (followUp.checkFn && followUp.checkFn(transcript, words)) {
        console.log(`💬 [RulesEngine] Follow-up triggered: ${followUp.condition}`);
        return {
          isComplete: false,
          confidence: 40,
          followUp: followUp.prompt,
          extractedValue: null,
          ruleId: rule.id,
          usedAI: false,
        };
      }
    }

    // If we have some content but criteria not fully met,
    // be lenient if there's enthusiasm or decent length
    if (wordCount >= 15 && (hasEnthusiasm(transcript) || hasMetric(transcript))) {
      console.log(`✅ [RulesEngine] Lenient pass with enthusiasm/metric for rule: ${rule.id}`);
      return {
        isComplete: true,
        confidence: 70,
        followUp: null,
        extractedValue: extractValue(transcript, rule),
        ruleId: rule.id,
        usedAI: false,
      };
    }

    // Rule matched but couldn't definitively evaluate - use AI
    console.log(`🤖 [RulesEngine] Rule matched but inconclusive, falling back to AI`);
    return {
      isComplete: false,
      confidence: 0,
      followUp: null,
      extractedValue: null,
      ruleId: rule.id,
      usedAI: true, // Signal to use AI
    };
  }

  // =========================================
  // CASE 2: No matching rule - use fallback
  // =========================================
  console.log(`📋 [RulesEngine] No rule matched, using fallback config`);

  // Check if answer is substantial enough with enthusiasm/metrics
  const config = FALLBACK_CONFIG;

  // Enthusiasm bonus
  if (hasEnthusiasm(transcript) && wordCount >= config.enthusiasmBonus.minWordsWithEnthusiasm) {
    console.log(`✅ [RulesEngine] Fallback: enthusiasm detected, approving`);
    return {
      isComplete: true,
      confidence: 75,
      followUp: null,
      extractedValue: extractValue(transcript, null),
      ruleId: null,
      usedAI: false,
    };
  }

  // Metric bonus
  if (hasMetric(transcript) && wordCount >= config.metricBonus.minWordsWithMetric) {
    console.log(`✅ [RulesEngine] Fallback: metric detected, approving`);
    return {
      isComplete: true,
      confidence: 75,
      followUp: null,
      extractedValue: extractValue(transcript, null),
      ruleId: null,
      usedAI: false,
    };
  }

  // Long enough answer
  if (wordCount >= config.minCompleteWords) {
    console.log(`✅ [RulesEngine] Fallback: sufficient length, approving`);
    return {
      isComplete: true,
      confidence: 65,
      followUp: null,
      extractedValue: extractValue(transcript, null),
      ruleId: null,
      usedAI: false,
    };
  }

  // Not enough info to decide - use AI for nuanced evaluation
  console.log(`🤖 [RulesEngine] Fallback inconclusive, using AI`);
  return {
    isComplete: false,
    confidence: 0,
    followUp: null,
    extractedValue: null,
    ruleId: null,
    usedAI: true,
  };
}

/**
 * Get a random generic follow-up for fallback cases
 */
export function getGenericFollowUp(): string {
  const followUps = FALLBACK_CONFIG.genericFollowUps;
  return followUps[Math.floor(Math.random() * followUps.length)];
}
