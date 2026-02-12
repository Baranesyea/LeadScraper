export interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  emailsSentThisWeek: number;
  emailsSentTotal: number;
  openRate: number;
  replyRate: number;
  pipelineStages: PipelineStage[];
}

export interface PipelineStage {
  name: string;
  count: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: "lead_added" | "email_sent" | "email_opened" | "email_replied" | "company_enriched";
  description: string;
  timestamp: string;
  contactName?: string;
  companyName?: string;
}
