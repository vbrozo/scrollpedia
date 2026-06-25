import { WikiArticle } from '../types';

const WIKI_API =
  'https://hr.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
  '&generator=random&grnnamespace=0&grnlimit=20' +
  '&prop=pageimages|extracts|info' +
  '&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=1200&inprop=url';

export async function fetchRandomArticles(): Promise<WikiArticle[]> {
  const res = await fetch(WIKI_API);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return [];

  return Object.values(pages as Record<string, any>)
    .filter((p: any) => p.extract && p.extract.trim().length > 50)
    .map((p: any) => ({
      pageid: p.pageid,
      title: p.title,
      extract: p.extract ?? '',
      thumbnail: p.thumbnail,
      fullurl: p.fullurl ?? `https://hr.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
    }));
}
