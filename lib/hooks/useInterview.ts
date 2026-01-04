/**
 * useInterview Hook
 * Access interview context for managing interview state and navigation
 */

import { useContext } from "react";
import { InterviewContext } from "@/components/providers/InterviewProvider";

export function useInterview() {
  const context = useContext(InterviewContext);

  if (context === undefined) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  return context;
}
