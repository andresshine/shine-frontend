"use client";

/**
 * VideoContainer Component
 * Video area with live camera feed, face guide overlay, and camera status
 */

import { useRef, useEffect } from "react";
import { FaceGuide } from "./FaceGuide";
import { CameraStatus } from "./CameraStatus";

interface VideoContainerProps {
  stream?: MediaStream | null;
  previewUrl?: string | null;
  isRecording?: boolean;
}

export function VideoContainer({ stream, previewUrl, isRecording }: VideoContainerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex items-end justify-center md:justify-end mb-4 flex-1 min-h-0">
      <div className={`w-full md:w-[70.3125%] rounded-[var(--brand-radius)] overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gold/20 aspect-[3/2] ${
        isRecording ? 'max-h-[750px]' : ''
      }`}>
        {/* Live Video Feed or Preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!previewUrl} // Mute live feed, unmute preview
          src={previewUrl || undefined}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Face Guide Overlay - only show when NOT recording */}
        {!isRecording && !previewUrl && <FaceGuide />}

        {/* Camera Status Badge */}
        <CameraStatus />
      </div>
    </div>
  );
}
