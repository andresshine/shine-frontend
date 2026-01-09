"use client";

/**
 * SkipLinks Component
 *
 * Provides skip links for keyboard navigation, allowing users to
 * quickly jump to main content areas. Essential for screen reader users.
 *
 * @author Shine Studio
 */

import { memo } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface SkipLink {
  /** Target element ID to skip to */
  targetId: string;
  /** Label for the skip link */
  label: string;
}

interface SkipLinksProps {
  /** Links to render */
  links?: SkipLink[];
}

// =============================================================================
// DEFAULT LINKS
// =============================================================================

const DEFAULT_LINKS: SkipLink[] = [
  { targetId: "main-content", label: "Skip to main content" },
  { targetId: "current-question", label: "Skip to current question" },
  { targetId: "recording-controls", label: "Skip to recording controls" },
];

// =============================================================================
// COMPONENT
// =============================================================================

export const SkipLinks = memo(function SkipLinks({
  links = DEFAULT_LINKS,
}: SkipLinksProps) {
  const handleClick = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      aria-label="Skip links"
      className="fixed top-0 left-0 z-[100] p-2"
    >
      {links.map((link) => (
        <a
          key={link.targetId}
          href={`#${link.targetId}`}
          onClick={(e) => {
            e.preventDefault();
            handleClick(link.targetId);
          }}
          className="
            sr-only focus:not-sr-only
            focus:absolute focus:top-2 focus:left-2
            focus:px-4 focus:py-2
            focus:bg-[var(--brand-primary)] focus:text-white
            focus:rounded-[var(--brand-radius)]
            focus:font-medium focus:text-sm
            focus:shadow-lg focus:outline-none
            focus:ring-2 focus:ring-white focus:ring-offset-2
          "
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
});
