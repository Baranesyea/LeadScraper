export interface EmailDraft {
  id: string;
  contactId: string;
  contactName: string;
  companyName: string;
  subject: string;
  body: string;
  status: "draft" | "scheduled" | "sent" | "opened" | "replied";
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  sequenceId: string | null;
  sequenceStep: number | null;
  createdAt: string;
}

export interface SequenceStep {
  id: string;
  order: number;
  delayDays: number;
  subject: string;
  body: string;
  type: "initial" | "follow-up" | "breakup";
}

export interface EmailSequence {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  steps: SequenceStep[];
  enrolledContactIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type MergeVariable =
  | "firstName"
  | "lastName"
  | "fullName"
  | "companyName"
  | "title"
  | "industry"
  | "newsHeadline";
