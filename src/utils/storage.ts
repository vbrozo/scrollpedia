import { WikiArticle } from '../types';

/**
 * Stable identity for a saved article: `lang:pageid`.
 * Persistence + the saved list now live in SavedContext (in-memory + AsyncStorage);
 * this helper stays here because both the context and list views need the key.
 */
export function getArticleKey(article: Pick<WikiArticle, 'pageid' | 'lang' | 'fullurl'>): string {
  const urlLang = article.fullurl.match(/^https:\/\/([a-z-]+)\.wikipedia\.org\//)?.[1];
  return `${article.lang ?? urlLang ?? 'hr'}:${article.pageid}`;
}
