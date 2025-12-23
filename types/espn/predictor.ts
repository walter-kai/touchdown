export interface PredictorStatistic {
  name: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  abbreviation: string;
  value: number;
  displayValue: string;
}

export interface PredictorTeam {
  team: {
    $ref: string;
  };
  statistics?: PredictorStatistic[];
}

export interface PredictorResponse {
  $ref: string;
  name: string;
  shortName: string;
  lastModified: string;
  homeTeam: PredictorTeam;
  awayTeam: PredictorTeam;
}

/**
 * Helper to safely get a statistic value from either team
 * NBA typically only has statistics in awayTeam, while NFL has both
 */
export const getPredictorStat = (
  team: PredictorTeam | undefined,
  statName: string
): PredictorStatistic | undefined => {
  return team?.statistics?.find((s) => s.name === statName);
};

/**
 * Get game projection (win probability) for a team
 */
export const getWinProbability = (team: PredictorTeam | undefined): number => {
  const stat = getPredictorStat(team, 'gameProjection');
  return stat?.value ?? 0;
};

/**
 * Get matchup quality (0-100 scale)
 */
export const getMatchupQuality = (team: PredictorTeam | undefined): number => {
  const stat = getPredictorStat(team, 'matchupQuality');
  return stat?.value ?? 0;
};

/**
 * Get predicted point differential
 */
export const getPointDifferential = (team: PredictorTeam | undefined): number => {
  const stat = getPredictorStat(team, 'teamPredPtDiff');
  return stat?.value ?? 0;
};
