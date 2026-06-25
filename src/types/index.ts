export interface WikiArticle {
  pageid: number;
  lang?: string;
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  fullurl: string;
  isHighlight?: boolean;
  isOnThisDay?: boolean;
  onThisDayYear?: number;
  onThisDayText?: string;
}
