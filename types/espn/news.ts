// ESPN News API Response Types

export interface NewsResponse {
  header: string;
  link: NewsLink;
  articles: NewsArticle[];
}

export interface NewsLink {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText: string;
  isExternal: boolean;
  isPremium: boolean;
}

export interface NewsArticle {
  id: number;
  nowId: string;
  contentKey: string;
  dataSourceIdentifier: string;
  type: string;
  headline: string;
  description: string;
  lastModified: string;
  published: string;
  images: NewsImage[];
  categories: NewsCategory[];
  premium: boolean;
  links: NewsArticleLinks;
  byline?: string;
}

export interface NewsImage {
  dataSourceIdentifier?: string;
  id?: number;
  type: string;
  name: string;
  alt?: string;
  credit?: string;
  height: number;
  width: number;
  url: string;
  caption?: string;
}

export interface NewsCategory {
  id?: number;
  type: string;
  guid: string;
  description?: string;
  sportId?: number;
  leagueId?: number;
  uid?: string;
  league?: NewsLeague;
}

export interface NewsLeague {
  id: number;
  description: string;
  abbreviation: string;
  links?: {
    web?: {
      leagues?: {
        href: string;
      };
    };
    mobile?: {
      leagues?: {
        href: string;
      };
    };
  };
}

export interface NewsArticleLinks {
  web: {
    href: string;
  };
  mobile?: {
    href: string;
  };
  api: {
    self: {
      href: string;
    };
  };
  app?: {
    sportscenter: {
      href: string;
    };
  };
}
