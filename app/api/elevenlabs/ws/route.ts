/**
 * API Route: ElevenLabs WebSocket Proxy
 * Proxies WebSocket connection between client and ElevenLabs Conversational AI
 */

import { NextRequest } from 'next/server';

// ElevenLabs Conversational AI configuration
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

// Define the 12 interview questions and their evaluation criteria
const INTERVIEW_QUESTIONS = {
  q_role_001: {
    text: "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
    intent: "Assess teamwork, conflict resolution, and communication skills",
    criteria: [
      "Describes a specific situation",
      "Explains their approach to handling the difficulty",
      "Shows self-awareness and emotional intelligence",
      "Discusses the outcome"
    ]
  },
  q_problem_001: {
    text: "Describe a complex problem you solved at work. Walk me through your thought process.",
    intent: "Evaluate problem-solving skills and analytical thinking",
    criteria: [
      "Clearly defines the problem",
      "Explains their analysis process",
      "Discusses solutions considered",
      "Describes implementation and results"
    ]
  },
  q_results_001: {
    text: "Tell me about a time you achieved something you're proud of. What made it meaningful?",
    intent: "Understand values, motivation, and achievement orientation",
    criteria: [
      "Describes the achievement with context",
      "Explains why it was meaningful",
      "Shows personal values alignment",
      "Demonstrates impact awareness"
    ]
  },
  // Add remaining 9 questions here...
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return new Response('Missing session_id', { status: 400 });
  }

  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 });
  }

  try {
    // In Next.js App Router, WebSocket handling needs special setup
    // This is a placeholder - we'll need to use a custom server or edge runtime
    return new Response(
      JSON.stringify({
        error: 'WebSocket support requires custom server setup',
        message: 'Please use /api/elevenlabs/evaluate endpoint for now'
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('WebSocket error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
