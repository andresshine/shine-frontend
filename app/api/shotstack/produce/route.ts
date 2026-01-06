/**
 * API Route: POST /api/shotstack/produce
 * Triggers Shotstack post-production for a testimonial video
 */

import { NextRequest, NextResponse } from 'next/server';
import { produceTestimonial } from '@/lib/services/shotstack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, quoteText, theme, musicUrl, duration } = body;

    // Validate required fields
    if (!videoUrl || !quoteText || !theme) {
      return NextResponse.json(
        { error: 'Missing required fields: videoUrl, quoteText, theme' },
        { status: 400 }
      );
    }

    // Validate theme structure
    if (!theme.primaryColor || !theme.fontFamily || !theme.backgroundType) {
      return NextResponse.json(
        { error: 'Invalid theme configuration' },
        { status: 400 }
      );
    }

    console.log('🎬 Starting video post-production...');
    console.log('Video URL:', videoUrl);
    console.log('Quote:', quoteText);
    console.log('Theme:', theme);

    // Trigger Shotstack render
    const result = await produceTestimonial({
      videoUrl,
      quoteText,
      theme,
      musicUrl,
      duration,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      renderId: result.response?.id,
      status: result.response?.status,
      message: 'Video production started successfully',
    });

  } catch (error) {
    console.error('Error in Shotstack produce route:', error);
    return NextResponse.json(
      { error: 'Failed to start video production' },
      { status: 500 }
    );
  }
}
