// Player Profile API Types

import type { Link, Image } from './game';

// ============================================
// SHARED ATHLETE INTERFACE
// Used across scoreboard, summary, and roster APIs
// ============================================

export interface Athlete {
  id: string;
  uid?: string;
  guid?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName: string;
  shortName?: string;
  links?: Link[];
  headshot?: string | { href: string; alt?: string };
  jersey?: string;
  position: {
    id?: string;
    name?: string;
    displayName?: string;
    abbreviation: string;
  };
  team?: {
    id: string;
    uid?: string;
    slug?: string;
    location?: string;
    name?: string;
    nickname?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    color?: string;
    alternateColor?: string;
    logo?: string;
    logos?: Array<{
      href: string;
      width?: number;
      height?: number;
      rel?: string[];
    }>;
  };
  active?: boolean;
  status?: {
    id: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  college?: {
    id: string;
    mascot?: string;
    name: string;
    shortName?: string;
    abbrev?: string;
  };
  debutYear?: number;
  type?: string;
  displayBirthPlace?: string;
  displayHeight?: string;
  displayWeight?: string;
  displayDOB?: string;
  age?: number;
  displayJersey?: string;
  displayExperience?: string;
  displayDraft?: string;
}

// ============================================
// ATHLETE BIO API
// site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{ATHLETE_ID}
// ============================================

export interface AthleteBio {
  athlete: {
    id: string;
    uid: string;
    guid: string;
    type: string;
    firstName: string;
    lastName: string;
    displayName: string;
    fullName: string;
    debutYear?: number;
    jersey?: string;
    headshot?: {
      href: string;
      alt: string;
    };
    position: {
      id: string;
      name: string;
      displayName: string;
      abbreviation: string;
    };
    team?: {
      id: string;
      uid: string;
      slug: string;
      location: string;
      name: string;
      nickname: string;
      abbreviation: string;
      displayName: string;
      shortDisplayName: string;
      color: string;
      alternateColor: string;
      logos: Array<{
        href: string;
        width: number;
        height: number;
        rel: string[];
      }>;
    };
    college?: {
      id: string;
      mascot: string;
      name: string;
      shortName: string;
      abbrev: string;
    };
    active?: boolean;
    status?: {
      id: string;
      name: string;
      type: string;
      abbreviation: string;
    };
    displayBirthPlace?: string;
    displayHeight?: string;
    displayWeight?: string;
    displayDOB?: string;
    age?: number;
    displayJersey?: string;
    displayExperience?: string;
    displayDraft?: string;
  };
}

// ============================================
// ATHLETE OVERVIEW API
// site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{ATHLETE_ID}/overview
// ============================================

export interface AthleteOverview {
  statistics: SeasonStatistics;
  news: NewsArticle[];
  nextGame: NextGameInfo;
  gameLog: GameLog;
  rotowire?: RotowireInfo;
  fantasy?: FantasyInfo;
}

export interface SeasonStatistics {
  displayName: string;
  categories: StatCategory[];
  labels: string[];
  names: string[];
  displayNames: string[];
  splits: StatSplit[];
}

export interface StatCategory {
  name: string;
  displayName: string;
  count: number;
}

export interface StatSplit {
  displayName: string;
  stats: string[];
}

export interface NewsArticle {
  headline: string;
  lastModified: string;
  root: string;
  premium: boolean;
  links: {
    api: { self: { href: string } };
    mobile: { href: string };
    web: { href: string };
  };
  type: string;
  section: string;
  id: number;
  linkText: string;
  categorized: string;
  description: string;
  nowId: string;
  allowComments: boolean;
  images: Image[];
  categories: any[];
  published: string;
  video?: any[];
  byline?: string;
  authors?: Author[];
  dataSourceIdentifier: string;
}

export interface Author {
  displayName: string;
  biography: string;
  sourceLine: string;
  images: Image[];
  links: {
    api: { self: { href: string } };
  };
}

export interface NextGameInfo {
  displayName: string;
  league: {
    id: string;
    uid: string;
    name: string;
    shortName: string;
    abbreviation: string;
    slug: string;
    events: GameEvent[];
  };
  statistics?: any;
}

export interface GameEvent {
  id: string;
  competitionId: string;
  uid: string;
  date: string;
  timeValid: boolean;
  name: string;
  shortName: string;
  location: string;
  season: number;
  seasonStartDate: string;
  seasonEndDate: string;
  seasonType: number;
  seasonTypeHasGroups: boolean;
  week: number;
  weekText: string;
  period: number;
  clock: string;
  links: Link[];
  status: string;
  fullStatus: {
    clock: string;
    displayClock: string;
    period: number;
    type: {
      id: string;
      name: string;
      description: string;
      detail: string;
      shortDetail: string;
      state: string;
      completed: boolean;
    };
  };
  broadcasts: Broadcast[];
  broadcast: string;
  competitors: GameCompetitor[];
  onWatch: boolean;
  recent: boolean;
  odds?: GameOdds;
  appLinks: Link[];
}

export interface Broadcast {
  type: string;
  typeId: number;
  isNational: boolean;
  broadcasterId: number;
  broadcastId: number;
  priority: number;
  name: string;
  shortName: string;
  callLetters: string;
  station: string;
  region: string;
  language: string;
}

export interface GameCompetitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  color: string;
  alternateColor: string;
  group: string;
  homeAway: string;
  abbreviation: string;
  location: string;
  displayName: string;
  score: string;
  record: string;
  winner: boolean;
  name: string;
  logo: string;
  logoDark: string;
}

export interface GameOdds {
  provider: {
    id: string;
    name: string;
    priority: number;
  };
  details: string;
  overUnder: number;
  spread: number;
  overOdds: number;
  underOdds: number;
  awayTeamOdds: TeamOdds;
  homeTeamOdds: TeamOdds;
  links: Link[];
  moneylineWinner: boolean;
  spreadWinner: boolean;
}

export interface TeamOdds {
  team: {
    id: string;
    abbreviation: string;
  };
  favorite: boolean;
  underdog: boolean;
  moneyLine: number;
  spreadOdds: number;
}

export interface GameLog {
  displayName: string;
  statistics: GameLogStatistics[];
  events: Record<string, GameLogEvent>;
}

export interface GameLogStatistics {
  displayName: string;
  labels: string[];
  names: string[];
  displayNames: string[];
  events: GameLogEventStats[];
}

export interface GameLogEventStats {
  eventId: string;
  stats: string[];
}

export interface GameLogEvent {
  id: string;
  links: Link[];
  week: number;
  atVs: string;
  gameDate: string;
  score: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamScore: string;
  awayTeamScore: string;
  gameResult: string;
  opponent: {
    id: string;
    uid: string;
    displayName: string;
    abbreviation: string;
    links: Link[];
    logo: string;
  };
  leagueName: string;
  leagueAbbreviation: string;
  leagueShortName: string;
  eventNote?: string;
  team: {
    id: string;
    uid: string;
    abbreviation: string;
    links: Link[];
    logo: string;
    isAllStar: boolean;
  };
}

export interface RotowireInfo {
  headline: string;
  story: string;
  description: string;
  published: string;
}

export interface FantasyInfo {
  draftRank: string;
  positionRank: string;
  percentOwned: string;
  last7Days: string;
}

// ============================================
// EVENT LOG API
// sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/athletes/{ATHLETE_ID}/eventlog
// ============================================

export interface EventLog {
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: EventLogItem[];
}

export interface EventLogItem {
  $ref: string;
}

export interface EventLogGame {
  id: string;
  guid: string;
  date: string;
  gameDate: string;
  attendance: number;
  timeValid: boolean;
  recent: boolean;
  boxscoreAvailable: boolean;
  boxscoreSource: string;
  playByPlayAvailable: boolean;
  playByPlaySource: string;
  summaryAvailable: boolean;
  liveAvailable: boolean;
  commentaryAvailable: boolean;
  ticketsAvailable: boolean;
  venueAllegiance: string;
  onWatchESPN: boolean;
  event: {
    $ref: string;
  };
  athlete: {
    $ref: string;
  };
  opponent: {
    $ref: string;
  };
  team: {
    $ref: string;
  };
  season: {
    $ref: string;
  };
  seasonType: {
    $ref: string;
  };
  week: {
    $ref: string;
  };
  homeAway: string;
  gameResult: string;
  starter: boolean;
  didNotPlay: boolean;
  active: boolean;
  ejected: boolean;
  statistics?: EventGameStatistics[];
  links: Link[];
}

export interface EventGameStatistics {
  name: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  abbreviation: string;
  type: string;
  value: number;
  displayValue: string;
}

// ============================================
// STATISTICS LOG API
// sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/{ATHLETE_ID}/statisticslog
// ============================================

export interface StatisticsLog {
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: StatisticsLogItem[];
}

export interface StatisticsLogItem {
  $ref: string;
}

export interface StatisticsLogSeason {
  season: {
    $ref: string;
    year: number;
    type: number;
    displayName: string;
  };
  athlete: {
    $ref: string;
  };
  team: {
    $ref: string;
  };
  splits: {
    $ref: string;
    id: string;
    guid: string;
    type: string;
    name: string;
    abbreviation: string;
    categories: StatisticsCategory[];
  };
  categories: StatisticsCategory[];
}

export interface StatisticsCategory {
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  summary: string;
  stats: CategoryStat[];
}

export interface CategoryStat {
  name: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  abbreviation: string;
  type: string;
  value: number;
  displayValue: string;
  perGameValue?: number;
  perGameDisplayValue?: string;
  rank?: number;
  rankDisplayValue?: string;
}

// ============================================
// EXTENDED PLAYER PROFILE
// ============================================

export interface PlayerProfile {
  id: string;
  uid?: string;
  guid?: string;
  displayName: string;
  shortName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headshot?: string | { href: string; alt?: string };
  jersey?: string;
  position?: {
    id?: string;
    name?: string;
    displayName?: string;
    abbreviation: string;
  };
  team?: {
    id: string;
    uid?: string;
    slug?: string;
    location?: string;
    name?: string;
    nickname?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    color?: string;
    alternateColor?: string;
    logo?: string;
  };
  
  // Additional fields from overview API
  overview?: AthleteOverview;
  eventLog?: EventLog;
  statisticsLog?: StatisticsLog;
  
  // Player details
  birthDate?: string;
  age?: number;
  height?: string;
  weight?: string;
  college?: string;
  experience?: number;
  experienceDisplayValue?: string;
  
  // Status
  status?: {
    id: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  
  // Contract
  contract?: {
    salary?: number;
    bonus?: number;
  };
}
