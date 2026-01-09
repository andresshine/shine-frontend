"use client";

/**
 * Browser Support Detection Hook
 *
 * Checks if the current browser supports all required features for the interview app.
 * Required features:
 * - MediaDevices API (camera/microphone access)
 * - MediaRecorder API (video recording)
 * - WebRTC (real-time communication)
 * - Web Audio API (audio processing)
 */

import { useState, useEffect } from "react";

interface BrowserSupportResult {
  /** Whether all required features are supported */
  isSupported: boolean;
  /** Whether detection is still in progress */
  isChecking: boolean;
  /** List of missing/unsupported features */
  missingFeatures: string[];
  /** Browser name detected */
  browserName: string;
  /** Browser version */
  browserVersion: string;
  /** Whether this is a mobile browser */
  isMobile: boolean;
  /** Recommended browser for this platform */
  recommendedBrowser: string;
}

interface FeatureCheck {
  name: string;
  displayName: string;
  check: () => boolean;
}

const REQUIRED_FEATURES: FeatureCheck[] = [
  {
    name: "mediaDevices",
    displayName: "Camera & Microphone Access",
    check: () =>
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia,
  },
  {
    name: "mediaRecorder",
    displayName: "Video Recording",
    check: () => typeof window !== "undefined" && !!window.MediaRecorder,
  },
  {
    name: "webRTC",
    displayName: "Real-time Communication",
    check: () =>
      typeof window !== "undefined" &&
      (!!window.RTCPeerConnection ||
        // @ts-expect-error - webkit prefix
        !!window.webkitRTCPeerConnection ||
        // @ts-expect-error - moz prefix
        !!window.mozRTCPeerConnection),
  },
  {
    name: "audioContext",
    displayName: "Audio Processing",
    check: () =>
      typeof window !== "undefined" &&
      // @ts-expect-error - webkit prefix
      (!!window.AudioContext || !!window.webkitAudioContext),
  },
  {
    name: "promises",
    displayName: "Modern JavaScript",
    check: () => typeof Promise !== "undefined",
  },
  {
    name: "localStorage",
    displayName: "Local Storage",
    check: () => {
      try {
        const test = "__storage_test__";
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    },
  },
];

function detectBrowser(): { name: string; version: string; isMobile: boolean } {
  if (typeof window === "undefined") {
    return { name: "Unknown", version: "", isMobile: false };
  }

  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);

  // Order matters - check more specific browsers first
  if (ua.includes("Edg/")) {
    const match = ua.match(/Edg\/(\d+)/);
    return { name: "Edge", version: match?.[1] || "", isMobile };
  }
  if (ua.includes("OPR/") || ua.includes("Opera")) {
    const match = ua.match(/(?:OPR|Opera)\/(\d+)/);
    return { name: "Opera", version: match?.[1] || "", isMobile };
  }
  if (ua.includes("Chrome/") && !ua.includes("Chromium")) {
    const match = ua.match(/Chrome\/(\d+)/);
    return { name: "Chrome", version: match?.[1] || "", isMobile };
  }
  if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    const match = ua.match(/Version\/(\d+)/);
    return { name: "Safari", version: match?.[1] || "", isMobile };
  }
  if (ua.includes("Firefox/")) {
    const match = ua.match(/Firefox\/(\d+)/);
    return { name: "Firefox", version: match?.[1] || "", isMobile };
  }

  return { name: "Unknown", version: "", isMobile };
}

function getRecommendedBrowser(isMobile: boolean): string {
  if (typeof navigator === "undefined") return "Chrome";

  const platform = navigator.platform?.toLowerCase() || "";
  const ua = navigator.userAgent;

  if (isMobile) {
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return "Safari";
    }
    return "Chrome for Android";
  }

  if (platform.includes("mac")) {
    return "Safari or Chrome";
  }
  if (platform.includes("win")) {
    return "Chrome or Edge";
  }
  if (platform.includes("linux")) {
    return "Chrome or Firefox";
  }

  return "Chrome";
}

export function useBrowserSupport(): BrowserSupportResult {
  const [result, setResult] = useState<BrowserSupportResult>({
    isSupported: true,
    isChecking: true,
    missingFeatures: [],
    browserName: "",
    browserVersion: "",
    isMobile: false,
    recommendedBrowser: "Chrome",
  });

  useEffect(() => {
    const browser = detectBrowser();
    const missingFeatures: string[] = [];

    // Check each required feature
    REQUIRED_FEATURES.forEach((feature) => {
      if (!feature.check()) {
        missingFeatures.push(feature.displayName);
      }
    });

    // Additional checks for known problematic browsers
    const isOldBrowser = (() => {
      const version = parseInt(browser.version, 10);
      if (browser.name === "Chrome" && version < 60) return true;
      if (browser.name === "Firefox" && version < 60) return true;
      if (browser.name === "Safari" && version < 11) return true;
      if (browser.name === "Edge" && version < 79) return true; // Pre-Chromium Edge
      return false;
    })();

    if (isOldBrowser) {
      missingFeatures.push("Up-to-date Browser Version");
    }

    setResult({
      isSupported: missingFeatures.length === 0,
      isChecking: false,
      missingFeatures,
      browserName: browser.name,
      browserVersion: browser.version,
      isMobile: browser.isMobile,
      recommendedBrowser: getRecommendedBrowser(browser.isMobile),
    });
  }, []);

  return result;
}
