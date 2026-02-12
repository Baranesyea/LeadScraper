import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A Contact record with its related Company eagerly loaded.
 * Matches the shape returned by `db.contact.findUnique({ include: { company: true } })`.
 */
export interface ContactWithCompany {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  department: string;
  workEmail: string | null;
  personalEmail: string | null;
  company: {
    id: string;
    name: string;
    industry: string;
    description: string;
    website: string;
    location: string;
    employeeCount: number;
    employeeRange: string;
  };
}

// ---------------------------------------------------------------------------
// Core replacement
// ---------------------------------------------------------------------------

/** Regex that matches `{variableName}` tokens. */
const VARIABLE_PATTERN = /\{(\w+)\}/g;

/**
 * Replace all `{variableName}` merge variables in a template string with
 * values derived from a contact and their company.
 *
 * Supported variables:
 *   {firstName}    - contact.firstName
 *   {lastName}     - contact.lastName
 *   {fullName}     - contact.fullName
 *   {companyName}  - contact.company.name
 *   {title}        - contact.title
 *   {industry}     - contact.company.industry
 *   {newsHeadline} - the most recent CompanyNews title (fetched from DB)
 *
 * Unknown variables are left as-is so templates can safely contain other
 * brace-delimited tokens.
 *
 * @param template - The raw template string (subject or body).
 * @param contact  - A Contact with its Company relation loaded.
 * @param newsHeadline - Optionally pre-fetched latest news headline.
 *                       If omitted the function will fetch it from the DB.
 * @returns The template with merge variables replaced.
 */
export async function replaceMergeVariables(
  template: string,
  contact: ContactWithCompany,
  newsHeadline?: string,
): Promise<string> {
  // Lazily resolve the latest company news headline if not provided.
  const resolvedHeadline =
    newsHeadline ?? (await fetchLatestNewsHeadline(contact.company.id));

  const variableMap: Record<string, string> = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    fullName: contact.fullName,
    companyName: contact.company.name,
    title: contact.title || "there",
    industry: contact.company.industry || "your industry",
    newsHeadline: resolvedHeadline || "your recent updates",
  };

  return template.replace(VARIABLE_PATTERN, (match, key: string) => {
    return key in variableMap ? variableMap[key] : match;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the most recent CompanyNews headline for a given company.
 * Returns the title string, or `null` if no news exists.
 */
async function fetchLatestNewsHeadline(
  companyId: string,
): Promise<string | null> {
  try {
    const latestNews = await db.companyNews.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { title: true },
    });
    return latestNews?.title ?? null;
  } catch (error) {
    console.error("[merge-variables] Failed to fetch news headline:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Extract all unique variable names from a template string.
 *
 * @example
 *   extractVariables("Hi {firstName}, I saw {companyName} in the news")
 *   // => ["firstName", "companyName"]
 */
export function extractVariables(template: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  // Reset regex state.
  const re = new RegExp(VARIABLE_PATTERN.source, "g");
  while ((match = re.exec(template)) !== null) {
    matches.add(match[1]);
  }

  return Array.from(matches);
}

/**
 * Preview an email by loading a contact from the database and replacing all
 * merge variables in the given template.
 *
 * Useful for the email composer UI to show a live preview.
 *
 * @param template  - The raw template string (subject or body).
 * @param contactId - The ID of the contact to preview for.
 * @returns The fully-resolved template string, or `null` if the contact was
 *          not found.
 */
export async function previewEmail(
  template: string,
  contactId: string,
): Promise<string | null> {
  try {
    const contact = await db.contact.findUnique({
      where: { id: contactId },
      include: { company: true },
    });

    if (!contact) {
      console.warn(`[merge-variables] Contact not found: ${contactId}`);
      return null;
    }

    return replaceMergeVariables(template, contact);
  } catch (error) {
    console.error("[merge-variables] previewEmail error:", error);
    return null;
  }
}
