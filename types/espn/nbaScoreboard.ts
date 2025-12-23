// ESPN NBA Scoreboard API Response Types
// Source: https://cdn.espn.com/core/nba/scoreboard?xhr=1&limit=50
// NBA uses a different structure than NFL - data is wrapped in content.sbData

import type { 
  Event, 
  Season, 
  Week, 
  League,
  NewsArticle as ScoreboardNewsArticle,
  Link,
  Image
} from './scoreboard';

export interface NBAScoreboardResponse {
  news: NewsSection;
  pinnedCount: number;
  nowFeedMD5Hash: string;
  type: string;
  content: ContentSection;
  analytics: any; // Complex analytics object
  nowFeed: NowFeedItem[];
  ads: any; // Complex ads object
  nowFeedCount: number;
  meta: MetaSection;
  nowFeedSupported: boolean;
  sport: string[];
  tier2Nav: any; // Complex navigation object
}

export interface NewsSection {
  link: Link;
  header: string;
  articles: ScoreboardNewsArticle[];
}

export interface ContentSection {
  league: string;
  sbGroup: ScoreboardGroup;
  sbData: ScoreboardData;
  isWeekOriented: boolean;
  dateParams: {
    date: string;
  };
  calendar: string[]; // Array of ISO date strings
  defaults: {
    scoDate: string;
  };
  title: string;
  description: string;
  og_type: string;
  canonical: string;
}

export interface ScoreboardGroup {
  pageTitle: string;
  altTitle: string;
  scheduleStartDate: string;
  isCollege: boolean;
  league: string;
  sport: string;
}

export interface ScoreboardData {
  leagues?: League[];
  season?: Season;
  week?: Week;
  events: Event[];
}

export interface NowFeedItem {
  id: string;
  story: string;
  timestamp: string;
  premium: boolean;
  type: string;
  links?: {
    web?: {
      href: string;
    };
  };
  images?: Image[];
  categories?: any[];
}

export interface MetaSection {
  title: string;
  description: string;
  canonical: string;
  og_title: string;
  og_description: string;
  og_url: string;
  og_type: string;
  og_site_name: string;
  twitter_card: string;
  twitter_site: string;
  twitter_title: string;
  twitter_description: string;
  twitter_url: string;
  twitter_app_name_iphone: string;
  [key: string]: string;
}

// Helper function to extract the standard scoreboard data from NBA response
export function extractNBAScoreboardData(response: NBAScoreboardResponse): ScoreboardData {
  return response.content.sbData;
}
