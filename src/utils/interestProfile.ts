import AsyncStorage from '@react-native-async-storage/async-storage';
import { WikiArticle } from '../types';

const PROFILE_KEY = 'scrollpedia_interest_profile';
// Minimum interactions before "For You" feed is considered ready
export const FOR_YOU_THRESHOLD = 20;

interface InterestProfile {
  // Keys are "${lang}:${rawCategory}" so they are language-scoped
  categories: Record<string, number>;
  totalInteractions: number;
}

const WEIGHTS = { view: 1, read: 3, save: 5 } as const;
type InteractionType = keyof typeof WEIGHTS;

async function load(): Promise<InterestProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as InterestProfile;
  } catch {}
  return { categories: {}, totalInteractions: 0 };
}

async function persist(profile: InterestProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

/**
 * Record that the user interacted with an article.
 * Fire-and-forget — do not await in render paths.
 */
export async function trackInteraction(
  article: WikiArticle,
  type: InteractionType,
): Promise<void> {
  if (!article.topics || article.topics.length === 0) return;
  const lang = article.lang ?? 'en';
  const weight = WEIGHTS[type];
  const profile = await load();

  for (const chip of article.topics) {
    const key = `${lang}:${chip.raw}`;
    profile.categories[key] = (profile.categories[key] ?? 0) + weight;
  }
  profile.totalInteractions += 1;
  await persist(profile);
}

/**
 * Record that the user manually selected a category from the filter bar.
 */
export async function trackCategorySelect(rawCategory: string, lang: string): Promise<void> {
  const profile = await load();
  const key = `${lang}:${rawCategory}`;
  profile.categories[key] = (profile.categories[key] ?? 0) + 3;
  profile.totalInteractions += 1;
  await persist(profile);
}

/**
 * Return top N interest categories for the given language, sorted by weight.
 * Returns the raw Wikipedia category title (without the lang: prefix).
 */
export async function getTopInterests(
  lang: string,
  n = 5,
): Promise<Array<{ category: string; weight: number }>> {
  const profile = await load();
  const prefix = `${lang}:`;
  return Object.entries(profile.categories)
    .filter(([key]) => key.startsWith(prefix))
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([key, weight]) => ({ category: key.slice(prefix.length), weight }));
}

export async function getTotalInteractions(): Promise<number> {
  const profile = await load();
  return profile.totalInteractions;
}

export async function hasEnoughDataForFeed(): Promise<boolean> {
  return (await getTotalInteractions()) >= FOR_YOU_THRESHOLD;
}
