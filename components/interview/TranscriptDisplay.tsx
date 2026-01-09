/**
 * TranscriptDisplay Component
 * Shows transcript for a recording with status indicator
 */

interface TranscriptDisplayProps {
  transcript?: string | null;
  status?: string;
}

export function TranscriptDisplay({ transcript, status }: TranscriptDisplayProps) {
  if (status === "processing") {
    return (
      <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Transcribing audio...
          </span>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <span className="text-sm text-red-800 dark:text-red-200">
          Transcription failed
        </span>
      </div>
    );
  }

  if (!transcript || status !== "completed") {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-[#FAF9F6] dark:bg-[rgba(255,255,255,0.03)] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.06)] rounded-lg">
      <div className="flex items-start gap-2">
        <svg
          className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground-light-muted dark:text-foreground-dark-subtle mb-1">
            Transcript
          </p>
          <p className="text-sm text-foreground-light-secondary dark:text-foreground-dark-muted leading-relaxed">
            {transcript}
          </p>
        </div>
      </div>
    </div>
  );
}
