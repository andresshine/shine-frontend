/**
 * Mux Client Configuration
 * Server-side only - uses Mux API credentials
 */

import Mux from "@mux/mux-node";

// Lazy initialization to avoid throwing at module load time
let muxClient: Mux | null = null;

function getMuxClient(): Mux {
  if (!muxClient) {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new Error(
        "Missing Mux credentials. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables"
      );
    }
    muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
  }
  return muxClient;
}

// Export getter for backwards compatibility
export const mux = {
  get video() {
    return getMuxClient().video;
  },
};

/**
 * Create a direct upload URL for video upload
 * This allows the browser to upload directly to Mux
 */
export async function createDirectUpload(corsOrigin: string = "*") {
  try {
    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline", // Baseline tier preserves 1080p input resolution
        mp4_support: "standard", // Enable static renditions (low.mp4, medium.mp4, audio.m4a) for transcription & Shotstack
      },
    });

    return {
      uploadUrl: upload.url,
      uploadId: upload.id,
    };
  } catch (error) {
    console.error("Error creating direct upload:", error);
    throw error;
  }
}

/**
 * Get asset details by asset ID
 */
export async function getAsset(assetId: string) {
  try {
    const asset = await mux.video.assets.retrieve(assetId);
    return asset;
  } catch (error) {
    console.error("Error fetching asset:", error);
    throw error;
  }
}

/**
 * Get upload details by upload ID
 */
export async function getUpload(uploadId: string) {
  try {
    const upload = await mux.video.uploads.retrieve(uploadId);
    return upload;
  } catch (error) {
    console.error("Error fetching upload:", error);
    throw error;
  }
}
