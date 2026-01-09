/**
 * Mock Data for Development
 * Question bank and sample interview sessions
 */

import { Question, InterviewSession } from "@/lib/types/interview";

// Complete question bank that campaigns can select from
export const QUESTION_BANK: Record<string, Question> = {
  role_context: {
    id: "q_role_001",
    text: "What is your role, team size, and industry?",
    intent:
      "Establishing context about your position and organization to help viewers relate to your experience.",
  },
  problem_statement: {
    id: "q_problem_001",
    text: "What problem were you trying to solve before using our product?",
    intent:
      "Identifying the core pain points and challenges you faced that led you to seek a solution.",
  },
  alternatives: {
    id: "q_alternatives_001",
    text: "What alternatives or previous solutions were you using, and why did you switch?",
    intent:
      "Understanding your decision-making process and what made our product stand out from competitors.",
  },
  onboarding: {
    id: "q_onboarding_001",
    text: "What was the setup or onboarding experience like? Any integration hurdles?",
    intent:
      "Capturing honest feedback about the initial implementation and any technical challenges encountered.",
  },
  results: {
    id: "q_results_001",
    text: "What results have you seen since implementing the product?",
    intent:
      "Highlighting tangible outcomes and business impact from using our solution.",
  },
  metrics: {
    id: "q_metrics_001",
    text: "Can you share any specific metrics or ROI (time-to-value, $, %, hours saved, etc.)?",
    intent:
      "Quantifying the value with concrete numbers that demonstrate measurable success.",
  },
  favorite_feature: {
    id: "q_feature_001",
    text: "What feature or capability has delivered the most value?",
    intent:
      "Identifying the key functionality that drives the most benefit for your use case.",
  },
  challenges: {
    id: "q_challenges_001",
    text: "What limitation or challenge have you experienced, and how did you work around it?",
    intent:
      "Providing balanced perspective on areas for improvement and practical solutions you've found.",
  },
  support: {
    id: "q_support_001",
    text: "How responsive or effective has support been?",
    intent:
      "Sharing your experience with our customer success and technical support teams.",
  },
  surprise: {
    id: "q_surprise_001",
    text: "What surprised you most about using the product?",
    intent:
      "Uncovering unexpected benefits or delightful moments that exceeded your expectations.",
  },
  recommendation: {
    id: "q_recommendation_001",
    text: "Would you recommend us to someone else? Why? (0–10 scale allowed)",
    intent:
      "Measuring your likelihood to recommend and understanding the key reasons behind your advocacy.",
  },
  permission: {
    id: "q_permission_001",
    text: "Is it okay for us to quote you using your name, title, and company?",
    intent:
      "Obtaining permission to use your testimonial in marketing materials with proper attribution.",
  },
};

// Mock interview sessions with different question sets
export const MOCK_SESSIONS: Record<string, InterviewSession> = {
  session_abc123: {
    session_id: "session_abc123",
    company_name: "Acme Corp",
    questions: [
      QUESTION_BANK.role_context,
      QUESTION_BANK.problem_statement,
      QUESTION_BANK.alternatives,
      QUESTION_BANK.onboarding,
      QUESTION_BANK.results,
      QUESTION_BANK.metrics,
      QUESTION_BANK.favorite_feature,
      QUESTION_BANK.challenges,
      QUESTION_BANK.support,
      QUESTION_BANK.surprise,
      QUESTION_BANK.recommendation,
      QUESTION_BANK.permission,
    ],
    created_at: "2025-01-01T00:00:00Z",
    brand_customization: {
      primaryColor: "#8F84C2",
      secondaryColor: "#FB7185",
      tertiaryColor: "#D19648",
      buttonStyle: "gradient",
      cornerRadius: 16,
      fontFamily: "Inter",
    },
  },
  session_xyz789: {
    session_id: "session_xyz789",
    company_name: "TechStartup Inc",
    company_logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
    questions: [
      QUESTION_BANK.role_context,
      QUESTION_BANK.problem_statement,
      QUESTION_BANK.results,
      QUESTION_BANK.favorite_feature,
      QUESTION_BANK.recommendation,
    ],
    created_at: "2025-01-02T00:00:00Z",
    brand_customization: {
      primaryColor: "#3B82F6",
      secondaryColor: "#8B5CF6",
      tertiaryColor: "#EC4899",
      buttonStyle: "solid",
      cornerRadius: 12,
      fontFamily: "Poppins",
    },
  },
  session_demo: {
    session_id: "session_demo",
    company_name: "Demo Company",
    questions: [
      QUESTION_BANK.role_context,
      QUESTION_BANK.problem_statement,
      QUESTION_BANK.alternatives,
      QUESTION_BANK.results,
      QUESTION_BANK.metrics,
      QUESTION_BANK.recommendation,
    ],
    created_at: "2025-01-03T00:00:00Z",
  },
};

// Helper function to get a mock session by ID
export function getMockSession(sessionId: string): InterviewSession | null {
  return MOCK_SESSIONS[sessionId] || null;
}

// Helper to get all available sessions (for testing)
export function getAllMockSessions(): InterviewSession[] {
  return Object.values(MOCK_SESSIONS);
}
