/**
 * Question Rules Configuration
 * Defines rules for evaluating the 12 standard interview questions
 * Rules are checked before falling back to AI evaluation
 */

export interface FollowUpRule {
  condition: string;          // Condition identifier
  prompt: string;             // The follow-up prompt to show
  checkFn?: (transcript: string, words: string[]) => boolean; // Optional custom check
}

export interface QuestionRule {
  id: string;
  patterns: string[];         // Keywords/phrases to match question (lowercase)
  description: string;        // Human-readable description
  extractionGoal: string;     // What we're trying to extract for the case study

  // What makes this answer complete
  completionCriteria: {
    minWords?: number;                    // Minimum word count
    mustMentionAny?: string[];            // Complete if any of these mentioned
    mustMentionAll?: string[];            // Must mention all of these
    hasMetric?: boolean;                  // Must contain a number/metric
    hasComparison?: boolean;              // Must have before/after language
    hasSpecificFeature?: boolean;         // Must name a specific feature
    hasNPSScore?: boolean;                // Must include a 0-10 score
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
  /\d+\s*(people|employees|users|customers|clients|team)/i,
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

// Patterns for negative emotions (pain points)
export const PAIN_PATTERNS = [
  /(frustrated|frustrating|overwhelmed|overwhelming)/i,
  /(nightmare|painful|tedious|time-consuming)/i,
  /(inefficient|broken|failing|struggling)/i,
  /(staying late|working overtime|burning out)/i,
  /(slipping through|falling behind|missing)/i,
  /(manual|spreadsheet|excel|by hand)/i,
];

// Patterns for specific industries/verticals
export const INDUSTRY_PATTERNS = [
  /(b2b|b2c|saas|software|tech|technology)/i,
  /(healthcare|fintech|finance|banking|insurance)/i,
  /(e-commerce|ecommerce|retail|manufacturing)/i,
  /(marketing|advertising|agency|consulting)/i,
  /(real estate|logistics|education|edtech)/i,
  /(startup|enterprise|smb|small business)/i,
];

// Patterns for job titles
export const TITLE_PATTERNS = [
  /(founder|ceo|cto|coo|cfo|chief)/i,
  /(director|vp|vice president|head of)/i,
  /(manager|lead|senior|principal)/i,
  /(engineer|developer|designer|analyst)/i,
  /(owner|president|partner|consultant)/i,
  /(coordinator|specialist|administrator)/i,
];

// Patterns for competitor mentions
export const COMPETITOR_PATTERNS = [
  /(spreadsheet|excel|google sheets|airtable)/i,
  /(manual|by hand|pen and paper)/i,
  /(competitor|alternative|other tool|other solution)/i,
  // Generic competitor pattern - will match any proper noun before "before"
];

// Patterns for NPS scores
export const NPS_PATTERNS = [
  /\b(10|nine|ten|9|8|seven|eight|7|6|six|5|five|4|four|3|three|2|two|1|one|0|zero)\b.*\b(out of|\/)\s*(10|ten)\b/i,
  /\b(10|9|8|7|6|5|4|3|2|1|0)\b/,
];

/**
 * The 12 Standard Interview Questions
 * Each rule maps to a specific question in the interview flow
 */
export const QUESTION_RULES: QuestionRule[] = [
  // ============================================
  // Q1: ROLE, TEAM SIZE, INDUSTRY
  // ============================================
  {
    id: 'q1_role_team_industry',
    patterns: [
      'what is your role',
      'team size',
      'industry',
      'tell us about yourself',
      'your role',
      'your position',
      'what do you do',
    ],
    description: 'Role, team size, and industry question',
    extractionGoal: 'Build the "Customer Persona" for the case study',
    completionCriteria: {
      minWords: 12,
      // Ideally has: job title + team size number + industry/vertical
    },
    followUps: [
      {
        condition: 'missing_team_size',
        prompt: 'Got it. To give us a sense of scale, how large is the team you\'re currently working with?',
        checkFn: (t) => !METRIC_PATTERNS.some(p => p.test(t)) && !/team|people|employees/i.test(t),
      },
      {
        condition: 'vague_industry',
        prompt: 'And what specific industry or vertical does your company serve?',
        checkFn: (t) => !INDUSTRY_PATTERNS.some(p => p.test(t)) && /(we do|we work in|we\'re in)\s*(sales|marketing|tech|business)/i.test(t),
      },
      {
        condition: 'missing_title',
        prompt: 'What is your job title?',
        checkFn: (t) => !TITLE_PATTERNS.some(p => p.test(t)),
      },
    ],
    fastComplete: {
      keywords: ['founder', 'ceo', 'cto', 'director', 'vp', 'head of'],
      minWords: 15,
    },
  },

  // ============================================
  // Q2: PROBLEM BEFORE
  // ============================================
  {
    id: 'q2_problem_before',
    patterns: [
      'what problem',
      'before using',
      'trying to solve',
      'challenge',
      'pain point',
      'struggle',
    ],
    description: 'Problem they were trying to solve before using the product',
    extractionGoal: 'The "Before" state (The Pain)',
    completionCriteria: {
      minWords: 15,
      hasComparison: true,
    },
    followUps: [
      // HARDCORE: Cost mining
      {
        condition: 'mentions_cost_no_number',
        prompt: 'Are we talking about subscription cost or manual labor cost? Did you have an estimate of that wasted spend?',
        checkFn: (t) => /(expensive|costly|cost us|costing|spending|wasting money)/i.test(t) && !METRIC_PATTERNS.some(p => p.test(t)),
      },
      // HARDCORE: Time mining
      {
        condition: 'mentions_slow_no_hours',
        prompt: 'Roughly how many hours a week were you losing to that inefficiency before us?',
        checkFn: (t) => /(slow|inefficient|time-consuming|took forever|taking too long|wasting time)/i.test(t) && !/\d+\s*(hour|minute|day|week)/i.test(t),
      },
      // HARDCORE: Adjective anchoring - stress
      {
        condition: 'mentions_stress_no_specifics',
        prompt: 'What specific part of that process was causing the most headaches? Was it the manual entry or fear of errors?',
        checkFn: (t) => /(stressful|messy|chaotic|disorganized|hectic|crazy)/i.test(t) && !/(manual|entry|error|mistake|data|report)/i.test(t),
      },
      {
        condition: 'vague_inefficient',
        prompt: 'What did that inefficiency look like in your day-to-day? Were you staying late, or was work slipping through the cracks?',
        checkFn: (t) => /(inefficient|not efficient|wasn\'t efficient)/i.test(t) && !PAIN_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'vague_scale',
        prompt: 'What was breaking or holding you back from scaling before you brought us in?',
        checkFn: (t) => /(needed to scale|wanted to scale|trying to scale|couldn\'t scale)/i.test(t) && t.split(/\s+/).length < 20,
      },
      {
        condition: 'too_short',
        prompt: 'Can you describe what that looked like day-to-day?',
        checkFn: (t, words) => words.length < 15,
      },
    ],
    fastComplete: {
      keywords: ['frustrated', 'nightmare', 'hours', 'manual', 'spreadsheet', 'staying late', 'overwhelmed'],
      minWords: 12,
    },
  },

  // ============================================
  // Q3: ALTERNATIVES / COMPETITORS
  // ============================================
  {
    id: 'q3_alternatives',
    patterns: [
      'alternatives',
      'previous solutions',
      'what were you using',
      'why did you switch',
      'before us',
      'other tools',
    ],
    description: 'Alternatives or previous solutions they were using',
    extractionGoal: 'The "Competitor" or "Status Quo" (Spreadsheets/Manual work)',
    completionCriteria: {
      minWords: 12,
    },
    followUps: [
      // HARDCORE: Spreadsheet hours mining
      {
        condition: 'spreadsheets_no_hours',
        prompt: 'If you had to guess, how many hours per week was the team burning just maintaining those spreadsheets?',
        checkFn: (t) => /(spreadsheet|excel|google sheets|manual|by hand)/i.test(t) && !/\d+\s*(hour|minute|day|week)/i.test(t),
      },
      // HARDCORE: Adjective anchoring - complexity
      {
        condition: 'mentions_complex_no_specifics',
        prompt: 'What specific workflow was the breaking point where you realized "this is just too hard"?',
        checkFn: (t) => /(complex|complicated|hard|difficult|convoluted|messy)/i.test(t) && !/(workflow|process|step|task|report|update)/i.test(t),
      },
      {
        condition: 'mentioned_competitor',
        prompt: 'What was the tipping point that made you leave that solution?',
        checkFn: (t) => {
          const hasCompetitor = COMPETITOR_PATTERNS.some(p => p.test(t));
          const hasReason = /(because|since|but|however|problem was|issue was|didn\'t|couldn\'t|wasn\'t)/i.test(t);
          return hasCompetitor && !hasReason;
        },
      },
      {
        condition: 'used_spreadsheets',
        prompt: 'How sustainable was that? At what point did the spreadsheet process break down?',
        checkFn: (t) => /(spreadsheet|excel|google sheets)/i.test(t) && !/(broke|break|unsustainable|couldn\'t|stopped working|hour)/i.test(t),
      },
      {
        condition: 'too_vague',
        prompt: 'What specifically were you using before?',
        checkFn: (t, words) => words.length < 10 && !COMPETITOR_PATTERNS.some(p => p.test(t)),
      },
    ],
    fastComplete: {
      keywords: ['switched from', 'moved from', 'replaced', 'tipping point', 'broke down', 'couldn\'t scale'],
      minWords: 15,
    },
  },

  // ============================================
  // Q4: SETUP / ONBOARDING
  // ============================================
  {
    id: 'q4_onboarding',
    patterns: [
      'setup',
      'onboarding',
      'getting started',
      'implementation',
      'first experience',
    ],
    description: 'Setup or onboarding experience',
    extractionGoal: 'Time-to-Live (Speed & Ease)',
    completionCriteria: {
      minWords: 10,
    },
    followUps: [
      // HARDCORE: Time-to-value mining
      {
        condition: 'fast_no_timeframe',
        prompt: 'In terms of hours or days, how long was it from signing up to actually getting your first real result?',
        checkFn: (t) => /(fast|quick|rapid|speedy|smooth|breeze)/i.test(t) && !/\d+\s*(hour|minute|day|week|afternoon|morning)/i.test(t),
      },
      // HARDCORE: Adjective anchoring - intuitive
      {
        condition: 'intuitive_no_specifics',
        prompt: 'What specific part of the UI made it click for you? Was it the dashboard or the setup wizard?',
        checkFn: (t) => /(intuitive|easy|simple|user-friendly|self-explanatory|obvious)/i.test(t) && !/(dashboard|wizard|interface|screen|button|menu|navigation)/i.test(t),
      },
      {
        condition: 'said_fast',
        prompt: 'That\'s great to hear. Roughly how long did it take from signing up to actually getting value from the tool?',
        checkFn: (t) => /(fast|quick|easy|simple|straightforward)/i.test(t) && !METRIC_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'said_easy',
        prompt: 'Did you need to get your engineering team involved, or were you able to do it yourself?',
        checkFn: (t) => /(easy|simple|no problem|smooth)/i.test(t) && !/(engineer|developer|technical|myself|own|alone)/i.test(t),
      },
      {
        condition: 'no_timeframe',
        prompt: 'How long did the setup process take?',
        checkFn: (t) => !METRIC_PATTERNS.some(p => p.test(t)) && !/(day|hour|minute|week|afternoon|morning)/i.test(t),
      },
    ],
    fastComplete: {
      keywords: ['minutes', 'hours', 'same day', 'afternoon', 'no engineering', 'self-serve', 'by myself'],
      minWords: 8,
    },
  },

  // ============================================
  // Q5: INTEGRATION HURDLES
  // ============================================
  {
    id: 'q5_integrations',
    patterns: [
      'integration',
      'hurdles',
      'connect',
      'tech stack',
      'tools',
    ],
    description: 'Integration hurdles or tech stack compatibility',
    extractionGoal: 'Tech Stack compatibility',
    completionCriteria: {
      minWords: 8,
    },
    followUps: [
      // HARDCORE: Developer hours saved mining
      {
        condition: 'seamless_no_hours',
        prompt: 'Roughly how many developer hours did you avoid by it being seamless?',
        checkFn: (t) => /(seamless|smooth|easy|plug and play|out of the box|no code)/i.test(t) && !/\d+\s*(hour|day|week|developer|engineer)/i.test(t),
      },
      {
        condition: 'no_hurdles',
        prompt: 'Glad to hear it. What specific tools did you connect us with in your stack?',
        checkFn: (t) => /(no hurdles|no issues|no problems|smooth|easy|fine)/i.test(t) && !/(salesforce|hubspot|slack|zapier|api|crm|erp)/i.test(t),
      },
      {
        condition: 'had_hurdles',
        prompt: 'Could you elaborate on the specific hurdle? Was it documentation or a technical mismatch?',
        checkFn: (t) => /(hurdle|issue|problem|challenge|difficult)/i.test(t) && !/(documentation|technical|api|support|resolved)/i.test(t),
      },
      {
        condition: 'too_short',
        prompt: 'What tools did you need to integrate with?',
        checkFn: (t, words) => words.length < 8,
      },
    ],
    fastComplete: {
      keywords: ['salesforce', 'hubspot', 'slack', 'zapier', 'api', 'webhook', 'crm', 'integrated with'],
      minWords: 8,
    },
  },

  // ============================================
  // Q6: RESULTS (QUALITATIVE)
  // ============================================
  {
    id: 'q6_results_qualitative',
    patterns: [
      'what results',
      'since implementing',
      'what has changed',
      'how has it helped',
      'difference',
    ],
    description: 'Qualitative results since implementing',
    extractionGoal: 'The "After" state (Qualitative Success)',
    completionCriteria: {
      minWords: 15,
      hasComparison: true,
    },
    followUps: [
      // HARDCORE: Efficiency multiplier mining
      {
        condition: 'efficient_no_number',
        prompt: 'If you had to put a number on it, would you say you are 2x faster now? 5x? What does that efficiency look like in numbers?',
        checkFn: (t) => /(efficient|productive|faster|quicker|streamlined|optimized)/i.test(t) && !METRIC_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'vague_better',
        prompt: 'In what way? How has your daily workflow changed compared to how you did things before?',
        checkFn: (t) => /(better|improved|good|great|nice)/i.test(t) && !COMPARISON_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'team_likes_it',
        prompt: 'What specific changes has the team noticed in their morale or output?',
        checkFn: (t) => /(team likes|team loves|everyone likes|popular)/i.test(t) && !/(morale|output|productivity|happier|faster)/i.test(t),
      },
      {
        condition: 'too_short',
        prompt: 'Can you describe how things are different now?',
        checkFn: (t, words) => words.length < 12,
      },
    ],
    fastComplete: {
      keywords: ['workflow', 'process', 'before we', 'now we', 'used to', 'no longer', 'transformed'],
      minWords: 15,
    },
  },

  // ============================================
  // Q7: METRICS / ROI (QUANTITATIVE)
  // ============================================
  {
    id: 'q7_metrics_roi',
    patterns: [
      'specific metrics',
      'roi',
      'time-to-value',
      'hours saved',
      'numbers',
      'quantify',
    ],
    description: 'Specific metrics or ROI',
    extractionGoal: 'The "Hard Numbers" (The Headline) - MOST IMPORTANT FOR MARKETING',
    completionCriteria: {
      minWords: 10,
      hasMetric: true,
    },
    followUps: [
      // HARDCORE: Money scale mining
      {
        condition: 'saved_money_no_amount',
        prompt: 'Are we talking thousands or tens of thousands annually? Even a rough ballpark helps us tell your story.',
        checkFn: (t) => /(saved money|save money|cost savings|reduced costs|cut costs|saving us money)/i.test(t) && !/\$\d+|\d+\s*(k|thousand|million|dollar)/i.test(t),
      },
      // HARDCORE: Team-wide hours aggregation
      {
        condition: 'saved_time_no_aggregate',
        prompt: 'If you aggregated that across the whole team, how many total man-hours a month are you getting back?',
        checkFn: (t) => /(saved time|save time|saves us time|time back|hours back)/i.test(t) && !/\d+\s*(hour|minute|day|week)/i.test(t),
      },
      {
        condition: 'vague_time_saved',
        prompt: 'If you had to estimate, how many hours per week do you think you\'ve saved?',
        checkFn: (t) => /(saved time|save time|lot of time|saves us time)/i.test(t) && !/\d+\s*(hour|minute|day|week)/i.test(t),
      },
      {
        condition: 'vague_revenue',
        prompt: 'That\'s incredible. Can you put a rough percentage on that uplift? Even a ballpark helps.',
        checkFn: (t) => /(revenue|sales|income|money).*?(up|increased|grew|better)/i.test(t) && !METRIC_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'no_numbers',
        prompt: 'Even a conservative estimate would help - any rough numbers you can share?',
        checkFn: (t) => !METRIC_PATTERNS.some(p => p.test(t)),
      },
    ],
    fastComplete: {
      keywords: ['percent', '%', 'hours', 'doubled', 'tripled', '2x', '3x', '10x', 'half'],
      minWords: 8,
    },
  },

  // ============================================
  // Q8: KILLER FEATURE
  // ============================================
  {
    id: 'q8_killer_feature',
    patterns: [
      'feature',
      'capability',
      'most value',
      'most valuable',
      'favorite',
      'best part',
    ],
    description: 'Feature or capability that delivered most value',
    extractionGoal: 'The "Killer Feature"',
    completionCriteria: {
      minWords: 12,
      hasSpecificFeature: true,
    },
    followUps: [
      // HARDCORE: Adjective anchoring - automation/AI specifics
      {
        condition: 'automation_no_specifics',
        prompt: 'Is there one specific "set it and forget it" automation that has delivered the most value?',
        checkFn: (t) => /(automation|ai|artificial intelligence|machine learning|auto-|automated)/i.test(t) && !/(trigger|rule|workflow|when|if|schedule|alert|notification)/i.test(t),
      },
      {
        condition: 'named_feature',
        prompt: 'How do you use that specific feature in your weekly routine?',
        checkFn: (t) => {
          const hasFeatureName = /(the |our )?\w+( feature| tool| functionality| capability)/i.test(t);
          const hasUsage = /(use it|we use|I use|every|weekly|daily|when|helps us)/i.test(t);
          return hasFeatureName && !hasUsage && t.split(/\s+/).length < 20;
        },
      },
      {
        condition: 'vague_automation',
        prompt: 'Is there a specific automation or workflow trigger that has been the most game-changing for you?',
        checkFn: (t) => /(automation|automates|automated)/i.test(t) && !/(trigger|workflow|rule|when|if.*then)/i.test(t),
      },
      {
        condition: 'too_generic',
        prompt: 'Which specific feature has made the biggest difference?',
        checkFn: (t) => /(everything|all of it|ease of use|user friendly|simple)/i.test(t) && t.split(/\s+/).length < 15,
      },
    ],
    fastComplete: {
      keywords: ['reporting', 'dashboard', 'analytics', 'automation', 'integration', 'workflow', 'api'],
      minWords: 15,
    },
  },

  // ============================================
  // Q9: LIMITATIONS / CHALLENGES
  // ============================================
  {
    id: 'q9_limitations',
    patterns: [
      'limitation',
      'challenge',
      'issue',
      'friction',
      'improve',
      'work around',
    ],
    description: 'Limitations or challenges experienced',
    extractionGoal: 'Authentic/Balanced Feedback (builds trust in reviews)',
    completionCriteria: {
      minWords: 10,
    },
    followUps: [
      {
        condition: 'nothing_really',
        prompt: 'We appreciate the praise, but we love honest feedback to help us improve. Was there anything that took a little getting used to at first?',
        checkFn: (t) => /(nothing|no issues|no problems|can\'t think|perfect|everything\'s great)/i.test(t),
      },
      {
        condition: 'mentioned_bug',
        prompt: 'How did that impact your workflow, and are we handling it better now?',
        checkFn: (t) => /(bug|glitch|error|crash|broke|didn\'t work)/i.test(t) && !/(fixed|resolved|better now|handled)/i.test(t),
      },
      {
        condition: 'vague_learning_curve',
        prompt: 'What specifically was tricky to learn at first?',
        checkFn: (t) => /(learning curve|took time|getting used to)/i.test(t) && t.split(/\s+/).length < 15,
      },
    ],
    fastComplete: {
      keywords: ['workaround', 'figured out', 'got used to', 'initially', 'at first', 'learning curve', 'wish'],
      minWords: 12,
    },
  },

  // ============================================
  // Q10: SUPPORT QUALITY
  // ============================================
  {
    id: 'q10_support',
    patterns: [
      'support',
      'responsive',
      'help',
      'customer service',
      'team',
    ],
    description: 'Support responsiveness and effectiveness',
    extractionGoal: 'Trust & Safety',
    completionCriteria: {
      minWords: 10,
    },
    followUps: [
      // HARDCORE: Response time specifics
      {
        condition: 'fast_no_timeframe',
        prompt: 'Are we talking response times in minutes or hours?',
        checkFn: (t) => /(fast|quick|rapid|responsive|speedy|prompt)/i.test(t) && !/\d+\s*(minute|hour|day|second)/i.test(t),
      },
      {
        condition: 'generic_good',
        prompt: 'Do you remember a specific instance where the support team really came through for you?',
        checkFn: (t) => /(good|great|fine|okay|helpful)/i.test(t) && !/(example|instance|time when|remember when|specifically)/i.test(t) && t.split(/\s+/).length < 15,
      },
      {
        condition: 'too_short',
        prompt: 'Can you describe your experience with our support team?',
        checkFn: (t, words) => words.length < 8,
      },
    ],
    fastComplete: {
      keywords: ['fast response', 'quick', 'same day', 'solved', 'fixed', 'above and beyond', 'amazing support'],
      minWords: 10,
    },
  },

  // ============================================
  // Q11: SURPRISE / DELIGHT
  // ============================================
  {
    id: 'q11_surprise',
    patterns: [
      'surprised',
      'surprise',
      'unexpected',
      'didn\'t expect',
      'delight',
    ],
    description: 'What surprised them most',
    extractionGoal: 'The "Delight" factor / Unexpected benefits',
    completionCriteria: {
      minWords: 12,
    },
    followUps: [
      // HARDCORE: Adjective anchoring - powerful task specifics
      {
        condition: 'powerful_no_task',
        prompt: 'What is one specific complex task it handled that you didn\'t expect it to be able to do?',
        checkFn: (t) => /(powerful|capable|robust|impressive|advanced)/i.test(t) && !/(task|workflow|process|report|analysis|calculation)/i.test(t),
      },
      {
        condition: 'generic_praise',
        prompt: 'Was there any specific \'aha\' moment where you realized this tool was different from what you used before?',
        checkFn: (t) => ENTHUSIASM_PATTERNS.some(p => p.test(t)) && !/(aha|moment|realized|discovered|didn\'t expect|surprised)/i.test(t) && t.split(/\s+/).length < 15,
      },
      {
        condition: 'too_short',
        prompt: 'What was the unexpected benefit you discovered?',
        checkFn: (t, words) => words.length < 10,
      },
    ],
    fastComplete: {
      keywords: ['didn\'t expect', 'surprised', 'aha moment', 'realized', 'discovered', 'bonus', 'unexpected'],
      minWords: 12,
    },
  },

  // ============================================
  // Q12: RECOMMENDATION / NPS
  // ============================================
  {
    id: 'q12_recommendation',
    patterns: [
      'recommend',
      'score',
      '0-10',
      'scale',
      'nps',
      'tell others',
    ],
    description: 'Recommendation and NPS score',
    extractionGoal: 'NPS (Net Promoter Score) & The "Soundbite"',
    completionCriteria: {
      minWords: 10,
      hasNPSScore: true,
    },
    followUps: [
      // HARDCORE: Adjective anchoring - game-changer P&L quantification
      {
        condition: 'game_changer_no_impact',
        prompt: 'If you had to quantify the impact of this "game-changer" on your P&L or efficiency, what would you say?',
        checkFn: (t) => /(game.?changer|life.?saver|transformative|revolutionary|incredible)/i.test(t) && !METRIC_PATTERNS.some(p => p.test(t)),
      },
      {
        condition: 'number_only',
        prompt: 'Thank you for that score! If you were describing us to a peer in your industry, how would you describe us in one sentence?',
        checkFn: (t) => {
          const hasNumber = NPS_PATTERNS.some(p => p.test(t));
          const hasExplanation = /(because|since|due to|reason|would say|describe)/i.test(t);
          return hasNumber && !hasExplanation && t.split(/\s+/).length < 15;
        },
      },
      {
        condition: 'no_number',
        prompt: 'On a scale of 0-10, how likely would you be to recommend us?',
        checkFn: (t) => !NPS_PATTERNS.some(p => p.test(t)) && !/\b(10|9|8|7|6|5|4|3|2|1|0)\b/.test(t),
      },
    ],
    fastComplete: {
      keywords: ['definitely', 'absolutely', '10 out of', '10/10', 'highly recommend', 'no brainer'],
      minWords: 15,
    },
  },
];

/**
 * Universal Soft Adjective Catcher
 * These trigger across ALL questions when someone uses vague adjectives without specifics
 */
export const SOFT_ADJECTIVE_FOLLOW_UPS: Array<{
  adjectives: RegExp;
  excludeIfHas: RegExp;
  followUp: string;
}> = [
  // Speed/Time adjectives
  {
    adjectives: /(fast|quick|rapid|speedy|instant|immediate)/i,
    excludeIfHas: /\d+\s*(hour|minute|day|week|second|month)/i,
    followUp: 'In what way was it fast? Can you estimate in hours or days?',
  },
  {
    adjectives: /(slow|sluggish|took forever|time-consuming|lengthy)/i,
    excludeIfHas: /\d+\s*(hour|minute|day|week|second|month)/i,
    followUp: 'How slow are we talking? Roughly how many hours or days?',
  },
  // Quality adjectives
  {
    adjectives: /(easy|simple|straightforward|intuitive|seamless)/i,
    excludeIfHas: /(wizard|dashboard|interface|button|click|step|screen|\d+)/i,
    followUp: 'What specifically made it easy? Which part or feature?',
  },
  {
    adjectives: /(hard|difficult|complex|complicated|confusing)/i,
    excludeIfHas: /(workflow|process|step|feature|part|specifically|\d+)/i,
    followUp: 'What specifically was difficult? Which part or workflow?',
  },
  // Impact adjectives
  {
    adjectives: /(helpful|useful|valuable|beneficial)/i,
    excludeIfHas: /(\d+|percent|%|hours|saved|reduced|increased|workflow|feature)/i,
    followUp: 'In what way was it helpful? Any specific outcome or metric?',
  },
  {
    adjectives: /(efficient|productive|streamlined|optimized)/i,
    excludeIfHas: /(\d+|percent|%|x|times|faster|hours)/i,
    followUp: 'How much more efficient? Would you say 2x? 5x? Any estimate?',
  },
  // Cost adjectives
  {
    adjectives: /(expensive|costly|pricey|cheap|affordable)/i,
    excludeIfHas: /(\$\d+|\d+\s*(k|thousand|million|dollar|percent|%))/i,
    followUp: 'Can you put a rough number on that? Even a ballpark helps.',
  },
  {
    adjectives: /(saved money|cost savings|reduced costs|cut costs)/i,
    excludeIfHas: /(\$\d+|\d+\s*(k|thousand|million|dollar|percent|%))/i,
    followUp: 'Roughly how much? Thousands, tens of thousands annually?',
  },
  // Quality/Experience adjectives
  {
    adjectives: /(great|amazing|awesome|fantastic|incredible|excellent)/i,
    excludeIfHas: /(because|specifically|feature|example|\d+|workflow)/i,
    followUp: 'What specifically makes it great? Any concrete example?',
  },
  {
    adjectives: /(bad|terrible|awful|horrible|poor)/i,
    excludeIfHas: /(because|specifically|feature|example|\d+|workflow)/i,
    followUp: 'What specifically was bad? Can you give an example?',
  },
  // Support adjectives
  {
    adjectives: /(responsive|prompt|attentive)/i,
    excludeIfHas: /(\d+\s*(minute|hour|day)|same day|within)/i,
    followUp: 'How responsive? Are we talking minutes or hours?',
  },
  // Scale adjectives
  {
    adjectives: /(big|huge|massive|significant|substantial)/i,
    excludeIfHas: /(\d+|percent|%|x|times|doubled|tripled)/i,
    followUp: 'How big of an impact? Can you quantify that?',
  },
  {
    adjectives: /(small|minor|slight|little|minimal)/i,
    excludeIfHas: /(\d+|percent|%|but|however|although)/i,
    followUp: 'How small? Is there a rough number you can share?',
  },
  // Improvement adjectives
  {
    adjectives: /(better|improved|enhanced|upgraded)/i,
    excludeIfHas: /(\d+|percent|%|x|times|before|after|used to|now)/i,
    followUp: 'Better in what way? Can you compare before vs after?',
  },
  {
    adjectives: /(worse|degraded|declined)/i,
    excludeIfHas: /(\d+|percent|%|x|times|before|after|used to|now)/i,
    followUp: 'Worse in what way? What changed specifically?',
  },
  // Reliability adjectives
  {
    adjectives: /(reliable|stable|consistent|dependable)/i,
    excludeIfHas: /(uptime|\d+|percent|%|never|always|every time)/i,
    followUp: 'How reliable? Any uptime or consistency metrics?',
  },
  // Flexibility adjectives
  {
    adjectives: /(flexible|customizable|adaptable|versatile)/i,
    excludeIfHas: /(feature|option|setting|configuration|example|specifically)/i,
    followUp: 'Flexible in what way? Which customization helped most?',
  },
  // Power adjectives
  {
    adjectives: /(powerful|robust|capable|strong)/i,
    excludeIfHas: /(feature|task|workflow|specifically|example|handle)/i,
    followUp: 'Powerful for what specifically? What task did it handle well?',
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
