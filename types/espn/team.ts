// ESPN Team API Response Types
import type { Link } from './game';
import type { Athlete } from './athlete';
import type { Leader } from './scoreboard';

export interface TeamLogo {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  lastUpdated?: string;
}

// Use Link from game.ts for consistency
export type TeamLink = Link;

export interface RecordStat {
  name: string;
  value: number;
}

export interface TeamRecord {
  type: string;
  summary: string;
  displayValue?: string;
  description?: string;
  stats?: RecordStat[];
}

export interface TeamRecords {
  items: TeamRecord[];
}

export interface TeamGroup {
  id: string;
  parent?: {
    id: string;
  };
  isConference: boolean;
}

export interface VenueAddress {
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
}

export interface VenueImage {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
}

export interface Venue {
  $ref?: string;
  id: string;
  guid?: string;
  fullName: string;
  address: VenueAddress;
  grass: boolean;
  indoor: boolean;
  images?: VenueImage[];
}

export interface Franchise {
  $ref: string;
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
  isActive: boolean;
  venue: Venue;
  team: {
    $ref: string;
  };
}

// Re-export shared types for backward compatibility
export type { Athlete } from './athlete';
export type { Leader } from './scoreboard';

export interface CompetitorScore {
  value: number;
  displayValue: string;
}

export interface CompetitorRecord {
  id: string;
  abbreviation?: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  type: string;
  displayValue: string;
}

export interface CompetitorTeam {
  id: string;
  location: string;
  nickname: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logos: TeamLogo[];
  links: TeamLink[];
}

export interface Competitor {
  id: string;
  type: string;
  order: number;
  homeAway: string;
  winner: boolean;
  team: CompetitorTeam;
  score?: CompetitorScore;
  leaders?: Leader[];
  record?: CompetitorRecord[];
}

export interface CompetitionStatusType {
  id: string;
  name: string;
  state: string;
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface CompetitionStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: CompetitionStatusType;
  isTBDFlex: boolean;
}

export interface Broadcast {
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
  partnered: boolean;
}

export interface Competition {
  id: string;
  date: string;
  attendance?: number;
  type: {
    id: string;
    text: string;
    abbreviation: string;
    slug: string;
    type: string;
  };
  timeValid: boolean;
  neutralSite: boolean;
  boxscoreAvailable: boolean;
  ticketsAvailable: boolean;
  venue: {
    fullName: string;
    address: VenueAddress;
  };
  competitors: Competitor[];
  notes?: any[];
  broadcasts?: Broadcast[];
  status: CompetitionStatus;
}

export interface NextEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    displayName: string;
  };
  seasonType: {
    id: string;
    type: number;
    name: string;
    abbreviation: string;
  };
  week: {
    number: number;
    text: string;
  };
  timeValid: boolean;
  competitions: Competition[];
  links: TeamLink[];
}

export interface Team {
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
  isActive: boolean;
  logos: TeamLogo[];
  record: TeamRecords;
  groups: TeamGroup;
  links: TeamLink[];
  franchise: Franchise;
  nextEvent?: NextEvent[];
  standingSummary?: string;
}

export interface TeamApiResponse {
  team: Team;
}
