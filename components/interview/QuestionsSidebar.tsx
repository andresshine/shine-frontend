"use client";

/**
 * QuestionsSidebar Component
 * Collapsible left panel containing questions list with smooth transitions
 */

import { X } from "lucide-react";
import { QuestionsList } from "./QuestionsList";

interface QuestionsSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function QuestionsSidebar({ isExpanded, onToggle }: QuestionsSidebarProps) {
  return (
    <>
      {/* Backdrop for mobile/tablet - with fade transition */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 lg:hidden
          transition-opacity duration-500 ease-out
          ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onToggle}
      />

      {/* Sidebar Panel - Desktop: width animation, Mobile: slide from left */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          flex flex-col
          h-full lg:h-auto lg:flex-shrink-0
          bg-background-light dark:bg-background-dark
          border-r border-border-light dark:border-border-dark lg:border-r-0
          pt-6 px-4 lg:px-0
          overflow-hidden

          /* Mobile: slide from left */
          w-[85%] sm:w-[350px]
          transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isExpanded ? 'translate-x-0' : '-translate-x-full'}

          /* Desktop: width + opacity animation */
          lg:transition-all lg:duration-700 lg:ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isExpanded
            ? 'lg:w-[380px] xl:w-[420px] lg:opacity-100 lg:translate-x-0 lg:pr-6'
            : 'lg:w-0 lg:opacity-0 lg:translate-x-0 lg:pr-0 lg:px-0'
          }
        `}
        role="complementary"
        aria-label="Interview Questions"
        aria-hidden={!isExpanded}
      >
        {/* Inner content wrapper - prevents content from being squished during animation */}
        <div className={`
          flex flex-col h-full min-w-[320px] lg:min-w-[360px]
          transition-opacity duration-500 ease-out delay-100
          ${isExpanded ? 'opacity-100' : 'opacity-0'}
        `}>
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4 pr-2">
            <h2 className="text-base font-bold text-foreground-light dark:text-foreground-dark-secondary uppercase tracking-wider">
              Questions
            </h2>
            <button
              onClick={onToggle}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-card-light dark:hover:bg-card-dark text-foreground-light-muted dark:text-foreground-dark-subtle transition-colors"
              aria-label="Close questions panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Questions List - takes remaining space with internal scrolling */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <QuestionsList />
          </div>
        </div>
      </aside>
    </>
  );
}
