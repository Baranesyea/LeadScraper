export interface ContactArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  snippet: string;
}

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
}
