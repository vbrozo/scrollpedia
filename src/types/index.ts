export interface WikiArticle {
  pageid: number;
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  fullurl: string;
}
