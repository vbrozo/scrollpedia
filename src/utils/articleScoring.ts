import { WikiArticle } from '../types';

// Title prefixes that signal list/index/meta pages across all supported languages
const BAD_PREFIXES = [
  // English
  'List of ', 'Index of ', 'Outline of ',
  'Portal:', 'Template:', 'Category:', 'Help:', 'File:', 'Draft:', 'Wikipedia:',
  // Croatian
  'Popis ', 'Indeks ', 'Pregled ',
  'Portal:', 'Predložak:', 'Kategorija:', 'Datoteka:', 'Pomoć:', 'Wikipedija:',
  // German
  'Liste der ', 'Liste von ', 'Index der ',
  'Portal:', 'Vorlage:', 'Kategorie:', 'Datei:', 'Hilfe:', 'Wikipedia:',
  // French
  'Liste des ', 'Liste de ', 'Liste d\'',
  'Portail:', 'Modèle:', 'Catégorie:', 'Fichier:', 'Aide:', 'Wikipédia:',
  // Spanish
  'Anexo:', 'Portal:', 'Plantilla:', 'Categoría:', 'Archivo:', 'Ayuda:', 'Wikipedia:',
  // Italian
  'Elenco di ', 'Portale:', 'Template:', 'Categoria:', 'File:', 'Aiuto:', 'Wikipedia:',
];

// Titles that are year or decade overview pages
const YEAR_PAGE_RE = /^\d{4}(s| in | \(|$)/;
// Disambiguation pages
const DISAMBIG_RE = /\(disambiguation\)/i;

export function scoreArticle(article: WikiArticle): number {
  const extractLen = article.extract?.trim().length ?? 0;

  // Hard rejections — return well below threshold
  if (extractLen < 250) return -999;
  if (DISAMBIG_RE.test(article.title)) return -999;
  if (YEAR_PAGE_RE.test(article.title)) return -999;
  for (const prefix of BAD_PREFIXES) {
    if (article.title.startsWith(prefix)) return -999;
  }

  let score = 0;

  // +25 for thumbnail (processPages already requires one, but spec calls for it)
  if (article.thumbnail?.source) score += 25;
  else score -= 30;

  // +20 for a substantial extract
  if (extractLen > 600) score += 20;

  // +15 for having usable topic categories
  if (article.topics && article.topics.length > 0) score += 15;

  return score;
}

// Minimum acceptable score to show an article in the feed
const SCORE_THRESHOLD = 40;

export function isArticleAcceptable(article: WikiArticle): boolean {
  return scoreArticle(article) >= SCORE_THRESHOLD;
}
