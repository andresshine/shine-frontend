"use client";

/**
 * QuestionsSidebar Component
 * Left sidebar containing company branding, questions list, and actions
 */

import { CompanyBranding } from "./CompanyBranding";
import { QuestionsList } from "./QuestionsList";
import { SidebarActions } from "./SidebarActions";

interface QuestionsSidebarProps {
  onBrandPanelToggle: () => void;
}

export function QuestionsSidebar({ onBrandPanelToggle }: QuestionsSidebarProps) {
  return (
    <aside
      className="hidden md:flex flex-col w-full md:w-1/3 bg-white dark:bg-gray-900 border-r border-border-light dark:border-gold/10"
      role="complementary"
      aria-label="Interview Questions"
    >
      {/* Company Branding */}
      <CompanyBranding onBrandPanelToggle={onBrandPanelToggle} />

      {/* Questions Header */}
      <div className="px-8 py-8">
        <h2 className="text-gray-900 dark:text-white font-medium mb-3">
          INTERVIEW QUESTIONS
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
          Click Start Recording to begin. While answering, look at the camera
          as much as possible. When you&apos;re done, click Stop Recording.
        </p>
      </div>

      {/* Questions List */}
      <QuestionsList />

      {/* Sidebar Actions */}
      <SidebarActions />
    </aside>
  );
}
