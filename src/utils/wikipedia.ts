import { WikiArticle } from '../types';

const BASE = 'https://hr.wikipedia.org/w/api.php?format=json&origin=*';
const PROPS = '&prop=pageimages|extracts|info&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=1200&inprop=url';

export const CATEGORIES: { label: string; value: string | null }[] = [
  { label: 'Sve', value: null },
  { label: 'Povijest', value: 'Kategorija:Povijest' },
  { label: 'Znanost', value: 'Kategorija:Znanost' },
  { label: 'Sport', value: 'Kategorija:Šport' },
  { label: 'Geografija', value: 'Kategorija:Geografija' },
  { label: 'Kultura', value: 'Kategorija:Kultura' },
  { label: 'Tehnologija', value: 'Kategorija:Tehnologija' },
  { label: 'Priroda', value: 'Kategorija:Priroda' },
];

function processPages(pages: Record<string, any>): WikiArticle[] {
  return Object.values(pages)
    .filter((p: any) => p.extract && p.extract.trim().length > 50)
    .map((p: any) => ({
      pageid: p.pageid,
      title: p.title,
      extract: p.extract ?? '',
      thumbnail: p.thumbnail,
      fullurl: p.fullurl ?? `https://hr.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
    }));
}

export async function fetchRandomArticles(): Promise<WikiArticle[]> {
  const url =
    BASE +
    '&action=query&generator=random&grnnamespace=0&grnlimit=20' +
    PROPS;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  return processPages(data?.query?.pages ?? {});
}

export async function fetchByCategory(category: string): Promise<WikiArticle[]> {
  const url =
    BASE +
    `&action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(category)}&gcmlimit=20&gcmtype=page` +
    PROPS;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  return processPages(data?.query?.pages ?? {});
}

export async function searchArticles(query: string): Promise<WikiArticle[]> {
  if (!query.trim()) return [];
  const url =
    BASE +
    `&action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=15` +
    PROPS;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  return processPages(data?.query?.pages ?? {});
}

export async function fetchDailyHighlight(): Promise<WikiArticle | null> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');

  // Try Croatian Wikipedia first, fall back to English
  const langs = ['hr', 'en'];
  for (const lang of langs) {
    try {
      const url = `https://${lang}.wikipedia.org/api/rest_v1/feed/featured/${y}/${m}/${d}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const tfa = data?.tfa;
      if (!tfa?.title || !tfa?.extract) continue;

      return {
        pageid: tfa.pageid ?? -1,
        title: tfa.title,
        extract: tfa.extract,
        thumbnail: tfa.thumbnail
          ? { source: tfa.thumbnail.source, width: tfa.thumbnail.width, height: tfa.thumbnail.height }
          : undefined,
        fullurl:
          tfa.content_urls?.desktop?.page ??
          `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(tfa.title)}`,
        isHighlight: true,
      };
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchFullArticle(title: string): Promise<string> {
  const url =
    BASE +
    `&action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page: any = Object.values(pages)[0];
  return page?.extract ?? '';
}
