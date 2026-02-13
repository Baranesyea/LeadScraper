// ============================================================================
// Lead Scoring Engine
// 3 scoring dimensions: ICP Fit (0-40), Timing (0-30), Data Quality (0-30)
// Total score: 0-100, Tiers: hot (70-100), warm (40-69), cold (0-39)
// ============================================================================

interface ScoreInput {
  // ICP Fit inputs
  crmDetected: string | null; // none, basic, full
  googleReviewCount: number | null;
  hasWebsite: boolean;
  websiteQuality: number | null;
  isIndependent: boolean; // small brokerage
  isUSMarket: boolean;
  // Timing inputs
  hasNegativeReview: boolean;
  ratingDropped: boolean;
  isNewAgent: boolean; // < 1 year
  changedBrokerage: boolean;
  websiteBroken: boolean;
  isHighSeason: boolean;
  // Data Quality inputs
  emailConfidence: number; // 0-100
  enrichmentDone: boolean;
  dataSourceCount: number;
  hasPhone: boolean;
  hasSocialProfiles: boolean;
}

interface ScoreResult {
  icpFitScore: number; // 0-40
  timingScore: number; // 0-30
  dataQualityScore: number; // 0-30
  totalScore: number; // 0-100
  tier: "hot" | "warm" | "cold";
}

// ---------------------------------------------------------------------------
// ICP Fit Score (0-40)
// ---------------------------------------------------------------------------

function calculateIcpFitScore(input: ScoreInput): number {
  let score = 0;

  // No CRM: +15
  if (input.crmDetected === "none" || input.crmDetected === null) {
    score += 15;
  }

  // 50+ Google reviews: +10
  if (input.googleReviewCount !== null && input.googleReviewCount >= 50) {
    score += 10;
  }

  // Has website but no CRM: +5
  if (
    input.hasWebsite &&
    (input.crmDetected === "none" || input.crmDetected === null)
  ) {
    score += 5;
  }

  // No website: +8
  if (!input.hasWebsite) {
    score += 8;
  }

  // Independent / small brokerage: +5
  if (input.isIndependent) {
    score += 5;
  }

  // US market: +5
  if (input.isUSMarket) {
    score += 5;
  }

  // Cap at 40
  return Math.min(40, score);
}

// ---------------------------------------------------------------------------
// Timing Score (0-30)
// ---------------------------------------------------------------------------

function calculateTimingScore(input: ScoreInput): number {
  let score = 0;

  // Negative review: +15
  if (input.hasNegativeReview) {
    score += 15;
  }

  // Rating dropped: +10
  if (input.ratingDropped) {
    score += 10;
  }

  // New agent (< 1 year): +8
  if (input.isNewAgent) {
    score += 8;
  }

  // Changed brokerage: +7
  if (input.changedBrokerage) {
    score += 7;
  }

  // Website broken: +10
  if (input.websiteBroken) {
    score += 10;
  }

  // High season: +5
  if (input.isHighSeason) {
    score += 5;
  }

  // Cap at 30
  return Math.min(30, score);
}

// ---------------------------------------------------------------------------
// Data Quality Score (0-30)
// ---------------------------------------------------------------------------

function calculateDataQualityScore(input: ScoreInput): number {
  let score = 0;

  // Email verified (confidence 90-100): +15
  if (input.emailConfidence >= 90) {
    score += 15;
  }
  // Email risky (confidence 70-89): +5
  else if (input.emailConfidence >= 70) {
    score += 5;
  }

  // Full enrichment completed: +8
  if (input.enrichmentDone) {
    score += 8;
  }

  // 3+ data sources: +5
  if (input.dataSourceCount >= 3) {
    score += 5;
  }

  // Has phone number: +3
  if (input.hasPhone) {
    score += 3;
  }

  // Has social profiles: +2
  if (input.hasSocialProfiles) {
    score += 2;
  }

  // Cap at 30
  return Math.min(30, score);
}

// ---------------------------------------------------------------------------
// Tier Determination
// ---------------------------------------------------------------------------

function determineTier(totalScore: number): "hot" | "warm" | "cold" {
  if (totalScore >= 70) {
    return "hot";
  }
  if (totalScore >= 40) {
    return "warm";
  }
  return "cold";
}

// ---------------------------------------------------------------------------
// Main Scoring Function
// ---------------------------------------------------------------------------

function calculateLeadScore(input: ScoreInput): ScoreResult {
  const icpFitScore = calculateIcpFitScore(input);
  const timingScore = calculateTimingScore(input);
  const dataQualityScore = calculateDataQualityScore(input);

  const totalScore = icpFitScore + timingScore + dataQualityScore;
  const tier = determineTier(totalScore);

  return {
    icpFitScore,
    timingScore,
    dataQualityScore,
    totalScore,
    tier,
  };
}

export { calculateLeadScore, type ScoreInput, type ScoreResult };
