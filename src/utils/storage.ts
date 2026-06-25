import AsyncStorage from '@react-native-async-storage/async-storage';
import { WikiArticle } from '../types';

const KEY = 'scrollpedia_saved';

export function getArticleKey(article: Pick<WikiArticle, 'pageid' | 'lang' | 'fullurl'>): string {
  const urlLang = article.fullurl.match(/^https:\/\/([a-z-]+)\.wikipedia\.org\//)?.[1];
  return `${article.lang ?? urlLang ?? 'hr'}:${article.pageid}`;
}

export async function getSaved(): Promise<WikiArticle[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveArticle(article: WikiArticle): Promise<void> {
  const current = await getSaved();
  const key = getArticleKey(article);
  if (current.find((a) => getArticleKey(a) === key)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([article, ...current]));
}

export async function unsaveArticle(article: WikiArticle): Promise<void> {
  const current = await getSaved();
  const key = getArticleKey(article);
  await AsyncStorage.setItem(KEY, JSON.stringify(current.filter((a) => getArticleKey(a) !== key)));
}

export async function isArticleSaved(article: WikiArticle): Promise<boolean> {
  const current = await getSaved();
  const key = getArticleKey(article);
  return current.some((a) => getArticleKey(a) === key);
}
