/**
 * API Route: Evaluate Answer with ElevenLabs
 * POST /api/elevenlabs/evaluate
 * Uses ElevenLabs Conversational AI Agent for evaluation (V2 Refactored)
 */

import { NextRequest, NextResponse } from 'next/server';
import { evaluateWithAgent } from '@/lib/services/elevenlabs-agent-v2';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';

// Define the 12 interview questions and their evaluation criteria
const INTERVIEW_QUESTIONS: Record<string, QuestionConfig> = {
  q_role_001: {
    text: "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
    intent: "Assess teamwork, conflict resolution, and communication skills",
    criteria: [
      "Describes a specific situation with context",
      "Explains their approach to handling the difficulty",
      "Shows self-awareness and emotional intelligence",
      "Discusses the outcome and lessons learned"
    ],
    minDuration: 30, // seconds
  },
  q_problem_001: {
    text: "Describe a complex problem you solved at work. Walk me through your thought process.",
    intent: "Evaluate problem-solving skills and analytical thinking",
    criteria: [
      "Clearly defines the problem",
      "Explains their analysis process step-by-step",
      "Discusses multiple solutions considered",
      "Describes implementation and measurable results"
    ],
    minDuration: 45,
  },
  q_results_001: {
    text: "Tell me about a time you achieved something you're proud of. What made it meaningful?",
    intent: "Understand values, motivation, and achievement orientation",
    criteria: [
      "Describes the achievement with specific context",
      "Explains why it was personally meaningful",
      "Shows alignment with personal values",
      "Demonstrates awareness of impact on others"
    ],
    minDuration: 30,
  },
  // Add remaining 9 questions...
  q_leadership_001: {
    text: "Describe a situation where you had to lead a project or team. What was your approach?",
    intent: "Assess leadership style and ability to motivate others",
    criteria: [
      "Describes leadership context and responsibilities",
      "Explains their leadership approach and philosophy",
      "Shows ability to motivate and guide others",
      "Discusses outcomes and team feedback"
    ],
    minDuration: 40,
  },
  q_failure_001: {
    text: "Tell me about a time you failed. How did you handle it and what did you learn?",
    intent: "Evaluate resilience, self-awareness, and learning mindset",
    criteria: [
      "Honestly describes the failure",
      "Takes ownership without excessive blame",
      "Explains specific lessons learned",
      "Shows how they applied those lessons"
    ],
    minDuration: 35,
  },
};

interface QuestionConfig {
  text: string;
  intent: string;
  criteria: string[];
  minDuration: number;
}

interface EvaluationRequest {
  questionId: string;
  audioUrl: string; // URL to the audio file (Mux playback)
  transcript?: string; // Optional: pre-transcribed text
  duration: number; // Answer duration in seconds
}

interface EvaluationResponse {
  decision: 'APPROVED' | 'FOLLOW_UP';
  followUpText?: string;
  reasoning: string;
  score?: number; // 0-100
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluationRequest = await request.json();
    const { questionId, audioUrl, transcript, duration } = body;

    if (!questionId || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing questionId or audioUrl' },
        { status: 400 }
      );
    }

    const questionConfig = INTERVIEW_QUESTIONS[questionId];
    if (!questionConfig) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    console.log(`🤖 Evaluating answer for ${questionId}`);

    // Call ElevenLabs Conversational AI API
    const evaluation = await evaluateWithElevenLabs(
      questionConfig,
      audioUrl,
      transcript,
      duration
    );

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('❌ Evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}

async function evaluateWithElevenLabs(
  question: QuestionConfig,
  audioUrl: string,
  transcript: string | undefined,
  duration: number
): Promise<EvaluationResponse> {

  try {
    // If no transcript yet, auto-approve
    if (!transcript) {
      console.log('⚠️ No transcript available, auto-approving');
      return {
        decision: 'APPROVED',
        reasoning: 'No transcript available',
        score: 75,
      };
    }

    // Evaluate with ElevenLabs Conversational AI Agent ONLY
    console.log('🤖 Evaluating with ElevenLabs Agent...');

    const agentResponse = await evaluateWithAgent(
      question.text,
      transcript,
      question.criteria
    );

    return agentResponse;

  } catch (error) {
    console.error('❌ Agent evaluation error:', error);

    // If agent fails, auto-approve instead of showing fallback
    console.log('⚠️ Agent failed, auto-approving');
    return {
      decision: 'APPROVED',
      reasoning: 'Agent evaluation failed, auto-approved',
      score: 75,
    };
  }
}

/**
 * Smart Content-Based Evaluation
 * Analyzes transcript content against question criteria (NO time-based logic)
 */
async function smartContentEvaluation(
  transcript: string,
  question: QuestionConfig
): Promise<EvaluationResponse> {

  const lowerTranscript = transcript.toLowerCase();
  const words = transcript.split(/\s+/);
  const wordCount = words.length;

  // Initialize score
  let score = 0;
  const missingElements: string[] = [];

  // 1. Check for specific examples/situations (25 points)
  const hasSpecificExample =
    /\b(when|time|situation|example|instance|once|remember|specific case|particular)\b/i.test(transcript) &&
    wordCount > 30; // Must have substance, not just the word

  if (hasSpecificExample) {
    score += 25;
  } else {
    missingElements.push('specific example or situation');
  }

  // 2. Check for process/approach explanation (25 points)
  const hasProcess =
    /\b(approach|process|method|strategy|way|how|steps|plan|decided|thought|considered)\b/i.test(transcript) &&
    wordCount > 40;

  if (hasProcess) {
    score += 25;
  } else {
    missingElements.push('explanation of your approach or process');
  }

  // 3. Check for outcomes/results (25 points)
  const hasOutcome =
    /\b(result|outcome|ended|happened|impact|effect|led to|turned out|success|achiev|accomplish)\b/i.test(transcript);

  if (hasOutcome) {
    score += 25;
  } else {
    missingElements.push('outcomes or results');
  }

  // 4. Check for learning/reflection (25 points)
  const hasReflection =
    /\b(learn|realize|understand|discover|insight|took away|taught me|made me|reflection)\b/i.test(transcript);

  if (hasReflection) {
    score += 25;
  } else {
    missingElements.push('what you learned or took away');
  }

  // Bonus points for depth (detailed answers)
  if (wordCount > 100) score += 10;
  if (wordCount > 150) score += 10;

  // Cap at 100
  score = Math.min(score, 100);

  // Decision logic
  if (score >= 70) {
    return {
      decision: 'APPROVED',
      reasoning: `Strong answer addressing ${4 - missingElements.length} out of 4 key criteria`,
      score,
    };
  } else {
    // Generate intelligent follow-up based on what's missing
    let followUpText = '';

    if (missingElements.length === 4) {
      followUpText = `I'd love to hear more! Could you walk me through a specific example and tell me what happened?`;
    } else if (missingElements.includes('specific example or situation')) {
      followUpText = `Could you share a specific example or situation to illustrate your point?`;
    } else if (missingElements.includes('explanation of your approach or process')) {
      followUpText = `How did you approach that? Walk me through your thought process or the steps you took.`;
    } else if (missingElements.includes('outcomes or results')) {
      followUpText = `What was the result? How did things turn out?`;
    } else if (missingElements.includes('what you learned or took away')) {
      followUpText = `What did you learn from that experience? What insights did you gain?`;
    } else {
      followUpText = `Could you elaborate a bit more and provide additional details?`;
    }

    return {
      decision: 'FOLLOW_UP',
      followUpText,
      reasoning: `Missing: ${missingElements.join(', ')}`,
      score,
    };
  }
}

/**
 * Simple heuristic evaluation (DEPRECATED - only used as fallback)
 */
async function simpleHeuristicEvaluation(
  question: QuestionConfig,
  transcript: string | undefined,
  duration: number
): Promise<EvaluationResponse> {

  // Check duration
  if (duration < question.minDuration) {
    return {
      decision: 'FOLLOW_UP',
      followUpText: `Your answer was quite brief (${Math.round(duration)}s). Could you provide more details and specific examples?`,
      reasoning: `Answer duration (${duration}s) is below minimum (${question.minDuration}s)`,
      score: 40,
    };
  }

  // Check transcript length if available
  if (transcript) {
    const wordCount = transcript.split(/\s+/).length;

    if (wordCount < 50) {
      return {
        decision: 'FOLLOW_UP',
        followUpText: 'Could you elaborate more? I\'d love to hear more details about the specific situation and outcomes.',
        reasoning: `Answer too brief (${wordCount} words)`,
        score: 45,
      };
    }

    // Check for key indicators (very simple)
    const hasSpecificExample = /when|time|situation|example/i.test(transcript);
    const hasOutcome = /result|outcome|learned|impact/i.test(transcript);

    if (!hasSpecificExample) {
      return {
        decision: 'FOLLOW_UP',
        followUpText: 'Could you walk me through a specific example or situation? I\'d like to understand the context better.',
        reasoning: 'Missing specific examples',
        score: 50,
      };
    }

    if (!hasOutcome) {
      return {
        decision: 'FOLLOW_UP',
        followUpText: 'How did things turn out? What was the result or what did you learn from that experience?',
        reasoning: 'Missing outcomes or lessons learned',
        score: 60,
      };
    }
  }

  // If all basic checks pass, approve
  return {
    decision: 'APPROVED',
    reasoning: 'Answer meets basic criteria for length and content structure',
    score: 75,
  };
}
