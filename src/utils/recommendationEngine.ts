import { WikiArticle } from '../types';
import { fetchByCategory, fetchRandomArticles } from './wikipedia';
import { getTopInterests } from './interestProfile';

// 60 % personalized, 40 % random exploration to avoid a filter bubble
const PERSONALIZED_RATIO = 0.6;

/**
 * Fetch one batch of articles for the "For You" feed.
 * Alternates between personalized category fetches and random exploration.
 */
export async function fetchPersonalizedBatch(lang: string): Promise<WikiArticle[]> {
  const interests = await getTopInterests(lang, 5);

  if (interests.length === 0 || Math.random() > PERSONALIZED_RATIO) {
    return fetchRandomArticles(lang);
  }

  // Pick randomly from the top 3 interests (weighted toward top)
  const topN = Math.min(3, interests.length);
  const chosen = interests[Math.floor(Math.random() * topN)];

  try {
    const { articles } = await fetchByCategory(chosen.category, lang);
    return articles;
  } catch {
    // Fall back to random if the category fetch fails
    return fetchRandomArticles(lang);
  }
}
