/**
 * Estimated reading time in whole minutes for a block of text.
 * Uses an average adult reading speed of ~200 words/min and never
 * returns less than 1 (a card always shows "1 min").
 */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
