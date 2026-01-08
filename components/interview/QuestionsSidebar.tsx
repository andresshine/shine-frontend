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
      className="hidden md:flex flex-col w-full md:w-1/3 h-screen bg-white dark:bg-gray-900 border-r border-border-light dark:border-gold/10"
      role="complementary"
      aria-label="Interview Questions"
    >
      {/* Company Branding */}
      <CompanyBranding onBrandPanelToggle={onBrandPanelToggle} />

      {/* Questions List - takes remaining space */}
      <div className="pt-6 flex-1 overflow-y-auto">
        <QuestionsList />
      </div>

      {/* Sidebar Actions - fixed at bottom */}
      <div className="flex-shrink-0">
        <SidebarActions />
      </div>
    </aside>
  );
}
