// =============================================================================
// Email Address Discovery & Generation
// =============================================================================
// Finds and generates possible email addresses for contacts. Uses common
// corporate email patterns combined with web search to discover real emails.
//
// Strategy:
// 1. Generate possible email patterns from name + domain
// 2. Search the web for the person's email
// 3. (Future) Verify emails using an email verification service
//
// Future enhancements - plug in paid email discovery APIs:
//   - Hunter.io (https://hunter.io) - find and verify emails by domain
//   - ZeroBounce (https://zerobounce.net) - email verification
//   - NeverBounce (https://neverbounce.com) - email verification
//   - Clearbit (https://clearbit.com) - email enrichment
//   - Voila Norbert (https://www.voilanorbert.com) - email finder
//   - Snov.io (https://snov.io) - email finder + verifier
// =============================================================================

import { search, sleep } from "./search";
import { extractEmails } from "./website-parser";
import type { ScrapeOptions } from "./types";
import { DEFAULT_SCRAPE_OPTIONS } from "./types";

// =============================================================================
// Email Pattern Generation
// =============================================================================

/**
 * Generate possible email address patterns from a person's name and company domain.
 *
 * Corporate email addresses follow common patterns. This function generates
 * the most common ones, ordered by likelihood (based on industry research,
 * the most common pattern is first.last@domain).
 *
 * @param firstName - Person's first name
 * @param lastName - Person's last name
 * @param domain - Company's email domain (e.g., "acme.com")
 * @returns Array of possible email addresses, most likely first
 *
 * @example
 * guessEmails("John", "Doe", "acme.com")
 * // Returns:
 * // [
 * //   "john@acme.com",
 * //   "john.doe@acme.com",
 * //   "jdoe@acme.com",
 * //   "johnd@acme.com",
 * //   "john_doe@acme.com",
 * //   "john-doe@acme.com",
 * //   "doe.john@acme.com",
 * //   "j.doe@acme.com",
 * // ]
 */
export function guessEmails(
  firstName: string,
  lastName: string,
  domain: string
): string[] {
  // Normalize inputs: lowercase, trim, remove special characters
  const first = firstName.toLowerCase().trim().replace(/[^a-z]/g, "");
  const last = lastName.toLowerCase().trim().replace(/[^a-z]/g, "");

  if (!first || !last || !domain) {
    return [];
  }

  // Clean domain (remove protocol, www, trailing slash)
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .toLowerCase()
    .trim();

  if (!cleanDomain || !cleanDomain.includes(".")) {
    return [];
  }

  const firstInitial = first[0];
  const lastInitial = last[0];

  // Generate patterns ordered by most common usage in corporate environments
  const patterns = [
    `${first}@${cleanDomain}`,              // john@acme.com
    `${first}.${last}@${cleanDomain}`,       // john.doe@acme.com
    `${firstInitial}${last}@${cleanDomain}`, // jdoe@acme.com
    `${first}${lastInitial}@${cleanDomain}`, // johnd@acme.com
    `${first}_${last}@${cleanDomain}`,       // john_doe@acme.com
    `${first}-${last}@${cleanDomain}`,       // john-doe@acme.com
    `${last}.${first}@${cleanDomain}`,       // doe.john@acme.com
    `${firstInitial}.${last}@${cleanDomain}`, // j.doe@acme.com
    `${first}${last}@${cleanDomain}`,        // johndoe@acme.com
    `${last}@${cleanDomain}`,                // doe@acme.com
    `${last}${firstInitial}@${cleanDomain}`, // doej@acme.com
    `${firstInitial}${lastInitial}@${cleanDomain}`, // jd@acme.com
  ];

  return patterns;
}

// =============================================================================
// Email Verification (Placeholder)
// =============================================================================

/**
 * Verify whether an email address is valid and deliverable.
 *
 * CURRENT IMPLEMENTATION: Returns true for all emails (placeholder).
 *
 * FUTURE IMPLEMENTATION: Integrate with an email verification service to:
 * 1. Check MX records for the domain
 * 2. Verify the mailbox exists via SMTP handshake
 * 3. Check for disposable/temporary email domains
 * 4. Detect catch-all domains
 *
 * Recommended services to integrate:
 * - ZeroBounce API: POST https://api.zerobounce.net/v2/validate
 *   Returns: status (valid, invalid, catch-all, unknown), sub_status, etc.
 *
 * - NeverBounce API: POST https://api.neverbounce.com/v4/single/check
 *   Returns: result (valid, invalid, disposable, catchall, unknown)
 *
 * - Hunter.io Verify: GET https://api.hunter.io/v2/email-verifier?email=...
 *   Returns: data.status (valid, invalid, accept_all, webmail, disposable, unknown)
 *
 * @param _email - The email address to verify
 * @returns true if the email is valid (always true in placeholder implementation)
 */
export async function verifyEmail(_email: string): Promise<boolean> {
  // TODO: Integrate with ZeroBounce, NeverBounce, or Hunter.io for real verification
  //
  // Example integration with Hunter.io:
  // const apiKey = process.env.HUNTER_API_KEY;
  // if (apiKey) {
  //   const response = await fetch(
  //     `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`
  //   );
  //   const data = await response.json();
  //   return data.data?.status === "valid" || data.data?.status === "accept_all";
  // }
  //
  // Example integration with ZeroBounce:
  // const apiKey = process.env.ZEROBOUNCE_API_KEY;
  // if (apiKey) {
  //   const response = await fetch(
  //     `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${email}`
  //   );
  //   const data = await response.json();
  //   return data.status === "valid";
  // }

  return true;
}

// =============================================================================
// Web-Based Email Discovery
// =============================================================================

/**
 * Search the web to find a person's email address.
 *
 * Searches for the person's name + company + "email" across the web, then
 * extracts any email addresses found in the search results or snippets.
 *
 * This is a best-effort approach - it may not find the exact email but can
 * sometimes discover it from:
 * - Conference speaker pages
 * - GitHub profiles
 * - Blog posts or articles
 * - Company team pages
 * - Press releases
 * - Social media bios
 *
 * @param fullName - The person's full name (e.g., "John Doe")
 * @param companyName - The company they work for (e.g., "Acme Corp")
 * @param options - Scrape options
 * @returns Found email address or null
 */
export async function findEmailFromWeb(
  fullName: string,
  companyName: string,
  options?: Partial<ScrapeOptions>
): Promise<string | null> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };

  try {
    console.log(
      `[EmailFinder] Searching web for email: ${fullName} at ${companyName}`
    );

    // Search for the person's email using different query patterns
    const queries = [
      `"${fullName}" "${companyName}" email`,
      `"${fullName}" "${companyName}" contact`,
      `"${fullName}" "@" "${companyName}"`,
    ];

    for (const query of queries) {
      const results = await search(query, {
        maxResults: 5,
        timeout: opts.timeout,
        searchProvider: opts.searchProvider,
      });

      // Check search result snippets for email addresses
      for (const result of results) {
        const combinedText = `${result.title} ${result.snippet}`;
        const emails = extractEmails(combinedText);

        if (emails.length > 0) {
          // Prefer emails that seem to match the person (contain their name parts)
          const nameParts = fullName.toLowerCase().split(/\s+/);
          const matchingEmail = emails.find((email) => {
            const localPart = email.split("@")[0];
            return nameParts.some(
              (part) => part.length > 2 && localPart.includes(part)
            );
          });

          if (matchingEmail) {
            console.log(
              `[EmailFinder] Found matching email in search results: ${matchingEmail}`
            );
            return matchingEmail;
          }

          // If no name-matching email, return the first non-generic one
          const nonGenericEmail = emails.find((email) => {
            const prefix = email.split("@")[0];
            const genericPrefixes = [
              "info",
              "contact",
              "hello",
              "support",
              "sales",
              "team",
              "press",
              "media",
              "careers",
              "jobs",
              "hr",
            ];
            return !genericPrefixes.includes(prefix);
          });

          if (nonGenericEmail) {
            console.log(
              `[EmailFinder] Found potential email in search results: ${nonGenericEmail}`
            );
            return nonGenericEmail;
          }
        }
      }

      // Delay between search queries to avoid rate limiting
      await sleep(opts.delayBetweenRequests);
    }

    console.log(
      `[EmailFinder] No email found for ${fullName} at ${companyName}`
    );
    return null;
  } catch (error) {
    console.log(
      `[EmailFinder] Error finding email for ${fullName}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// =============================================================================
// Best Email Selection
// =============================================================================

/**
 * Given a list of guessed emails and optionally a web-discovered email,
 * return the best email to use.
 *
 * Priority:
 * 1. Web-discovered email (if found, it's most likely real)
 * 2. First guessed pattern (first.last@domain - most common in corporate)
 *
 * When email verification is implemented, this function should verify
 * each candidate and return the first verified one.
 *
 * @param guessedEmails - Array of guessed email patterns
 * @param webEmail - Email found via web search (or null)
 * @returns The best email candidate, or null if no candidates
 */
export async function selectBestEmail(
  guessedEmails: string[],
  webEmail: string | null
): Promise<string | null> {
  // If we found an email on the web, prefer it
  if (webEmail) {
    const isValid = await verifyEmail(webEmail);
    if (isValid) return webEmail;
  }

  // Otherwise, use the most common pattern (first.last@domain is index 1)
  // When verification is implemented, loop through all and return first valid
  if (guessedEmails.length >= 2) {
    // first.last@domain pattern (most common in corporate environments)
    return guessedEmails[1];
  }

  if (guessedEmails.length > 0) {
    return guessedEmails[0];
  }

  return null;
}
