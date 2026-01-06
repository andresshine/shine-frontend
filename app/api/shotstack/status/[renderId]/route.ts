/**
 * API Route: GET /api/shotstack/status/[renderId]
 * Check the status of a Shotstack render job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRenderStatus } from '@/lib/services/shotstack';

export async function GET(
  request: NextRequest,
  { params }: { params: { renderId: string } }
) {
  try {
    const { renderId } = params;

    if (!renderId) {
      return NextResponse.json(
        { error: 'Render ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Checking render status for:', renderId);

    const status = await getRenderStatus(renderId);

    return NextResponse.json({
      success: true,
      renderId,
      status: status.status,
      progress: status.progress || 0,
      url: status.url,
      error: status.error,
      muxAssetId: status.destinations?.mux?.assetId,
    });

  } catch (error) {
    console.error('Error checking render status:', error);
    return NextResponse.json(
      { error: 'Failed to check render status' },
      { status: 500 }
    );
  }
}
