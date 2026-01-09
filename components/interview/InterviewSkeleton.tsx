"use client";

/**
 * Interview Page Skeleton
 *
 * Loading placeholder for the interview page while data is being fetched.
 * Mirrors the actual interview layout for a smooth loading experience.
 */

import {
  Skeleton,
  SkeletonText,
  SkeletonVideo,
  SkeletonButton,
} from "@/components/ui/Skeleton";

export function InterviewSkeleton() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header Skeleton */}
      <div className="border-b border-border-light dark:border-border-dark px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-2.5 w-2.5 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Questions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question Card Skeleton */}
            <div className="bg-card-light dark:bg-card-dark rounded-[var(--brand-radius)] p-6 border border-border-light dark:border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-3/4 mb-6" />
              <div className="pt-4 border-t border-border-light dark:border-border-dark">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <SkeletonText className="w-full" />
                    <SkeletonText className="w-2/3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Up Next Section Skeleton */}
            <div className="bg-card-light dark:bg-card-dark rounded-[var(--brand-radius)] p-4 border border-border-light dark:border-border-dark">
              <Skeleton className="h-4 w-16 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                    <SkeletonText className="flex-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Section Skeleton */}
            <div className="bg-card-light dark:bg-card-dark rounded-[var(--brand-radius)] p-4 border border-border-light dark:border-border-dark">
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <SkeletonText className="w-48" />
                    </div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Video */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Container Skeleton */}
            <SkeletonVideo className="min-h-[300px] lg:min-h-[400px]" />

            {/* Recording Controls Skeleton */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SkeletonButton className="w-40" />
              <SkeletonButton className="w-32" />
              <SkeletonButton className="w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="fixed bottom-4 right-4">
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

/**
 * Minimal skeleton for when only video is loading
 */
export function VideoLoadingSkeleton() {
  return (
    <div className="relative w-full aspect-video bg-black rounded-[var(--brand-radius)] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-white/60 text-sm">Initializing camera...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Question list loading skeleton
 */
export function QuestionsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-[var(--brand-radius)] border border-border-light dark:border-border-dark"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonText />
              <SkeletonText className="w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
