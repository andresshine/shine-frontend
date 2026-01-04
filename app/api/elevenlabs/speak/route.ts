/**
 * API Route: ElevenLabs Text-to-Speech
 * POST /api/elevenlabs/speak
 * Converts text to speech using ElevenLabs TTS
 */

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

// Use a professional voice for the AI interviewer
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam - professional male voice

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Missing text parameter' },
        { status: 400 }
      );
    }

    console.log(`🎙️  Generating speech for: "${text.substring(0, 50)}..."`);

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Updated to free-tier compatible model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS API error: ${response.status}`);
    }

    // Get the audio stream
    const audioBuffer = await response.arrayBuffer();

    // Return audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
