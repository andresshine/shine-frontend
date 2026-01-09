"use client";

/**
 * Skeleton Loading Components
 *
 * Provides animated placeholder UI while content is loading.
 * Uses a subtle shimmer animation for a polished loading experience.
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#E7E4DF] dark:bg-[rgba(255,255,255,0.1)]",
        className
      )}
    />
  );
}

/**
 * Text line skeleton
 */
export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

/**
 * Heading skeleton
 */
export function SkeletonHeading({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-8 w-3/4", className)} />;
}

/**
 * Circle skeleton (for avatars, icons)
 */
export function SkeletonCircle({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-12 w-12 rounded-full", className)} />;
}

/**
 * Button skeleton
 */
export function SkeletonButton({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-11 w-32 rounded-[var(--brand-radius)]", className)}
    />
  );
}

/**
 * Card skeleton
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--brand-radius)] border border-border-light dark:border-border-dark p-4 space-y-3",
        className
      )}
    >
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Video placeholder skeleton (16:9 aspect ratio)
 */
export function SkeletonVideo({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        "aspect-video w-full rounded-[var(--brand-radius)]",
        className
      )}
    />
  );
}
