// =============================================================================
// Contact Finding Logic
// =============================================================================
// Discovers key contacts (executives, leadership) for a company by searching
// the web for team pages, LinkedIn profiles, and press mentions.
//
// Pipeline:
// 1. Get company name and website from the database
// 2. Search for "company name leadership team" / "company name CTO" etc.
// 3. Parse results to extract names and titles
// 4. Try to construct emails from name + company domain
// 5. Search for LinkedIn profiles
// 6. Save contacts to the database (up to maxContactsPerCompany)
//
// Future enhancements - plug in paid contact databases:
//   - Apollo.io API - comprehensive contact database with emails
//   - ZoomInfo API - B2B contact intelligence
//   - Lusha API - direct contact data
//   - RocketReach API - email/phone finder
//   - Snov.io API - email finder and verifier
//   - Clearbit Enrichment API - people data from email/domain
//   - LinkedIn Sales Navigator API (requires partnership)
// =============================================================================

import { db } from "@/lib/db";
import { search, sleep } from "./search";
import { fetchPage, extractEmails, getDomain } from "./website-parser";
import { guessEmails, selectBestEmail, findEmailFromWeb } from "./email-finder";
import type { ScrapedContact, ScrapeOptions, ScrapeJobResult } from "./types";
import { DEFAULT_SCRAPE_OPTIONS } from "./types";

// =============================================================================
// Contact Parsing from Search Results
// =============================================================================

/**
 * Common executive/leadership titles to search for.
 * Ordered by typical outreach priority (decision-makers first).
 */
const TARGET_TITLES = [
  "CEO",
  "CTO",
  "CFO",
  "COO",
  "CMO",
  "VP of Engineering",
  "VP of Sales",
  "VP of Marketing",
  "VP of Product",
  "Head of Engineering",
  "Head of Sales",
  "Head of Marketing",
  "Head of Product",
  "Director of Engineering",
  "Director of Sales",
  "Director of Marketing",
  "Co-Founder",
  "Founder",
  "President",
  "Managing Director",
];

/**
 * Try to determine the department from a job title.
 */
function inferDepartment(title: string): string {
  const lower = title.toLowerCase();
  if (
    lower.includes("engineer") ||
    lower.includes("cto") ||
    lower.includes("technical") ||
    lower.includes("developer") ||
    lower.includes("devops")
  ) {
    return "Engineering";
  }
  if (lower.includes("sales") || lower.includes("business development")) {
    return "Sales";
  }
  if (lower.includes("marketing") || lower.includes("cmo") || lower.includes("growth")) {
    return "Marketing";
  }
  if (lower.includes("product") || lower.includes("design")) {
    return "Product";
  }
  if (
    lower.includes("ceo") ||
    lower.includes("coo") ||
    lower.includes("founder") ||
    lower.includes("president") ||
    lower.includes("managing director")
  ) {
    return "Executive";
  }
  if (lower.includes("cfo") || lower.includes("finance") || lower.includes("accounting")) {
    return "Finance";
  }
  if (lower.includes("hr") || lower.includes("human") || lower.includes("people")) {
    return "Human Resources";
  }
  if (lower.includes("operations")) {
    return "Operations";
  }
  if (lower.includes("legal") || lower.includes("counsel")) {
    return "Legal";
  }
  if (lower.includes("customer success") || lower.includes("support")) {
    return "Customer Success";
  }
  if (lower.includes("data") || lower.includes("analytics")) {
    return "Data Science";
  }
  if (lower.includes("security") || lower.includes("ciso")) {
    return "Security";
  }
  return "";
}

/**
 * Parse contact information from search result text (title + snippet).
 *
 * Looks for patterns like:
 * - "John Doe, CEO at Acme Corp"
 * - "Jane Smith - CTO - Acme Corp | LinkedIn"
 * - "John Doe is the VP of Engineering at Acme"
 *
 * Name extraction is tricky because names can be in many formats.
 * We use heuristics based on common patterns found in search results.
 *
 * @param text - Combined title and snippet text
 * @param companyName - The company name (used to filter relevant mentions)
 * @returns Array of scraped contacts found in the text
 */
function parseContactsFromText(
  text: string,
  companyName: string
): ScrapedContact[] {
  const contacts: ScrapedContact[] = [];

  // Normalize company name for matching
  const companyLower = companyName.toLowerCase();

  // Skip if the text doesn't mention the company
  if (!text.toLowerCase().includes(companyLower.split(/\s+/)[0])) {
    return contacts;
  }

  // --- Pattern 1: "Name, Title at Company" or "Name - Title at Company" ---
  const pattern1 =
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\s*[,\-–|]\s*((?:CEO|CTO|CFO|COO|CMO|VP|Director|Head|Founder|Co-Founder|President|Managing Director|Chief)[^,.\n]{0,60})/g;
  let match: RegExpExecArray | null;

  while ((match = pattern1.exec(text)) !== null) {
    const fullName = match[1].trim();
    const title = match[2].trim().replace(/\s+at\s+.*$/i, "").replace(/\s+[-–|]\s+.*$/, "");

    const nameParts = fullName.split(/\s+/);
    if (nameParts.length >= 2) {
      contacts.push({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
        fullName,
        title,
        department: inferDepartment(title),
      });
    }
  }

  // --- Pattern 2: "Name is the Title of/at Company" ---
  const pattern2 =
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\s+is\s+(?:the\s+)?((?:CEO|CTO|CFO|COO|CMO|VP|Director|Head|Founder|Co-Founder|President|Managing Director|Chief)[^.]{0,60})/g;

  while ((match = pattern2.exec(text)) !== null) {
    const fullName = match[1].trim();
    const title = match[2]
      .trim()
      .replace(/\s+(?:at|of)\s+.*$/i, "")
      .replace(/\s+[-–|]\s+.*$/, "");

    const nameParts = fullName.split(/\s+/);
    if (nameParts.length >= 2) {
      // Check for duplicates
      const isDuplicate = contacts.some(
        (c) => c.fullName.toLowerCase() === fullName.toLowerCase()
      );
      if (!isDuplicate) {
        contacts.push({
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          fullName,
          title,
          department: inferDepartment(title),
        });
      }
    }
  }

  // --- Pattern 3: LinkedIn profile format "Name - Title - Company" ---
  const pattern3 =
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\s*[-–|]\s*((?:CEO|CTO|CFO|COO|CMO|VP|Director|Head|Founder|Co-Founder|President|Managing Director|Chief)[^-–|\n]{0,60})\s*[-–|]/g;

  while ((match = pattern3.exec(text)) !== null) {
    const fullName = match[1].trim();
    const title = match[2].trim();

    const nameParts = fullName.split(/\s+/);
    if (nameParts.length >= 2) {
      const isDuplicate = contacts.some(
        (c) => c.fullName.toLowerCase() === fullName.toLowerCase()
      );
      if (!isDuplicate) {
        contacts.push({
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          fullName,
          title,
          department: inferDepartment(title),
        });
      }
    }
  }

  return contacts;
}

/**
 * Try to find a LinkedIn profile URL from search results for a contact.
 *
 * @param contactName - The person's full name
 * @param companyName - The company they work for
 * @param options - Scrape options
 * @returns LinkedIn URL or null
 */
async function findLinkedInProfile(
  contactName: string,
  companyName: string,
  options: Required<ScrapeOptions>
): Promise<string | null> {
  try {
    const query = `site:linkedin.com/in/ "${contactName}" "${companyName}"`;
    const results = await search(query, {
      maxResults: 3,
      timeout: options.timeout,
      searchProvider: options.searchProvider,
    });

    for (const result of results) {
      if (result.url.includes("linkedin.com/in/")) {
        return result.url;
      }
    }

    return null;
  } catch (error) {
    console.log(
      `[ContactFinder] Error finding LinkedIn for ${contactName}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// =============================================================================
// Team Page Parsing
// =============================================================================

/**
 * Try to find and parse a company's team/about page for contacts.
 *
 * Many company websites have a team page listing key personnel.
 * Common URLs: /team, /about, /about-us, /leadership, /our-team
 *
 * @param websiteUrl - The company's website URL
 * @param companyName - The company name
 * @param options - Scrape options
 * @returns Array of contacts found on the team page
 */
async function parseTeamPage(
  websiteUrl: string,
  companyName: string,
  options: Required<ScrapeOptions>
): Promise<ScrapedContact[]> {
  const contacts: ScrapedContact[] = [];
  const teamPaths = ["/team", "/about", "/about-us", "/leadership", "/our-team", "/people"];

  for (const path of teamPaths) {
    try {
      const teamUrl = new URL(path, websiteUrl).toString();
      const html = await fetchPage(teamUrl, options);

      if (!html) continue;

      // Look for name + title patterns in the team page HTML
      // Common patterns:
      // <h3>John Doe</h3><p>CEO</p>
      // <div class="name">Jane Smith</div><div class="title">CTO</div>
      // <span class="team-name">Bob Jones</span> - VP of Engineering
      const nameAndTitleRegex =
        /(?:<h[2-4][^>]*>|<(?:div|span|p)[^>]*class="[^"]*(?:name|person|member|team)[^"]*"[^>]*>)\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\s*<\/(?:h[2-4]|div|span|p)>[\s\S]{0,200}?(?:<(?:div|span|p)[^>]*(?:class="[^"]*(?:title|role|position)[^"]*"|)[^>]*>)\s*([^<]{3,80})\s*<\/(?:div|span|p)>/gi;

      let match: RegExpExecArray | null;
      while ((match = nameAndTitleRegex.exec(html)) !== null) {
        const fullName = match[1].trim();
        const title = match[2].trim();

        // Validate: title should look like a job title
        if (
          !/(?:CEO|CTO|CFO|COO|CMO|VP|Director|Head|Founder|President|Engineer|Manager|Lead|Chief|Officer)/i.test(
            title
          )
        ) {
          continue;
        }

        const nameParts = fullName.split(/\s+/);
        if (nameParts.length >= 2) {
          const isDuplicate = contacts.some(
            (c) => c.fullName.toLowerCase() === fullName.toLowerCase()
          );
          if (!isDuplicate) {
            contacts.push({
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(" "),
              fullName,
              title,
              department: inferDepartment(title),
            });
          }
        }
      }

      // Also extract emails from the team page
      const pageEmails = extractEmails(html);

      // If we found contacts and emails, try to match them
      if (contacts.length > 0 && pageEmails.length > 0) {
        for (const contact of contacts) {
          if (!contact.email) {
            const matchingEmail = pageEmails.find((email) => {
              const localPart = email.split("@")[0].toLowerCase();
              return (
                localPart.includes(contact.firstName.toLowerCase()) ||
                localPart.includes(contact.lastName.toLowerCase())
              );
            });
            if (matchingEmail) {
              contact.email = matchingEmail;
            }
          }
        }
      }

      if (contacts.length > 0) {
        console.log(
          `[ContactFinder] Found ${contacts.length} contacts on ${teamUrl}`
        );
        break; // Stop checking other paths if we found contacts
      }

      await sleep(options.delayBetweenRequests);
    } catch (error) {
      // Silently continue to next path
      console.log(
        `[ContactFinder] Could not parse team page: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  return contacts;
}

// =============================================================================
// Main Contact Finding Function
// =============================================================================

/**
 * Find key contacts for a company.
 *
 * Strategy:
 * 1. First, try to parse the company's own team page
 * 2. Search for "company name leadership team"
 * 3. Search for specific titles: "company name CEO", "company name CTO"
 * 4. For each found contact, try to find their email
 * 5. Try to find LinkedIn profiles
 * 6. Save to database (up to maxContactsPerCompany)
 *
 * @param companyId - Database ID of the company
 * @param options - Scrape options
 * @returns Summary of the contact finding job
 */
export async function findContactsForCompany(
  companyId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options } as Required<ScrapeOptions>;
  const result: ScrapeJobResult = {
    contactsFound: 0,
    contactsCreated: 0,
    errors: [],
  };

  try {
    // --- Load company from database ---
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { contacts: true },
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    console.log(
      `[ContactFinder] Finding contacts for "${company.name}" (${company.website})`
    );

    // Check if company already has enough contacts
    if (company.contacts.length >= opts.maxContactsPerCompany) {
      console.log(
        `[ContactFinder] "${company.name}" already has ${company.contacts.length} contacts, skipping`
      );
      return result;
    }

    const remainingSlots =
      opts.maxContactsPerCompany - company.contacts.length;

    const allContacts: ScrapedContact[] = [];

    // --- Strategy 1: Parse team page ---
    if (company.website) {
      console.log(
        `[ContactFinder] Checking team page for "${company.name}"`
      );
      const teamContacts = await parseTeamPage(
        company.website,
        company.name,
        opts
      );
      allContacts.push(...teamContacts);
      await sleep(opts.delayBetweenRequests);
    }

    // --- Strategy 2: Search for leadership team ---
    if (allContacts.length < remainingSlots) {
      const leadershipQueries = [
        `"${company.name}" leadership team`,
        `"${company.name}" founders executives`,
      ];

      for (const query of leadershipQueries) {
        try {
          const results = await search(query, {
            maxResults: 5,
            timeout: opts.timeout,
            searchProvider: opts.searchProvider,
          });

          for (const searchResult of results) {
            const combinedText = `${searchResult.title} ${searchResult.snippet}`;
            const parsed = parseContactsFromText(combinedText, company.name);
            for (const contact of parsed) {
              // Check for duplicates
              const isDuplicate = allContacts.some(
                (c) =>
                  c.fullName.toLowerCase() === contact.fullName.toLowerCase()
              );
              if (!isDuplicate) {
                allContacts.push(contact);
              }
            }
          }

          await sleep(opts.delayBetweenRequests);
        } catch (error) {
          result.errors!.push(
            `Search failed: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    }

    // --- Strategy 3: Search for specific titles ---
    if (allContacts.length < remainingSlots) {
      const titleQueries = ["CEO", "CTO", "VP Engineering"].map(
        (title) => `"${company.name}" ${title}`
      );

      for (const query of titleQueries) {
        if (allContacts.length >= remainingSlots * 2) break; // Have enough candidates

        try {
          const results = await search(query, {
            maxResults: 3,
            timeout: opts.timeout,
            searchProvider: opts.searchProvider,
          });

          for (const searchResult of results) {
            const combinedText = `${searchResult.title} ${searchResult.snippet}`;
            const parsed = parseContactsFromText(combinedText, company.name);

            for (const contact of parsed) {
              const isDuplicate = allContacts.some(
                (c) =>
                  c.fullName.toLowerCase() === contact.fullName.toLowerCase()
              );
              if (!isDuplicate) {
                // If the result was from LinkedIn, capture the URL
                if (searchResult.url.includes("linkedin.com/in/")) {
                  contact.linkedinUrl = searchResult.url;
                }
                allContacts.push(contact);
              }
            }
          }

          await sleep(opts.delayBetweenRequests);
        } catch (error) {
          result.errors!.push(
            `Title search failed: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    }

    result.contactsFound = allContacts.length;
    console.log(
      `[ContactFinder] Found ${allContacts.length} potential contacts for "${company.name}"`
    );

    // --- Limit to remaining slots and enrich ---
    const contactsToSave = allContacts.slice(0, remainingSlots);

    // Get company domain for email guessing
    const companyDomain = company.website ? getDomain(company.website) : "";

    for (const contact of contactsToSave) {
      try {
        // Check if this contact already exists in the database
        const existingContact = await db.contact.findFirst({
          where: {
            companyId: company.id,
            fullName: contact.fullName,
          },
        });

        if (existingContact) {
          console.log(
            `[ContactFinder] Contact already exists: "${contact.fullName}"`
          );
          continue;
        }

        // --- Find email ---
        let email: string | null = contact.email || null;

        if (!email && companyDomain) {
          // Generate guessed emails from name patterns
          const guessedEmails = guessEmails(
            contact.firstName,
            contact.lastName,
            companyDomain
          );

          // Try to find email from the web
          let webEmail: string | null = null;
          try {
            webEmail = await findEmailFromWeb(
              contact.fullName,
              company.name,
              opts
            );
            await sleep(opts.delayBetweenRequests);
          } catch {
            // Continue without web email
          }

          email = await selectBestEmail(guessedEmails, webEmail);
        }

        // --- Find LinkedIn profile ---
        if (!contact.linkedinUrl) {
          try {
            contact.linkedinUrl =
              (await findLinkedInProfile(
                contact.fullName,
                company.name,
                opts
              )) || undefined;
            await sleep(opts.delayBetweenRequests);
          } catch {
            // Continue without LinkedIn
          }
        }

        // --- Save to database ---
        await db.contact.create({
          data: {
            companyId: company.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            fullName: contact.fullName,
            title: contact.title || "",
            department: contact.department || "",
            workEmail: email,
            linkedinUrl: contact.linkedinUrl || null,
            photoUrl: contact.photoUrl || null,
          },
        });

        result.contactsCreated = (result.contactsCreated || 0) + 1;
        console.log(
          `[ContactFinder] Saved contact: "${contact.fullName}" (${contact.title}) at "${company.name}"`
        );
      } catch (error) {
        const errorMsg = `Failed to save "${contact.fullName}": ${error instanceof Error ? error.message : error}`;
        console.log(`[ContactFinder] ${errorMsg}`);
        result.errors!.push(errorMsg);
      }
    }

    console.log(
      `[ContactFinder] Complete for "${company.name}". Found: ${result.contactsFound}, Created: ${result.contactsCreated}`
    );
  } catch (error) {
    const errorMsg = `Contact finding failed: ${error instanceof Error ? error.message : error}`;
    console.log(`[ContactFinder] ${errorMsg}`);
    result.errors!.push(errorMsg);
  }

  return result;
}

// =============================================================================
// Contact Enrichment
// =============================================================================

/**
 * Enrich an existing contact with additional data.
 *
 * Tries to find:
 * - Email address (if missing)
 * - LinkedIn profile (if missing)
 * - Additional title/role information
 *
 * @param contactId - Database ID of the contact to enrich
 * @param options - Scrape options
 */
export async function enrichContact(
  contactId: string,
  options?: Partial<ScrapeOptions>
): Promise<void> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options } as Required<ScrapeOptions>;

  try {
    const contact = await db.contact.findUnique({
      where: { id: contactId },
      include: { company: true },
    });

    if (!contact) {
      console.log(`[ContactFinder] Contact not found: ${contactId}`);
      return;
    }

    console.log(
      `[ContactFinder] Enriching contact: "${contact.fullName}" at "${contact.company.name}"`
    );

    const updates: Record<string, unknown> = {
      enrichedAt: new Date(),
    };

    // --- Find email if missing ---
    if (!contact.workEmail) {
      const companyDomain = contact.company.website
        ? getDomain(contact.company.website)
        : "";

      if (companyDomain) {
        const guessedEmails = guessEmails(
          contact.firstName,
          contact.lastName,
          companyDomain
        );

        const webEmail = await findEmailFromWeb(
          contact.fullName,
          contact.company.name,
          opts
        );

        const bestEmail = await selectBestEmail(guessedEmails, webEmail);
        if (bestEmail) {
          updates.workEmail = bestEmail;
        }

        await sleep(opts.delayBetweenRequests);
      }
    }

    // --- Find LinkedIn if missing ---
    if (!contact.linkedinUrl) {
      const linkedinUrl = await findLinkedInProfile(
        contact.fullName,
        contact.company.name,
        opts
      );
      if (linkedinUrl) {
        updates.linkedinUrl = linkedinUrl;
      }
      await sleep(opts.delayBetweenRequests);
    }

    // --- Update the contact ---
    if (Object.keys(updates).length > 1) {
      // More than just enrichedAt
      await db.contact.update({
        where: { id: contactId },
        data: updates,
      });
      console.log(
        `[ContactFinder] Enriched "${contact.fullName}" with ${Object.keys(updates).length - 1} new fields`
      );
    } else {
      // Still mark as enriched even if we found nothing new
      await db.contact.update({
        where: { id: contactId },
        data: { enrichedAt: new Date() },
      });
      console.log(
        `[ContactFinder] No new data found for "${contact.fullName}"`
      );
    }
  } catch (error) {
    console.log(
      `[ContactFinder] Enrichment error for ${contactId}:`,
      error instanceof Error ? error.message : error
    );
  }
}
