import { useState, useCallback, useRef } from 'react';
import { WikiArticle } from '../types';
import { fetchRandomArticles, fetchByCategory } from '../utils/wikipedia';

export function useArticles(category: string | null = null, lang = 'hr') {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const seenIds = useRef<Set<number>>(new Set());

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      if (category) {
        // categorymembers returns a fixed set — a single fetch is enough
        const next = await fetchByCategory(category, lang);
        const fresh = next.filter((a) => !seenIds.current.has(a.pageid));
        fresh.forEach((a) => seenIds.current.add(a.pageid));
        if (fresh.length > 0) setArticles((prev) => [...prev, ...fresh]);
      } else {
        // Random feed: the image-only filter thins each batch, so keep
        // fetching until we collect enough new articles for a smooth scroll.
        const MIN_NEW = 10;
        const MAX_ATTEMPTS = 5;
        const collected: WikiArticle[] = [];
        for (let i = 0; i < MAX_ATTEMPTS && collected.length < MIN_NEW; i++) {
          const next = await fetchRandomArticles(lang);
          for (const a of next) {
            if (!seenIds.current.has(a.pageid)) {
              seenIds.current.add(a.pageid);
              collected.push(a);
            }
          }
        }
        if (collected.length > 0) setArticles((prev) => [...prev, ...collected]);
      }
    } catch (e: any) {
      setError(e.message ?? 'Greška pri učitavanju');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [category, lang]);

  const reset = useCallback(() => {
    loadingRef.current = false;
    seenIds.current = new Set();
    setLoading(false);
    setArticles([]);
    setError(null);
  }, []);

  return { articles, loading, error, loadMore, reset };
}
