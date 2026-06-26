import { useState, useCallback, useRef } from 'react';
import { WikiArticle } from '../types';
import { fetchRandomArticles, fetchByCategory } from '../utils/wikipedia';

export function useArticles(category: string | null = null, lang = 'hr') {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const seenIds = useRef<Set<number>>(new Set());
  // Tracks the Wikipedia continuation token for the current category page.
  // Reset to null whenever the category or language changes.
  const categoryTokenRef = useRef<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      if (category) {
        const { articles: next, continueToken } = await fetchByCategory(
          category,
          lang,
          categoryTokenRef.current,
        );
        categoryTokenRef.current = continueToken;
        const fresh = next.filter((a) => !seenIds.current.has(a.pageid));
        fresh.forEach((a) => seenIds.current.add(a.pageid));
        if (fresh.length > 0) {
          setArticles((prev) => [...prev, ...fresh]);
        }
        if (!continueToken) {
          setHasMore(false);
        }
      } else {
        // Fetch one batch per round (20 articles each) until we have at least
        // MIN_NEW unseen articles. Sequential requests avoid hammering the API —
        // a single batch almost always satisfies MIN_NEW until seenIds is huge.
        const MIN_NEW = 10;
        const MAX_ROUNDS = 3;
        const collected: WikiArticle[] = [];
        for (let round = 0; round < MAX_ROUNDS && collected.length < MIN_NEW; round++) {
          const batch = await fetchRandomArticles(lang).catch(() => null);
          if (!batch) continue;
          for (const a of batch) {
            if (!seenIds.current.has(a.pageid)) {
              seenIds.current.add(a.pageid);
              collected.push(a);
            }
          }
        }
        if (collected.length === 0) {
          throw new Error('No new articles found');
        }
        setArticles((prev) => [...prev, ...collected]);
        // Random feed is effectively infinite — never set hasMore=false
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Greška pri učitavanju');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [category, lang]);

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
