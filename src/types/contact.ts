export interface ContactArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  snippet: string;
}

export type EmailStatus = "unverified" | "verified" | "risky" | "invalid" | "email_missing";
export type LeadTier = "hot" | "warm" | "cold";
export type ContactStatus = "new" | "contacted" | "replied" | "converted" | "opted_out";

export interface Contact {
  id: string;
  companyId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  department: string;
  photoUrl: string | null;
  workEmail: string | null;
  personalEmail: string | null;
  workPhone: string | null;
  personalPhone: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  articles: ContactArticle[];
  enrichedAt: string | null;
  createdAt: string;
  // Validation
  emailStatus: EmailStatus;
  emailConfidence: number;
  emailSource: string;
  validatedAt: string | null;
  // Lead scoring
  leadScore: number;
  leadTier: LeadTier;
  icpFitScore: number;
  timingScore: number;
  dataQualityScore: number;
  scoredAt: string | null;
  // Pipeline
  contactStatus: ContactStatus;
  suppressedAt: string | null;
  suppressReason: string | null;
  lastContactedAt: string | null;
}

export interface ValidationLog {
  id: string;
  contactId: string;
  email: string;
  syntaxValid: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  dnsValid: boolean;
  mxExists: boolean;
  isCatchAll: boolean;
  smtpValid: boolean | null;
  smtpResponse: string | null;
  provider1Name: string | null;
  provider1Result: string | null;
  provider2Name: string | null;
  provider2Result: string | null;
  confidence: number;
  status: string;
  createdAt: string;
}

export interface EnrichmentData {
  id: string;
  contactId: string;
  // Google Business
  googleRating: number | null;
  googleReviewCount: number | null;
  recentReviews: Array<{ text: string; rating: number; date: string }>;
  reviewSentiment: string | null;
  hoursUpdated: boolean | null;
  hasPhotos: boolean | null;
  googleCategory: string | null;
  googleLocation: string | null;
  // Website
  hasWebsite: boolean;
  crmDetected: string | null;
  crmName: string | null;
  websiteQuality: number | null;
  hasSsl: boolean;
  hasIdx: boolean;
  siteAge: string | null;
  techStack: string[];
  // Social
  fbPageUrl: string | null;
  fbFollowers: number | null;
  fbPostFrequency: string | null;
  igFollowers: number | null;
  igPostFrequency: string | null;
  ytHasChannel: boolean;
  ytVideoCount: number | null;
  linkedinHeadline: string | null;
  linkedinConnections: number | null;
  // Signals & Hooks
  signals: Array<{ type: string; description: string; severity: string; source: string }>;
  hooks: Array<{ text: string; signal: string; sourceUrl: string }>;
  leadPriority: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStats {
  total: number;
  unverified: number;
  verified: number;
  risky: number;
  invalid: number;
  emailMissing: number;
  enriched: number;
  hot: number;
  warm: number;
  cold: number;
  validationPassRate: number;
  avgConfidence: number;
}
