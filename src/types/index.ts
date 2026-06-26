export interface TopicChip {
  display: string; // cleaned human-readable name shown as chip
  raw: string;     // original Wikipedia category title used for fetching
}

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
  topics?: TopicChip[];         // up to 5 cleaned topic chips for display
}
