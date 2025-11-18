// --- ROOT INTERFACE ---
export interface Root {
  news: News;
  pinnedCount: number;
  nowFeedMD5Hash: string;
  type: string;
  content: Content;
  analytics: any; // Omitted for brevity
  nowFeed: NowFeedItem[];
  ads: any; // Omitted for brevity
  nowFeedCount: number;
  meta: Meta;
  nowFeedSupported: boolean;
  sport: string[];
  tier2Nav: any; // Omitted for brevity
}

// --- SHARED UTILITY INTERFACES ---
export interface Link {
  isExternal: boolean;
  shortText: string;
  rel: string[];
  language?: string;
  href: string;
  text: string;
  isPremium: boolean;
}

export interface Image {
  name: string;
  type: string;
  url: string;
  width?: number;
  ratio?: string;
  height?: number;
  caption?: string;
  alt?: string;
  credit?: string;
  dataSourceIdentifier?: string;
  id?: number;
}

export interface Status {
  period: number;
  displayClock: string;
  isTBDFlex?: boolean;
  clock: number;
  type: {
    name: string;
    description: string;
    id: string;
    state: string;
    completed: boolean;
    detail: string;
    shortDetail: string;
    altDetail?: string;
  };
}

// --- NEWS SECTION ---
export interface News {
  link: Link;
  header: string;
  articles: Article[];
}

export interface Article {
  contentKey: string;
  images: Image[];
  dataSourceIdentifier: string;
  description: string;
  published: string;
  type: string;
  nowId: string;
  premium: boolean;
  links: ArticleLinks;
  id: number;
  lastModified: string;
  categories: Category[];
  headline: string;
  byline?: string;
}

export interface ArticleLinks {
  app?: {
    sportscenter: { href: string };
  };
  web: {
    href: string;
    self?: { href: string };
    seo?: { href: string };
  };
  mobile?: {
    href: string;
  };
  api: {
    self: { href: string };
    artwork?: { href: string };
  };
  sportscenter?: {
    href: string;
  };
}

// Polymorphic category type
interface Category {
  guid: string;
  type: string;
  description: string;
  id?: number;
  uid?: string;
  sportId?: number;
  teamId?: number;
  team?: { description: string; links: any; id: number };
  leagueId?: number;
  league?: { description: string; links: any; id: number; abbreviation: string };
  eventId?: number;
  event?: { league: string; description: string; links: any; id: number; sport: string };
  topicId?: number;
  athleteId?: number;
  athlete?: { description: string; links: any; id: number };
  contributor?: { description: string; links: any; id: number; slug?: string };
  slug?: string;
}

// --- CONTENT (SCOREBOARD) SECTION ---
interface Content {
  league: string;
  sbGroup: SbGroup;
  sbData: SbData;
  isWeekOriented: boolean;
  dateParams: {
    date: string;
    year: number;
    seasontype: number;
    week: number;
  };
  calendar: CalendarEntry[];
  defaults: {
    week: number;
    year: number;
    seasontype: number;
  };
  title: string;
  description: string;
  og_type: string;
  canonical: string;
}

interface SbGroup {
  pageTitle: string;
  altTitle: string;
  scheduleStartDate: string;
  isCollege: boolean;
  league: string;
  sport: string;
}

interface SbData {
  week: Week;
  leagues: SbLeague[];
  season: SeasonInfo;
  events: Event[];
}

interface Week {
  teamsOnBye: TeamOnBye[];
  number: number;
}

export interface TeamOnBye {
  shortDisplayName: string;
  uid: string;
  displayName: string;
  name: string;
  logo: string;
  location: string;
  links: Link[];
  id: string;
  abbreviation: string;
  isActive: boolean;
}

interface SbLeague {
  calendarIsWhitelist: boolean;
  calendar: CalendarEntry[];
  uid: string;
  calendarType: string;
  calendarEndDate: string;
  calendarStartDate: string;
  name: string;
  season: SbSeason;
  id: string;
  abbreviation: string;
  logos: Logo[];
  slug: string;
}

interface CalendarEntry {
  entries: CalendarSubEntry[];
  endDate: string;
  label: string;
  value: string;
  startDate: string;
}

interface CalendarSubEntry {
  endDate: string;
  alternateLabel: string;
  label: string;
  detail: string;
  value: string;
  startDate: string;
}

interface SbSeason {
  year: number;
  endDate: string;
  displayName: string;
  type: {
    name: string;
    id: string;
    type: number;
    abbreviation: string;
  };
  startDate: string;
}

interface Logo {
  lastUpdated: string;
  width: number;
  alt: string;
  rel: string[];
  href: string;
  height: number;
}

interface SeasonInfo {
  year: number;
  type: number;
}

// --- EVENT (GAME) SECTION ---
export interface Event {
  date: string;
  uid: string;
  week: { number: number };
  name: string;
  competitions: Competition[];
  season: {
    year: number;
    type: number;
    slug: string;
  };
  links: Link[];
  id: string;
  shortName: string;
  status: Status;
  weather: Weather;
}

export interface Competition {
  date: string;
  broadcast?: string;
  venue: Venue;
  conferenceCompetition: boolean;
  notes: any[]; // Can be object with type/headline
  timeValid: boolean;
  geoBroadcasts: any[]; // Omitted for brevity
  format: {
    regulation: { periods: number };
  };
  broadcasts: Array<{ market: string; names: string[] }>;
  playByPlayAvailable: boolean;
  leaders: Leader[];
  type: { id: string; abbreviation: string };
  uid: string;
  competitors: Competitor[];
  highlights?: any[]; // Can contain complex highlight objects
  headlines?: Array<{ description: string; type: string; shortLinkText: string; video?: any[] }>;
  id: string;
  neutralSite: boolean;
  recent: boolean;
  attendance: number;
  situation?: Situation;
  startDate: string;
  status: Status;
  odds?: Odds[];
}

export interface Venue {
  address: {
    country: string;
    city: string;
    state?: string;
  };
  fullName: string;
  indoor: boolean;
  id: string;
}

export interface Leader {
  shortDisplayName: string;
  displayName: string;
  name: string;
  leaders: LeaderDetails[];
  abbreviation: string;
}

interface LeaderDetails {
  displayValue: string;
  athlete: Athlete;
  team: { id: string };
  value: number;
}

export interface Athlete {
  displayName: string;
  headshot: string;
  jersey: string;
  fullName: string;
  active: boolean;
  links: Link[];
  id: string;
  position: { abbreviation: string };
  team: { id: string };
  shortName: string;
}

export interface Competitor {
  uid: string;
  homeAway: string;
  score: string;
  winner?: boolean;
  records: Array<{
    summary: string;
    name: string;
    abbreviation?: string;
    type: string;
  }>;
  id: string;
  team: Team;
  type: string;
  linescores?: Linescore[];
  order: number;
  statistics: any[]; // Omitted for brevity
  leaders: Leader[]; // For pre-game
}

export interface Team {
  alternateColor: string;
  venue: { id: string };
  color: string;
  displayName: string;
  abbreviation: string;
  isActive: boolean;
  shortDisplayName: string;
  uid: string;
  name: string;
  logo: string;
  location: string;
  links: Link[];
  id: string;
}

export interface Linescore {
  displayValue: string;
  period: number;
  value: number;
}

export interface Situation {
  shortDownDistanceText?: string;
  possessionText?: string;
  downDistanceText?: string;
  distance?: number;
  yardLine?: number;
  possession?: string;
  lastPlay?: LastPlay;
  down?: number;
  isRedZone?: boolean;
  homeTimeouts?: number;
  awayTimeouts?: number;
}

export interface LastPlay {
  statYardage: number;
  probability: {
    homeWinPercentage: number;
    awayWinPercentage: number;
    tiePercentage: number;
    secondsLeft: number;
  };
  start: {
    yardLine: number;
    team: { id: string };
  };
  end: {
    yardLine: number;
    team: { id: string };
  };
  id: string;
  text: string;
  team: { id: string };
  type: {
    id: string;
    text: string;
    abbreviation?: string;
  };
  drive: {
    timeElapsed: { displayValue: string };
    start: { yardLine: number; text: string };
    description: string;
  };
  scoreValue: number;
  athletesInvolved?: any[];
}

export interface Weather {
  displayValue: string;
  conditionId: string;
  highTemperature: number;
  temperature: number;
  link: Link;
}

interface Odds {
  awayTeamOdds: OddsTeam;
  link: TrackingLink;
  pointSpread: OddsLine;
  spread: number;
  overUnder: number;
  featuredBets: any[]; // Omitted for brevity
  total: OddsLine;
  provider: OddsProvider;
  header: {
    logo: any;
    text: string;
  };
  details: string;
  links: TrackingLink[];
  moneyline: OddsLine;
  homeTeamOdds: OddsTeam;
}

interface OddsProvider {
  name: string;
  id: string;
  priority: number;
  logos: any[];
}

interface OddsTeam {
  spreadOdds: number;
  underdog: boolean;
  team: {
    shortDisplayName: string;
    displayName: string;
    id: string;
    abbreviation: string;
  };
  favorite: boolean;
  moneyLine: number;
  favoriteAtOpen: boolean;
}

interface OddsLine {
  shortDisplayName: string;
  away: {
    close: { line: string; odds: string; link: TrackingLink };
    open: { line: string; odds: string };
  };
  displayName: string;
  home: {
    close: { line: string; odds: string; link: TrackingLink };
    open: { line: string; odds: string };
  };
}

interface TrackingLink {
  isExternal: boolean;
  shortText: string;
  rel: string[];
  language: string;
  href: string;
  text: string;
  isPremium: boolean;
  tracking: {
    campaign: string;
    tags: any;
  };
}

// --- NOW FEED SECTION ---
interface NowFeedItem {
  contentKey: string;
  images: Image[];
  dataSourceIdentifier: string;
  linkText: string;
  categorized: string;
  published: string;
  type: string;
  title: string;
  allowContentReactions: boolean;
  nowId: string;
  premium: boolean;
  isLiveBlog: boolean;
  links: {
    web: { href: string };
    mobile: { href: string };
    api: { self: {} };
  };
  id: number;
  lastModified: string;
  categories: Category[]; // Reuses main Category interface
  headline: string;
  byline: string;
  authors: Author[];
  story: string;
}

interface Author {
  sourceLine: string;
  images: Image[];
  twitterUserName: string;
  dataSourceIdentifier: string;
  displayName: string;
  guid: string;
  links: {
    web?: { href: string };
    api: { self: { href: string } };
  };
  biography: string;
  slug: string;
}

// --- META SECTION ---
interface Meta {
  imageWidth: number;
  image: string;
  twitter_card: string;
  og_site_name: string;
  twitter_app_id_iphone: string;
  description: string;
  og_type: string;
  twitter_app_name_googleplay: string;
  label: string;
  canonical: string;
  type: string;
  title: string;
  imageHeight: number;
  fb_app_id: string;
  twitter_site: string;
  root: string;
  twitter_app_id_googleplay: string;
  twitter_app_name_iphone: string;
}