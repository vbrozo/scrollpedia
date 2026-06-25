import { useState, useCallback } from 'react';
import { WikiArticle } from '../types';
import { fetchRandomArticles } from '../utils/wikipedia';

export function useArticles() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchRandomArticles();
      setArticles((prev) => [...prev, ...next]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return { articles, loading, error, loadMore };
}
