import { WikiArticle } from '../types';
import { getStrings } from './i18n';

// ─── Category names per language ───────────────────────────────────────────
const CATEGORY_MAP: Record<string, Record<string, string>> = {
  hr: {
    'Povijest':    'Kategorija:Povijest',
    'Znanost':     'Kategorija:Znanost',
    'Sport':       'Kategorija:Šport',
    'Geografija':  'Kategorija:Geografija',
    'Kultura':     'Kategorija:Kultura',
    'Tehnologija': 'Kategorija:Tehnologija',
    'Priroda':     'Kategorija:Priroda',
  },
  en: {
    'History':     'Category:History',
    'Science':     'Category:Science',
    'Sport':       'Category:Sports',
    'Geography':   'Category:Geography',
    'Culture':     'Category:Culture',
    'Technology':  'Category:Technology',
    'Nature':      'Category:Nature',
  },
  de: {
    'Geschichte':   'Kategorie:Geschichte',
    'Wissenschaft': 'Kategorie:Wissenschaft',
    'Sport':        'Kategorie:Sport',
    'Geografie':    'Kategorie:Geografie',
    'Kultur':       'Kategorie:Kultur',
    'Technologie':  'Kategorie:Technologie',
    'Natur':        'Kategorie:Natur',
  },
  fr: {
    'Histoire':    'Catégorie:Histoire',
    'Science':     'Catégorie:Science',
    'Sport':       'Catégorie:Sport',
    'Géographie':  'Catégorie:Géographie',
    'Culture':     'Catégorie:Culture',
    'Technologie': 'Catégorie:Technologie',
    'Nature':      'Catégorie:Nature',
  },
  es: {
    'Historia':    'Categoría:Historia',
    'Ciencia':     'Categoría:Ciencia',
    'Deporte':     'Categoría:Deporte',
    'Geografía':   'Categoría:Geografía',
    'Cultura':     'Categoría:Cultura',
    'Tecnología':  'Categoría:Tecnología',
    'Naturaleza':  'Categoría:Naturaleza',
  },
  it: {
    'Storia':      'Categoria:Storia',
    'Scienza':     'Categoria:Scienza',
    'Sport':       'Categoria:Sport',
    'Geografia':   'Categoria:Geografia',
    'Cultura':     'Categoria:Cultura',
    'Tecnologia':  'Categoria:Tecnologia',
    'Natura':      'Categoria:Natura',
  },
};

export function getCategoriesForLang(lang: string) {
  const map = CATEGORY_MAP[lang] ?? CATEGORY_MAP.en;
  return [
    { label: getStrings(lang).all, value: null },
    ...Object.entries(map).map(([label, value]) => ({ label, value })),
  ];
}

// ─── API helpers ────────────────────────────────────────────────────────────
function actionBase(lang: string) {
  return `https://${lang}.wikipedia.org/w/api.php?format=json&origin=*`;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

const PROPS = '&prop=pageimages|extracts|info&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=1200&inprop=url';

function processPages(pages: Record<string, any>, lang: string): WikiArticle[] {
  return Object.values(pages)
    .filter((p: any) => p.extract && p.extract.trim().length > 50)
    .map((p: any) => ({
      pageid: p.pageid,
      lang,
      title: p.title,
      extract: p.extract ?? '',
      thumbnail: p.thumbnail,
      fullurl: p.fullurl ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
    }));
}

// ─── Public API ─────────────────────────────────────────────────────────────
export async function fetchRandomArticles(lang = 'hr'): Promise<WikiArticle[]> {
  const url = actionBase(lang) + '&action=query&generator=random&grnnamespace=0&grnlimit=20' + PROPS;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  return processPages(data?.query?.pages ?? {}, lang);
}

export async function fetchByCategory(category: string, lang = 'hr'): Promise<WikiArticle[]> {
  const url =
    actionBase(lang) +
    `&action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(category)}&gcmlimit=20&gcmtype=page` +
    PROPS;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  return processPages(data?.query?.pages ?? {}, lang);
}

export async function searchArticles(query: string, lang = 'hr'): Promise<WikiArticle[]> {
  if (!query.trim()) return [];
  const url =
    actionBase(lang) +
    `&action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=15` +
    PROPS;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  return processPages(data?.query?.pages ?? {}, lang);
}

export async function fetchFullArticle(title: string, lang = 'hr'): Promise<string> {
  const url = actionBase(lang) + `&action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=1`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();
  const page: any = Object.values(data?.query?.pages ?? {})[0];
  return page?.extract ?? '';
}

export async function fetchDailyHighlight(lang = 'hr'): Promise<WikiArticle | null> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');

  const langs = lang === 'hr' ? ['hr', 'en'] : [lang, 'en'];
  for (const l of langs) {
    try {
      const res = await fetchWithTimeout(`https://${l}.wikipedia.org/api/rest_v1/feed/featured/${y}/${m}/${d}`);
      if (!res.ok) continue;
      const data = await res.json();
      const tfa = data?.tfa;
      if (!tfa?.title || !tfa?.extract) continue;
      return {
        pageid: tfa.pageid ?? -1,
        lang: l,
        title: tfa.title,
        extract: tfa.extract,
        thumbnail: tfa.thumbnail,
        fullurl: tfa.content_urls?.desktop?.page ?? `https://${l}.wikipedia.org/wiki/${encodeURIComponent(tfa.title)}`,
        isHighlight: true,
      };
    } catch { continue; }
  }
  return null;
}

export async function fetchOnThisDay(lang = 'hr'): Promise<WikiArticle | null> {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');

  // EN has the most complete onthisday data; use it as primary for non-EN langs
  const primary = ['en', 'hr', 'de', 'fr', 'es'].includes(lang) ? lang : 'en';
  const candidates = primary === 'en' ? ['en'] : [primary, 'en'];

  for (const l of candidates) {
    try {
      const res = await fetchWithTimeout(`https://${l}.wikipedia.org/api/rest_v1/feed/onthisday/selected/${m}/${d}`);
      if (!res.ok) continue;
      const data = await res.json();
      const events: any[] = data?.selected ?? [];
      const event = events.find((e) => e.pages?.some((p: any) => p.thumbnail));
      if (!event) continue;
      const page = event.pages.find((p: any) => p.thumbnail) ?? event.pages[0];
      if (!page) continue;
      return {
        pageid: page.pageid ?? -2,
        lang: l,
        title: page.title,
        extract: page.extract ?? event.text ?? '',
        thumbnail: page.thumbnail,
        fullurl: page.content_urls?.desktop?.page ?? `https://${l}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        isOnThisDay: true,
        onThisDayYear: event.year,
        onThisDayText: event.text,
      } as WikiArticle;
    } catch { continue; }
  }
  return null;
}

export async function fetchRelatedArticles(title: string, lang = 'hr'): Promise<WikiArticle[]> {
  try {
    const res = await fetchWithTimeout(
      `https://${lang}.wikipedia.org/api/rest_v1/page/related/${encodeURIComponent(title)}`
    );
    if (!res.ok) throw new Error('related failed');
    const data = await res.json();
    const pages: any[] = data?.pages ?? [];
    return pages.slice(0, 10).map((p) => ({
      pageid: p.pageid ?? Math.random(),
      lang,
      title: p.title,
      extract: p.extract ?? '',
      thumbnail: p.thumbnail,
      fullurl: p.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
    }));
  } catch {
    return [];
  }
}
