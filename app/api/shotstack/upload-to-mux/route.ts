/**
 * API Route: POST /api/shotstack/upload-to-mux
 * Upload a completed Shotstack video to Mux
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToMux } from '@/lib/services/shotstack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl is required' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading Shotstack video to Mux...');
    console.log('Video URL:', videoUrl);

    const result = await uploadToMux(videoUrl);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to upload to Mux' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assetId: result.assetId,
      playbackId: result.playbackId,
      message: 'Video uploaded to Mux successfully',
    });

  } catch (error) {
    console.error('Error in upload-to-mux route:', error);
    return NextResponse.json(
      { error: 'Failed to upload video to Mux' },
      { status: 500 }
    );
  }
}
