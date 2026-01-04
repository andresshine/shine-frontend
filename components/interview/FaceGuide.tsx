"use client";

/**
 * FaceGuide Component
 * SVG overlay showing face/body positioning guide (hidden when recording)
 */

export function FaceGuide() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 200 280"
        aria-hidden="true"
        className="w-64 h-auto drop-shadow-[0_0_20px_rgba(143,132,194,0.4)] dark:drop-shadow-[0_0_20px_rgba(143,132,194,0.3)]"
      >
        {/* Head outline */}
        <ellipse
          cx="100"
          cy="85"
          rx="50"
          ry="60"
          fill="none"
          stroke="rgba(143, 132, 194, 0.6)"
          strokeWidth="3"
          strokeDasharray="8 6"
        />

        {/* Neck */}
        <path
          d="M 75 135 L 75 160 M 125 135 L 125 160"
          fill="none"
          stroke="rgba(143, 132, 194, 0.6)"
          strokeWidth="3"
          strokeDasharray="8 6"
        />

        {/* Shoulders */}
        <path
          d="M 30 200 Q 50 160, 75 160 M 125 160 Q 150 160, 170 200"
          fill="none"
          stroke="rgba(143, 132, 194, 0.6)"
          strokeWidth="3"
          strokeDasharray="8 6"
          strokeLinecap="round"
        />

        {/* Bottom shoulder line */}
        <path
          d="M 30 200 L 30 240 M 170 200 L 170 240"
          fill="none"
          stroke="rgba(143, 132, 194, 0.6)"
          strokeWidth="3"
          strokeDasharray="8 6"
        />
      </svg>
    </div>
  );
}
