// ESPN Scoreboard API Response Types
// Source: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard

export interface ScoreboardResponse {
  leagues: League[];
  season: Season;
  week: Week;
  events: Event[];
}

export interface League {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  slug: string;
  season: Season;
  logos: Logo[];
  calendarType: string;
  calendarIsWhitelist: boolean;
  calendarStartDate: string;
  calendarEndDate: string;
  calendar: CalendarEntry[];
}

export interface Logo {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  lastUpdated: string;
}

export interface Season {
  year: number;
  type: number;
  startDate?: string;
  endDate?: string;
  displayName?: string;
}

export interface Week {
  number: number;
  teamsOnBye?: TeamOnBye[];
}

export interface TeamOnBye {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  links: Link[];
  isActive: boolean;
}

export interface CalendarEntry {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
  entries: CalendarSubEntry[];
}

export interface CalendarSubEntry {
  label: string;
  alternateLabel: string;
  detail: string;
  value: string;
  startDate: string;
  endDate: string;
}

export interface Event {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
    slug: string;
  };
  week: {
    number: number;
  };
  competitions: Competition[];
  links: Link[];
  status: Status;
  weather?: Weather;
}

export interface Competition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  type: {
    id: string;
    abbreviation: string;
  };
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  playByPlayAvailable: boolean;
  recent: boolean;
  venue: Venue;
  competitors: Competitor[];
  notes: Note[];
  status: Status;
  broadcasts: Broadcast[];
  format: {
    regulation: {
      periods: number;
    };
  };
  startDate: string;
  geoBroadcasts: GeoBroadcast[];
  odds?: Odds[];
  situation?: Situation;
  leaders?: Leader[];
  headlines?: Headline[];
}

export interface Venue {
  id: string;
  fullName: string;
  address: {
    city: string;
    state?: string;
    country: string;
  };
  indoor: boolean;
}

export interface Competitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: string;
  winner?: boolean;
  team: Team;
  score: string;
  linescores?: Linescore[];
  statistics: any[];
  records?: Record[];
  leaders?: Leader[];
}

export interface Team {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  venue: {
    id: string;
  };
  links: Link[];
  logo: string;
}

export interface Linescore {
  value: number;
  displayValue: string;
}

export interface Record {
  name: string;
  abbreviation?: string;
  type: string;
  summary: string;
}

export interface Leader {
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  leaders: LeaderDetail[];
}

export interface LeaderDetail {
  displayValue: string;
  value: number;
  athlete: Athlete;
  team: {
    id: string;
  };
}

export interface Athlete {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  links: Link[];
  headshot: string;
  jersey: string;
  position: {
    abbreviation: string;
  };
  team: {
    id: string;
  };
  active: boolean;
}

export interface Status {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface Weather {
  displayValue: string;
  temperature: number;
  highTemperature: number;
  conditionId: string;
  link: Link;
}

export interface Broadcast {
  market: string;
  names: string[];
}

export interface GeoBroadcast {
  type: {
    id: string;
    shortName: string;
  };
  market: {
    id: string;
    type: string;
  };
  media: {
    shortName: string;
  };
  lang: string;
  region: string;
}

export interface Note {
  type: string;
  headline: string;
}

export interface Odds {
  provider: {
    id: string;
    name: string;
    priority: number;
  };
  details: string;
  overUnder: number;
  spread: number;
  overOdds?: number;
  underOdds?: number;
  awayTeamOdds: TeamOdds;
  homeTeamOdds: TeamOdds;
  links: Link[];
  moneyline?: OddsLine;
  pointSpread?: OddsLine;
  total?: OddsLine;
}

export interface TeamOdds {
  favorite: boolean;
  underdog: boolean;
  moneyLine: number;
  spreadOdds: number;
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
  };
}

export interface OddsLine {
  displayName: string;
  shortDisplayName: string;
  home?: {
    open?: {
      line: string;
      odds: string;
    };
    close?: {
      line: string;
      odds: string;
    };
  };
  away?: {
    open?: {
      line: string;
      odds: string;
    };
    close?: {
      line: string;
      odds: string;
    };
  };
}

export interface Situation {
  lastPlay?: LastPlay;
  down?: number;
  yardLine?: number;
  distance?: number;
  downDistanceText?: string;
  shortDownDistanceText?: string;
  possessionText?: string;
  isRedZone?: boolean;
  homeTimeouts?: number;
  awayTimeouts?: number;
  possession?: string;
}

export interface LastPlay {
  id: string;
  type: {
    id: string;
    text: string;
    abbreviation?: string;
  };
  text: string;
  scoreValue: number;
  team: {
    id: string;
  };
  probability?: {
    tiePercentage: number;
    homeWinPercentage: number;
    awayWinPercentage: number;
    secondsLeft: number;
  };
  drive?: {
    description: string;
    start: {
      yardLine: number;
      text: string;
    };
    timeElapsed: {
      displayValue: string;
    };
  };
  start?: {
    yardLine: number;
    team: {
      id: string;
    };
  };
  end?: {
    yardLine: number;
    team: {
      id: string;
    };
  };
  statYardage?: number;
  athletesInvolved?: AthleteInvolved[];
}

export interface AthleteInvolved {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  links: Link[];
  headshot: string;
  jersey: string;
  position: string;
  team: {
    id: string;
  };
}

export interface Headline {
  description: string;
  type: string;
  shortLinkText: string;
  video?: any[];
}

export interface Link {
  language?: string;
  rel: string[];
  href: string;
  text: string;
  shortText?: string;
  isExternal: boolean;
  isPremium: boolean;
}

