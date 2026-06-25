import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WikiArticle } from '../types';
import { getArticleKey } from '../utils/storage';

const KEY = 'scrollpedia_saved';

interface SavedContextValue {
  saved: WikiArticle[];
  /** Synchronous check — no AsyncStorage read per card. */
  isSaved: (article: WikiArticle) => boolean;
  save: (article: WikiArticle) => void;
  unsave: (article: WikiArticle) => void;
  toggle: (article: WikiArticle) => void;
}

const SavedContext = createContext<SavedContextValue>({
  saved: [],
  isSaved: () => false,
  save: () => {},
  unsave: () => {},
  toggle: () => {},
});

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<WikiArticle[]>([]);

  // Load once on mount
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setSaved(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  // Persist whenever the in-memory list changes (after initial load)
  const loaded = React.useRef(false);
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved]);

  const savedKeys = useMemo(() => new Set(saved.map(getArticleKey)), [saved]);

  const value = useMemo<SavedContextValue>(() => {
    const isSaved = (article: WikiArticle) => savedKeys.has(getArticleKey(article));
    const save = (article: WikiArticle) =>
      setSaved((prev) =>
        prev.some((a) => getArticleKey(a) === getArticleKey(article)) ? prev : [article, ...prev]
      );
    const unsave = (article: WikiArticle) =>
      setSaved((prev) => prev.filter((a) => getArticleKey(a) !== getArticleKey(article)));
    const toggle = (article: WikiArticle) => (isSaved(article) ? unsave(article) : save(article));
    return { saved, isSaved, save, unsave, toggle };
  }, [saved, savedKeys]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  return useContext(SavedContext);
}
