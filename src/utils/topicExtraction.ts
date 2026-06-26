import { TopicChip } from '../types';

// Category name prefix per Wikipedia language edition
const LANG_PREFIX: Record<string, string> = {
  en: 'Category:',
  hr: 'Kategorija:',
  de: 'Kategorie:',
  fr: 'Catégorie:',
  es: 'Categoría:',
  it: 'Categoria:',
};

// Substrings that mark a category as noise (maintenance, tracking, etc.)
const NOISE_PATTERNS = [
  'stub', 'stubs',
  'disambiguation',
  'maintenance',
  'cs1', 'cs 1',
  'tracking',
  'template', 'templates',
  'wikipedia',
  'wikimedia',
  'wikiproject',
  'wikidata',
  'articles with',
  'articles using',
  'all articles',
  'pages with',
  'pages using',
  'use dmy', 'use mdy',
  'dmy dates', 'mdy dates',
  'short description',
  'redirect', 'redirects',
  'harv',
  'deprecated',
  'webarchive',
  'orphan',
  'commons category',
  'interwiki',
  'portal',
  'help:',
  'draft:',
  'talk:',
];

// Trailing suffixes to strip from display names
const STRIP_SUFFIXES = [
  / articles$/i,
  / article$/i,
  / stubs$/i,
  / stub$/i,
  / pages$/i,
  / page$/i,
  / templates$/i,
  / template$/i,
];

function isNoisy(name: string): boolean {
  const lower = name.toLowerCase();
  return NOISE_PATTERNS.some((p) => lower.includes(p));
}

function stripSuffixes(name: string): string {
  let result = name;
  for (const pattern of STRIP_SUFFIXES) {
    result = result.replace(pattern, '');
  }
  return result.trim();
}

export function extractTopics(rawCategories: string[], lang: string): TopicChip[] {
  const prefix = LANG_PREFIX[lang] ?? 'Category:';
  const chips: TopicChip[] = [];

  for (const raw of rawCategories) {
    // Remove language-specific "Category:" prefix
    let display = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;

    // Skip maintenance/tracking categories
    if (isNoisy(display)) continue;

    // Strip common trailing noise words
    display = stripSuffixes(display);

    // Skip very short or very long names
    if (display.length < 2 || display.length > 45) continue;

    chips.push({ display, raw });

    if (chips.length >= 5) break;
  }

  return chips;
}
