import { useState, useCallback, useRef } from 'react';
import { WikiArticle } from '../types';
import { fetchRandomArticles, fetchByCategory } from '../utils/wikipedia';

export function useArticles(category: string | null = null) {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const next = category
        ? await fetchByCategory(category)
        : await fetchRandomArticles();
      setArticles((prev) => {
        const ids = new Set(prev.map((a) => a.pageid));
        return [...prev, ...next.filter((a) => !ids.has(a.pageid))];
      });
    } catch (e: any) {
      setError(e.message ?? 'Greška pri učitavanju');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [category]);

  const reset = useCallback(() => {
    setArticles([]);
    setError(null);
  }, []);

  return { articles, loading, error, loadMore, reset };
}
