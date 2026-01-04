/**
 * API Route: Create Mux Direct Upload
 * POST /api/mux/upload
 * Generates a direct upload URL for uploading videos to Mux
 */

import { NextRequest, NextResponse } from "next/server";
import { createDirectUpload } from "@/lib/mux/client";

export async function POST(request: NextRequest) {
  try {
    // Get the origin from headers for CORS
    const origin = request.headers.get("origin") || "*";

    // Create direct upload URL
    const { uploadUrl, uploadId } = await createDirectUpload(origin);

    return NextResponse.json({
      uploadUrl,
      uploadId,
    });
  } catch (error) {
    console.error("Error in Mux upload API:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
