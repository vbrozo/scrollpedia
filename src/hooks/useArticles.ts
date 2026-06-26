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

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      if (category) {
        const next = await fetchByCategory(category, lang);
        const fresh = next.filter((a) => !seenIds.current.has(a.pageid));
        fresh.forEach((a) => seenIds.current.add(a.pageid));
        if (fresh.length > 0) {
          setArticles((prev) => [...prev, ...fresh]);
        } else {
          setHasMore(false);
        }
      } else {
        // Fire batches of 3 parallel requests until we have at least MIN_NEW
        // new articles. This guarantees a meaningful scroll buffer on every
        // loadMore and prevents the feed appearing stuck after a fast scroll.
        const MIN_NEW = 10;
        const MAX_ROUNDS = 3;
        const PARALLEL = 3;
        const collected: WikiArticle[] = [];
        for (let round = 0; round < MAX_ROUNDS && collected.length < MIN_NEW; round++) {
          const results = await Promise.allSettled(
            Array.from({ length: PARALLEL }, () => fetchRandomArticles(lang))
          );
          for (const r of results) {
            if (r.status !== 'fulfilled') continue;
            for (const a of r.value) {
              if (!seenIds.current.has(a.pageid)) {
                seenIds.current.add(a.pageid);
                collected.push(a);
              }
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
    setLoading(false);
    setHasMore(true);
    setArticles([]);
    setError(null);
  }, []);

  return { articles, loading, error, hasMore, loadMore, reset };
}
