/**
 * Question Rules Configuration
 * Defines rules for evaluating common interview questions
 * Rules are checked before falling back to AI evaluation
 */

export interface FollowUpRule {
  condition: string;          // Condition identifier
  prompt: string;             // The follow-up prompt to show (6 words max)
  checkFn?: (transcript: string, words: string[]) => boolean; // Optional custom check
}

export interface QuestionRule {
  id: string;
  patterns: string[];         // Keywords/phrases to match question (lowercase)
  description: string;        // Human-readable description

  // What makes this answer complete
  completionCriteria: {
    minWords?: number;                    // Minimum word count
    mustMentionAny?: string[];            // Complete if any of these mentioned
    mustMentionAll?: string[];            // Must mention all of these
    hasMetric?: boolean;                  // Must contain a number/metric
    hasComparison?: boolean;              // Must have before/after language
  };

  // Follow-up prompts when answer is incomplete
  followUps: FollowUpRule[];

  // Fast-track completion (skip detailed checks)
  fastComplete?: {
    keywords: string[];       // If any mentioned, immediately complete
    minWords?: number;        // Combined with keywords
  };
}

// Patterns for detecting metrics in text
export const METRIC_PATTERNS = [
  /\d+\s*%/,                    // 50%, 50 %
  /\d+\s*percent/i,             // 50 percent
  /\d+x/i,                      // 2x, 10x
  /\d+\s*times/i,               // 2 times, 10 times
  /\d+\s*(hours?|days?|weeks?|months?|minutes?)/i, // time durations
  /\$\d+/,                      // $500
  /\d+\s*(k|thousand|million)/i, // 5k, 5 thousand
  /(doubled|tripled|halved|quadrupled)/i,
  /(half|twice|triple)/i,
  /\d+\s*(people|employees|users|customers|clients)/i,
];

// Patterns for detecting comparison/before-after language
export const COMPARISON_PATTERNS = [
  /(before|previously|used to|was|were|had to)/i,
  /(now|after|since|with \w+)/i,
  /(instead of|rather than|compared to)/i,
  /(no longer|don't have to|stopped)/i,
  /(switched from|moved from|changed from)/i,
];

// Patterns for strong positive sentiment (quotable)
export const ENTHUSIASM_PATTERNS = [
  /(love|amazing|fantastic|incredible|awesome|excellent)/i,
  /(game.?changer|life.?saver|must.?have|essential)/i,
  /(highly recommend|definitely recommend|absolutely)/i,
  /(best|favorite|greatest|most important)/i,
  /(can't imagine|couldn't live without|indispensable)/i,
  /(transformed|revolutionized|completely changed)/i,
];

/**
 * Common Interview Question Rules
 * These cover ~80% of typical testimonial interview questions
 */
export const QUESTION_RULES: QuestionRule[] = [
  // ============================================
  // INTRO / ROLE QUESTIONS
  // ============================================
  {
    id: 'role_intro',
    patterns: [
      'what is your role',
      'tell us about yourself',
      'what do you do',
      'your position',
      'your title',
      'introduce yourself',
      'who are you',
      'about yourself',
    ],
    description: 'Introduction and role questions',
    completionCriteria: {
      minWords: 8,
      mustMentionAny: [
        'founder', 'ceo', 'cto', 'coo', 'cfo', 'chief',
        'director', 'manager', 'lead', 'head',
        'engineer', 'developer', 'designer', 'analyst',
        'owner', 'president', 'vp', 'vice president',
        'coordinator', 'specialist', 'consultant',
        'i am', 'i work', 'my role', 'i manage', 'i lead',
      ],
    },
    followUps: [
      {
        condition: 'too_short',
        prompt: 'What does your role involve?',
        checkFn: (t, words) => words.length < 8,
      },
      {
        condition: 'no_role_mentioned',
        prompt: 'What is your title?',
        checkFn: (t) => !/(founder|ceo|manager|director|lead|engineer|developer|owner|head|chief|analyst|designer|coordinator|specialist)/i.test(t),
      },
    ],
    fastComplete: {
      keywords: ['founder', 'ceo', 'owner', 'director', 'i run', 'i lead', 'i manage'],
      minWords: 5,
    },
  },

  {
    id: 'company_team',
    patterns: [
      'company size',
      'team size',
      'how big',
      'how many people',
      'how many employees',
      'tell us about your company',
      'about your team',
    ],
    description: 'Company or team size questions',
    completionCriteria: {
      minWords: 5,
      hasMetric: true,
    },
    followUps: [
      {
        condition: 'no_number',
        prompt: 'How many people on the team?',
        checkFn: (t) => !/\d+/.test(t),
      },
    ],
    fastComplete: {
      keywords: ['people', 'employees', 'team of', 'person', 'just me', 'solo'],
      minWords: 3,
    },
  },

  // ============================================
  // PROBLEM / PAIN POINT QUESTIONS
  // ============================================
  {
    id: 'problem_before',
    patterns: [
      'before using',
      'challenge',
      'problem',
      'pain point',
      'struggle',
      'difficulty',
      'issue',
      'what was it like before',
      'how did you handle',
      'what were you using',
    ],
    description: 'Questions about problems before the product',
    completionCriteria: {
      minWords: 15,
      hasComparison: true,
    },
    followUps: [
      {
        condition: 'no_specifics',
        prompt: 'How much time did that take?',
        checkFn: (t, words) => words.length < 15 && !METRIC_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'vague_problem',
        prompt: 'Can you give an example?',
        checkFn: (t) => /(it was hard|difficult|challenging|not great|bad)/i.test(t) && !/(for example|like when|such as|specifically)/i.test(t),
      },
    ],
    fastComplete: {
      keywords: ['hours', 'days', 'manual', 'spreadsheet', 'frustrated', 'nightmare', 'impossible'],
      minWords: 12,
    },
  },

  // ============================================
  // DISCOVERY / WHY QUESTIONS
  // ============================================
  {
    id: 'discovery',
    patterns: [
      'how did you find',
      'how did you hear',
      'how did you discover',
      'what made you choose',
      'why did you choose',
      'what attracted you',
      'why did you decide',
    ],
    description: 'How they discovered or chose the product',
    completionCriteria: {
      minWords: 10,
    },
    followUps: [
      {
        condition: 'too_short',
        prompt: 'What convinced you to try it?',
        checkFn: (t, words) => words.length < 10,
      },
    ],
    fastComplete: {
      keywords: ['recommendation', 'colleague', 'search', 'google', 'review', 'friend', 'saw', 'demo'],
      minWords: 8,
    },
  },

  // ============================================
  // RESULTS / IMPACT QUESTIONS
  // ============================================
  {
    id: 'results_impact',
    patterns: [
      'results',
      'impact',
      'difference',
      'changed',
      'improved',
      'benefits',
      'what has changed',
      'how has it helped',
      'what improvements',
    ],
    description: 'Questions about results and impact',
    completionCriteria: {
      minWords: 15,
      hasMetric: true,
    },
    followUps: [
      {
        condition: 'no_metric',
        prompt: 'Any specific numbers on that?',
        checkFn: (t) => !METRIC_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'vague_improvement',
        prompt: 'Roughly how much improvement?',
        checkFn: (t) => /(better|improved|faster|easier|more efficient)/i.test(t) && !METRIC_PATTERNS.some(p => p.test(t)),
      },
    ],
    fastComplete: {
      keywords: ['percent', '%', 'doubled', 'tripled', 'half the time', 'twice as', '10x', '2x', '5x'],
      minWords: 10,
    },
  },

  {
    id: 'time_saved',
    patterns: [
      'time saved',
      'how much time',
      'save you time',
      'faster',
      'quicker',
      'efficiency',
    ],
    description: 'Questions specifically about time savings',
    completionCriteria: {
      minWords: 10,
      hasMetric: true,
    },
    followUps: [
      {
        condition: 'no_time_metric',
        prompt: 'How many hours per week?',
        checkFn: (t) => !/\d+\s*(hours?|minutes?|days?|weeks?)/i.test(t) && !/(half|twice|double)/i.test(t),
      },
    ],
    fastComplete: {
      keywords: ['hours', 'minutes', 'days', 'half the time', 'twice as fast'],
      minWords: 8,
    },
  },

  // ============================================
  // FEATURE / PRODUCT QUESTIONS
  // ============================================
  {
    id: 'favorite_feature',
    patterns: [
      'favorite feature',
      'favorite part',
      'like most',
      'love most',
      'best feature',
      'most valuable',
      'most useful',
      'standout feature',
    ],
    description: 'Questions about favorite features',
    completionCriteria: {
      minWords: 12,
    },
    followUps: [
      {
        condition: 'no_why',
        prompt: 'Why is that your favorite?',
        checkFn: (t) => !/(because|since|as it|helps me|allows me|makes it|saves)/i.test(t),
      },
      {
        condition: 'too_generic',
        prompt: 'What specifically about it?',
        checkFn: (t, words) => words.length < 12 && /(everything|all of it|the whole thing)/i.test(t),
      },
    ],
    fastComplete: {
      keywords: ['because', 'allows me to', 'helps me', 'saves me', 'makes it easy', 'love how'],
      minWords: 10,
    },
  },

  {
    id: 'daily_use',
    patterns: [
      'how do you use',
      'day to day',
      'daily basis',
      'typical workflow',
      'how often',
      'walk me through',
    ],
    description: 'Questions about daily usage',
    completionCriteria: {
      minWords: 15,
    },
    followUps: [
      {
        condition: 'too_short',
        prompt: 'What does that workflow look like?',
        checkFn: (t, words) => words.length < 15,
      },
    ],
    fastComplete: {
      keywords: ['every day', 'daily', 'each morning', 'first thing', 'constantly', 'all the time', 'whenever'],
      minWords: 12,
    },
  },

  // ============================================
  // RECOMMENDATION / CLOSING QUESTIONS
  // ============================================
  {
    id: 'recommendation',
    patterns: [
      'recommend',
      'advice',
      'tell others',
      'suggest to',
      'what would you say',
      'who should use',
    ],
    description: 'Recommendation questions',
    completionCriteria: {
      minWords: 10,
    },
    followUps: [
      {
        condition: 'no_audience',
        prompt: 'Who would benefit most?',
        checkFn: (t) => !/(anyone|everyone|people who|teams that|companies|businesses|if you)/i.test(t),
      },
    ],
    fastComplete: {
      keywords: ['definitely', 'absolutely', 'highly recommend', 'must have', 'no brainer', 'essential'],
      minWords: 8,
    },
  },

  {
    id: 'closing_thoughts',
    patterns: [
      'anything else',
      'final thoughts',
      'want to add',
      'in closing',
      'sum up',
      'last thing',
    ],
    description: 'Closing/wrap-up questions',
    completionCriteria: {
      minWords: 8,
    },
    followUps: [],
    fastComplete: {
      keywords: ['thank', 'great', 'love', 'happy', 'glad', 'appreciate'],
      minWords: 5,
    },
  },

  // ============================================
  // COMPARISON QUESTIONS
  // ============================================
  {
    id: 'vs_competitors',
    patterns: [
      'compared to',
      'different from',
      'vs',
      'versus',
      'other solutions',
      'other tools',
      'alternatives',
      'switch from',
    ],
    description: 'Comparison with competitors',
    completionCriteria: {
      minWords: 15,
      hasComparison: true,
    },
    followUps: [
      {
        condition: 'no_specifics',
        prompt: 'What makes it stand out?',
        checkFn: (t, words) => words.length < 15,
      },
    ],
    fastComplete: {
      keywords: ['better because', 'unlike', 'whereas', 'the difference is', 'stands out'],
      minWords: 12,
    },
  },
];

/**
 * Fallback rules for questions that don't match any defined patterns
 */
export const FALLBACK_CONFIG = {
  // Minimum words to consider auto-completing
  minCompleteWords: 20,

  // If answer contains enthusiasm, lower the bar
  enthusiasmBonus: {
    patterns: ENTHUSIASM_PATTERNS,
    minWordsWithEnthusiasm: 12,
  },

  // If answer has metrics, it's probably complete
  metricBonus: {
    patterns: METRIC_PATTERNS,
    minWordsWithMetric: 10,
  },

  // Generic follow-ups when rules don't help
  genericFollowUps: [
    'Can you give a specific example?',
    'Any numbers you can share?',
    'What was the impact?',
  ],
};
