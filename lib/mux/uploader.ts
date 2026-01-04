/**
 * Mux Video Uploader
 * Client-side utility for uploading videos to Mux using direct upload
 */

import * as UpChunk from "@mux/upchunk";

export interface UploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
}

export interface UploadResult {
  success: boolean;
  assetId?: string;
  error?: string;
}

/**
 * Upload a video blob to Mux
 */
export async function uploadVideoToMux(
  videoBlob: Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Step 1: Get direct upload URL from our API
    const response = await fetch("/api/mux/upload", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { uploadUrl, uploadId } = await response.json();

    // Step 2: Convert Blob to File (UpChunk requires a File object)
    const videoFile = new File(
      [videoBlob],
      `recording-${Date.now()}.webm`,
      { type: "video/webm" }
    );

    // Step 3: Upload the video using UpChunk
    return new Promise((resolve, reject) => {
      const upload = UpChunk.createUpload({
        endpoint: uploadUrl,
        file: videoFile,
        chunkSize: 5120, // 5MB chunks
      });

      // Track upload progress
      upload.on("progress", (progressEvent) => {
        if (onProgress) {
          onProgress({
            percentage: Math.round(progressEvent.detail),
            uploadedBytes: 0, // UpChunk doesn't provide this
            totalBytes: videoBlob.size,
          });
        }
      });

      // Handle successful upload
      upload.on("success", () => {
        // Note: uploadId is the Upload ID, not Asset ID
        // Asset ID will be created by Mux after processing
        resolve({
          success: true,
          assetId: uploadId, // This is actually uploadId
        });
      });

      // Handle upload error
      upload.on("error", (error) => {
        console.error("Upload error:", error);
        reject({
          success: false,
          error: error.detail?.message || "Upload failed",
        });
      });
    });
  } catch (error) {
    console.error("Error uploading to Mux:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if Mux upload is supported in this browser
 */
export function isMuxUploadSupported(): boolean {
  return !!(
    typeof window !== "undefined" &&
    window.MediaRecorder &&
    window.Blob
  );
}
