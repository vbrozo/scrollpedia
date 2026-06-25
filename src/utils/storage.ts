import AsyncStorage from '@react-native-async-storage/async-storage';
import { WikiArticle } from '../types';

const KEY = 'scrollpedia_saved';

export async function getSaved(): Promise<WikiArticle[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveArticle(article: WikiArticle): Promise<void> {
  const current = await getSaved();
  if (current.find((a) => a.pageid === article.pageid)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([article, ...current]));
}

export async function unsaveArticle(pageid: number): Promise<void> {
  const current = await getSaved();
  await AsyncStorage.setItem(KEY, JSON.stringify(current.filter((a) => a.pageid !== pageid)));
}

export async function isArticleSaved(pageid: number): Promise<boolean> {
  const current = await getSaved();
  return current.some((a) => a.pageid === pageid);
}
