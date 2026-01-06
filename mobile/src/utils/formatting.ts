/**
 * Number formatting utilities for the calculator game
 */

/**
 * Detect if an answer represents a year based on question text and value.
 * Uses the same logic as the snarky remarks detection in gemini.ts
 */
export function isYearAnswer(questionText: string, value: number): boolean {
  return /\b(year|when|what date)\b/i.test(questionText) &&
         value > 1000 && value < 2100;
}

/**
 * Format a number for display, handling special cases like years.
 * Years (1000-2100 when question contains "year"/"when"/"what date") are shown without commas.
 * All other numbers use locale formatting with commas.
 *
 * @param value - The number to format
 * @param questionText - Optional question text to detect if this is a year answer
 * @returns Formatted string representation of the number
 */
export function formatDisplayNumber(
  value: number,
  questionText?: string
): string {
  if (questionText && isYearAnswer(questionText, value)) {
    return value.toString();
  }
  return value.toLocaleString('en-US');
}
