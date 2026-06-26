import { useState, useCallback, useRef } from 'react';
import { WikiArticle } from '../types';
import { fetchRandomArticles, fetchByCategory } from '../utils/wikipedia';
import { isArticleAcceptable } from '../utils/articleScoring';
import { fetchPersonalizedBatch } from '../utils/recommendationEngine';

export type FeedMode = 'explore' | 'forYou';

export function useArticles(
  category: string | null = null,
  lang = 'hr',
  feedMode: FeedMode = 'explore',
) {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const seenIds = useRef<Set<number>>(new Set());
  const categoryTokenRef = useRef<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      if (category) {
        // Category feed: paginated, finite
        const { articles: next, continueToken } = await fetchByCategory(
          category,
          lang,
          categoryTokenRef.current,
        );
        categoryTokenRef.current = continueToken;
        const fresh = next.filter(
          (a) => !seenIds.current.has(a.pageid) && isArticleAcceptable(a),
        );
        fresh.forEach((a) => seenIds.current.add(a.pageid));
        if (fresh.length > 0) setArticles((prev) => [...prev, ...fresh]);
        if (!continueToken) setHasMore(false);
      } else {
        // Random / For You feed: infinite — keep fetching until we have MIN_NEW
        // quality articles. MAX_ROUNDS guards against runaway loops.
        const MIN_NEW = 10;
        const MAX_ROUNDS = 5;
        const collected: WikiArticle[] = [];

        for (let round = 0; round < MAX_ROUNDS && collected.length < MIN_NEW; round++) {
          const batch =
            feedMode === 'forYou'
              ? await fetchPersonalizedBatch(lang).catch(() => null)
              : await fetchRandomArticles(lang).catch(() => null);

          if (!batch) continue;

          for (const a of batch) {
            if (!seenIds.current.has(a.pageid) && isArticleAcceptable(a)) {
              seenIds.current.add(a.pageid);
              collected.push(a);
            }
          }
        }

        if (collected.length === 0) throw new Error('No new articles found');
        setArticles((prev) => [...prev, ...collected]);
        // Both random and for-you feeds are infinite — never set hasMore=false
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Greška pri učitavanju');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [category, lang, feedMode]);

  const reset = useCallback(() => {
    loadingRef.current = false;
    seenIds.current = new Set();
    categoryTokenRef.current = null;
    setLoading(false);
    setHasMore(true);
    setArticles([]);
    setError(null);
  }, []);

  return { articles, loading, error, hasMore, loadMore, reset };
}
