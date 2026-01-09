/**
 * Deepgram Utilities
 * Helper functions for processing Deepgram transcription results
 */

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface DeepgramResult {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        words?: DeepgramWord[];
        transcript?: string;
      }>;
    }>;
  };
}

interface SrtCue {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Format seconds to SRT timestamp format (HH:MM:SS,mmm)
 */
function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

/**
 * Convert Deepgram JSON result to SRT subtitle format
 * Groups words into readable lines (roughly 10 words or 40 chars per line)
 *
 * @param deepgramResult - The full Deepgram transcription result
 * @param maxWordsPerLine - Maximum words per subtitle line (default: 8)
 * @param maxCharsPerLine - Maximum characters per subtitle line (default: 42)
 * @param maxDuration - Maximum duration per subtitle in seconds (default: 4)
 * @returns SRT formatted string
 */
export function jsonToSrt(
  deepgramResult: DeepgramResult,
  maxWordsPerLine: number = 8,
  maxCharsPerLine: number = 42,
  maxDuration: number = 4
): string {
  const words = deepgramResult?.results?.channels?.[0]?.alternatives?.[0]?.words;

  if (!words || words.length === 0) {
    console.warn('No words found in Deepgram result');
    return '';
  }

  const cues: SrtCue[] = [];
  let currentWords: DeepgramWord[] = [];
  let currentText = '';
  let cueIndex = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordText = word.punctuated_word || word.word;
    const potentialText = currentText ? `${currentText} ${wordText}` : wordText;

    // Check if we should start a new cue
    const wordCount = currentWords.length + 1;
    const charCount = potentialText.length;
    const duration = currentWords.length > 0
      ? word.end - currentWords[0].start
      : 0;

    const shouldBreak =
      wordCount > maxWordsPerLine ||
      charCount > maxCharsPerLine ||
      duration > maxDuration ||
      // Break on sentence-ending punctuation
      (currentText && /[.!?]$/.test(currentText));

    if (shouldBreak && currentWords.length > 0) {
      // Save current cue
      cues.push({
        index: cueIndex++,
        startTime: formatSrtTime(currentWords[0].start),
        endTime: formatSrtTime(currentWords[currentWords.length - 1].end),
        text: currentText,
      });

      // Start new cue with current word
      currentWords = [word];
      currentText = wordText;
    } else {
      // Add to current cue
      currentWords.push(word);
      currentText = potentialText;
    }
  }

  // Don't forget the last cue
  if (currentWords.length > 0) {
    cues.push({
      index: cueIndex,
      startTime: formatSrtTime(currentWords[0].start),
      endTime: formatSrtTime(currentWords[currentWords.length - 1].end),
      text: currentText,
    });
  }

  // Generate SRT string
  const srtLines = cues.map((cue) => {
    return `${cue.index}\n${cue.startTime} --> ${cue.endTime}\n${cue.text}\n`;
  });

  return srtLines.join('\n');
}

/**
 * Parse SRT string back to cue array (for debugging/verification)
 */
export function parseSrt(srtContent: string): SrtCue[] {
  const cues: SrtCue[] = [];
  const blocks = srtContent.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const index = parseInt(lines[0], 10);
      const [startTime, endTime] = lines[1].split(' --> ');
      const text = lines.slice(2).join('\n');

      cues.push({ index, startTime, endTime, text });
    }
  }

  return cues;
}
