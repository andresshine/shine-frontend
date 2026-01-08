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
  isBlurEnabled?: boolean;
  onToggleBlur?: () => void;
  showBlurToggle?: boolean;
}

export function VideoContainer({
  stream,
  previewUrl,
  isRecording,
  isBlurEnabled,
  onToggleBlur,
  showBlurToggle
}: VideoContainerProps) {
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

        {/* Blur Toggle Button - top right corner */}
        {showBlurToggle && (
          <button
            onClick={onToggleBlur}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/60 dark:bg-black/60 backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-black/80"
            title={isBlurEnabled ? "Disable background blur" : "Enable background blur"}
          >
            {/* Droplet Icon for Blur */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-900 dark:text-white"
            >
              <path
                d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={isBlurEnabled ? "currentColor" : "none"}
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
