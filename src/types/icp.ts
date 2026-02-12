import type { FundingStage } from "./company";

export interface ICP {
  id: string;
  name: string;
  industries: string[];
  companySizeMin: number | null;
  companySizeMax: number | null;
  locations: string[];
  technologies: string[];
  fundingStages: FundingStage[];
  revenueMin: number | null;
  revenueMax: number | null;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}
