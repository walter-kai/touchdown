// ESPN Game Summary Types

import type { Athlete } from './athlete';

export interface Summary {
  boxscore: Boxscore;
  format: Format;
  gameInfo: GameInfo;
  drives: Drives;
  leaders: Leader[];
  injuries: Injury[];
  broadcasts: Broadcast[];
  pickcenter: PickCenter[];
  againstTheSpread: AgainstTheSpread[];
  odds: Odds[];
  header: Header;
  scoringPlays: ScoringPlay[];
  news: News;
  winprobability: WinProbability[];
  article: Article;
  videos: Video[];
  meta: Meta;
  standings: Standings;
}

export interface Boxscore {
  teams: BoxscoreTeam[];
  players: BoxscorePlayers[];
}

export interface BoxscoreTeam {
  team: Team;
  statistics: Statistic[];
  displayOrder: number;
  homeAway: 'home' | 'away';
}

export interface TeamLogo {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  lastUpdated?: string;
}

export interface Team {
  id: string;
  uid: string;
  guid?: string;
  slug: string;
  location: string;
  name: string;
  nickname?: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  logos: TeamLogo[];
}

export interface Statistic {
  name: string;
  displayValue: string;
  value: number | string;
  label: string;
}

export interface BoxscorePlayers {
  team: Team;
  statistics: PlayerStatisticCategory[];
}

export interface PlayerStatisticCategory {
  name: string;
  keys: string[];
  text: string;
  labels: string[];
  descriptions: string[];
  athletes: AthleteStats[];
  totals: string[];
}

export interface AthleteStats {
  athlete: Athlete;
  stats: string[];
}

export interface Link {
  rel: string[];
  href: string;
  text: string;
}

export interface Headshot {
  href: string;
  alt: string;
}

export interface Format {
  regulation: Regulation;
}

export interface Regulation {
  periods: number;
}

export interface GameInfo {
  venue: Venue;
  attendance: number;
  officials: Official[];
  weather?: Weather;
}

export interface Venue {
  id: string;
  fullName: string;
  address: Address;
  capacity: number;
  grass: boolean;
  indoor: boolean;
  images: Image[];
}

export interface Address {
  city: string;
  state: string;
  zipCode: string;
}

export interface Image {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
}

export interface Official {
  fullName: string;
  displayName: string;
  position: Position;
  order: number;
}

export interface Position {
  name: string;
  displayName: string;
  id: string;
}

export interface Weather {
  displayValue: string;
  temperature: number;
  highTemperature: number;
  conditionId: string;
  link: Link;
}

export interface Drives {
  previous: Drive[];
  current: Drive;
}

export interface Drive {
  id: string;
  description: string;
  team: Team;
  start: DrivePoint;
  end?: DrivePoint;
  timeElapsed: TimeElapsed;
  yards: number;
  isScore: boolean;
  offensivePlays: number;
  result: string;
  shortDisplayResult: string;
  displayResult: string;
  plays: Play[];
}

export interface DrivePoint {
  period: Period;
  clock: Clock;
  yardLine: number;
  text: string;
}

export interface Period {
  number: number;
  type: string;
}

export interface Clock {
  displayValue: string;
  value: number;
}

export interface TimeElapsed {
  displayValue: string;
  value: number;
}

export interface Play {
  id: string;
  sequenceNumber: string;
  type: PlayType;
  text: string;
  awayScore: number;
  homeScore: number;
  period: Period;
  clock: Clock;
  scoringPlay: boolean;
  priority: boolean;
  modified: string;
  wallclock: string;
  start: PlayPoint;
  end: PlayPoint;
  statYardage: number;
  athletesInvolved?: AthleteInPlay[];
  scoringType?: ScoringType;
}

export interface PlayType {
  id: string;
  text: string;
  abbreviation: string;
}

export interface PlayPoint {
  down: number;
  distance: number;
  yardLine: number;
  yardsToEndzone: number;
  team: Team;
  downDistanceText: string;
  shortDownDistanceText: string;
  possessionText: string;
}

export interface AthleteInPlay {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  links: Link[];
  headshot: string;
  jersey: string;
  position: string;
  team: Team;
}

export interface ScoringType {
  name: string;
  displayName: string;
  abbreviation: string;
}

export interface Leader {
  team: Team;
  leaders: LeaderCategory[];
}

export interface LeaderCategory {
  name: string;
  displayName: string;
  leaders: TeamLeader[];
}

export interface TeamLeader {
  displayValue: string;
  athlete: Athlete;
  team?: {
    $ref: string;
  };
  mainStat?: {
    value: string;
    label: string;
  };
  summary?: string;
}

export interface Injury {
  team: Team;
  injuries: PlayerInjury[];
}

export interface PlayerInjury {
  status: string;
  date: string;
  athlete: Athlete;
  details: InjuryDetails;
}

export interface InjuryDetails {
  type: string;
  location: string;
  detail: string;
  side: string;
}

export interface Broadcast {
  type: BroadcastType;
  market: Market;
  media: Media;
  lang: string;
  region: string;
}

export interface BroadcastType {
  id: string;
  shortName: string;
}

export interface Market {
  id: string;
  type: string;
}

export interface Media {
  shortName: string;
}

export interface PickCenter {
  provider: Provider;
  details: string;
  overUnder: number;
  spread: number;
  overOdds: number;
  underOdds: number;
  awayTeamOdds: TeamOdds;
  homeTeamOdds: TeamOdds;
  links: Link[];
}

export interface Provider {
  id: string;
  name: string;
  priority: number;
}

export interface TeamOdds {
  favorite: boolean;
  underdog: boolean;
  moneyLine: number;
  spreadOdds: number;
  team: Team;
}

export interface AgainstTheSpread {
  team: Team;
  records: Record[];
}

export interface Record {
  name: string;
  type: string;
  summary: string;
  displayValue: string;
}

export interface Odds {
  provider: Provider;
  details: string;
  overUnder: number;
  spread: number;
  awayTeamOdds: TeamOdds;
  homeTeamOdds: TeamOdds;
}

export interface Header {
  id: string;
  uid: string;
  season: Season;
  timeValid: boolean;
  competitions: Competition[];
  links: Link[];
  week: Week;
}

export interface Season {
  year: number;
  type: number;
  slug: string;
}

export interface Competition {
  id: string;
  uid: string;
  date: string;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  playByPlayAvailable: boolean;
  recent: boolean;
  boxscoreAvailable: boolean;
  commentaryAvailable: boolean;
  liveAvailable: boolean;
  onWatchESPN: boolean;
  competitors: Competitor[];
  status: Status;
  broadcasts: Broadcast[];
}

export interface Competitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: 'home' | 'away';
  winner: boolean;
  team: Team;
  score: string;
  linescores: LineScore[];
  records: Record[];
  leaders: Leader[];
}

export interface LineScore {
  value: number;
  displayValue: string;
}

export interface Status {
  clock: number;
  displayClock: string;
  period: number;
  type: StatusType;
}

export interface StatusType {
  id: string;
  name: string;
  state: string;
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

export interface Week {
  number: number;
}

export interface ScoringPlay {
  id: string;
  type: PlayType;
  text: string;
  awayScore: number;
  homeScore: number;
  period: Period;
  clock: Clock;
  scoringPlay: boolean;
  scoreValue: number;
  team: Team;
  participants?: Participant[];
  wallclock: string;
}

export interface Participant {
  athlete: Athlete;
  type: string;
}

export interface News {
  header: string;
  link: Link;
  articles: NewsArticle[];
}

export interface NewsArticle {
  images: NewsImage[];
  description: string;
  published: string;
  type: string;
  premium: boolean;
  links: NewsLinks;
  lastModified: string;
  categories: Category[];
  headline: string;
}

export interface NewsImage {
  name: string;
  width: number;
  alt: string;
  caption: string;
  url: string;
  height: number;
  type: string;
  id: number;
  credit: string;
  dataSourceIdentifier: string;
}

export interface NewsLinks {
  api: ApiLink;
  web: WebLink;
  mobile: MobileLink;
}

export interface ApiLink {
  self: Link;
}

export interface WebLink {
  href: string;
  short: Link;
  self: Link;
}

export interface MobileLink {
  href: string;
}

export interface Category {
  id: number;
  description: string;
  type: string;
  sportId: number;
  leagueId: number;
  league: CategoryLeague;
  uid: string;
  createDate: string;
  teamId?: number;
  team?: CategoryTeam;
  athleteId?: number;
  athlete?: CategoryAthlete;
}

export interface CategoryLeague {
  id: number;
  description: string;
  links: CategoryLinks;
}

export interface CategoryLinks {
  api: ApiLink;
  web: WebLink;
  mobile: MobileLink;
}

export interface CategoryTeam {
  id: number;
  description: string;
  links: CategoryLinks;
}

export interface CategoryAthlete {
  id: number;
  description: string;
  links: CategoryLinks;
}

export interface WinProbability {
  tiePercentage: number;
  homeWinPercentage: number;
  playId: string;
  sequenceNumber: string;
}

export interface Article {
  images: NewsImage[];
  description: string;
  published: string;
  type: string;
  premium: boolean;
  links: NewsLinks;
  lastModified: string;
  categories: Category[];
  headline: string;
  byline?: string;
  story?: string;
}

export interface Video {
  id: number;
  source: string;
  headline: string;
  caption: string;
  description: string;
  premium: boolean;
  links: VideoLinks;
  thumbnail: string;
  duration: number;
  tracking: Tracking;
  deviceRestrictions: DeviceRestrictions;
  geoRestrictions: GeoRestrictions;
}

export interface VideoLinks {
  api: ApiLink;
  web: WebLink;
  source: SourceLink;
  mobile: MobileLink;
}

export interface SourceLink {
  mezzanine: Link;
  flash: Link;
  hds: Link;
  HLS: HLSLink;
  HD: Link;
  full: Link;
  href: string;
}

export interface HLSLink {
  href: string;
  HD: Link;
}

export interface Tracking {
  sportName: string;
  leagueName: string;
  coverageType: string;
  trackingName: string;
  trackingId: string;
}

export interface DeviceRestrictions {
  type: string;
  devices: string[];
}

export interface GeoRestrictions {
  type: string;
  countries: string[];
}

export interface Meta {
  social: Social;
}

export interface Social {
  title: string;
  description: string;
  image: string;
}

export interface Standings {
  fullViewLink: Link;
  groups: StandingsGroup[];
  isSameConference: boolean;
}

export interface StandingsGroup {
  standings: TeamStanding;
  header: string;
  href: string;
  conferenceHeader: string;
  divisionHeader: string;
}

export interface TeamStanding {
  entries: StandingEntry[];
}

export interface StandingEntry {
  team: string;
  link: string;
  id: string;
  uid: string;
  stats: StandingStat[];
  logo: Image[];
}

export interface StandingStat {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  summary: string;
  displayValue: string;
}
