export type FundingStage =
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b"
  | "series-c"
  | "series-d-plus"
  | "public"
  | "bootstrapped";

export interface CompanyNews {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  snippet: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  employeeCount: number;
  employeeRange: string;
  location: string;
  country: string;
  website: string;
  logoUrl: string | null;
  fundingStage: FundingStage;
  fundingAmount: number | null;
  lastFundingDate: string | null;
  technologies: string[];
  news: CompanyNews[];
  contactIds: string[];
  enrichedAt: string | null;
  matchedIcpId: string | null;
  createdAt: string;
}
