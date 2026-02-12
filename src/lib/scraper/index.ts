// =============================================================================
// Scraper Engine - Main Orchestrator
// =============================================================================
// This is the main entry point for the LeadScraper web scraping engine.
// It coordinates all scraping operations and manages scrape jobs in the database.
//
// Architecture:
// - index.ts (this file): Orchestrates high-level operations, manages job state
// - search.ts: Web search via Google/DuckDuckGo (no API keys needed)
// - company-discovery.ts: Find companies matching an ICP
// - contact-finder.ts: Find contacts for discovered companies
// - email-finder.ts: Generate/discover email addresses
// - news-scanner.ts: Find recent news about companies/contacts
// - website-parser.ts: Fetch and parse web pages
// - types.ts: Type definitions
//
// All operations are designed to work WITHOUT paid API keys by using free
// public web sources. The modular design allows individual modules to be
// extended or replaced with paid API integrations later.
//
// Usage:
//   import { discoverCompanies, enrichCompany, enrichContact, scanNews } from "@/lib/scraper";
//
//   // Discover companies matching an ICP
//   const result = await discoverCompanies(icpId);
//
//   // Enrich a company with website data + find contacts
//   await enrichCompany(companyId);
//
//   // Enrich a contact with email + LinkedIn
//   await enrichContact(contactId);
//
//   // Scan for recent news about a company
//   await scanNews(companyId);
// =============================================================================

import { db } from "@/lib/db";
import { discoverCompaniesFromIcp, enrichCompanyFromWebsite } from "./company-discovery";
import { findContactsForCompany, enrichContact as enrichContactData } from "./contact-finder";
import { scanCompanyNews, scanContactArticles } from "./news-scanner";
import type { ScrapeOptions, ScrapeJobResult } from "./types";
import { DEFAULT_SCRAPE_OPTIONS } from "./types";

// =============================================================================
// Job Management Helpers
// =============================================================================

/**
 * Create a scrape job record in the database to track progress.
 */
async function createJob(
  type: string,
  icpId?: string,
  query?: string
): Promise<string> {
  const job = await db.scrapeJob.create({
    data: {
      type,
      icpId: icpId || null,
      query: query || "",
      status: "running",
      startedAt: new Date(),
    },
  });
  return job.id;
}

/**
 * Mark a scrape job as completed with results summary.
 */
async function completeJob(
  jobId: string,
  result: ScrapeJobResult
): Promise<void> {
  await db.scrapeJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      completedAt: new Date(),
      results: JSON.stringify(result),
    },
  });
}

/**
 * Mark a scrape job as failed with error details.
 */
async function failJob(jobId: string, error: string): Promise<void> {
  await db.scrapeJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      completedAt: new Date(),
      error,
    },
  });
}

// =============================================================================
// Main Exported Functions
// =============================================================================

/**
 * Discover companies that match an Ideal Customer Profile.
 *
 * This is the primary function for finding new leads. It:
 * 1. Creates a scrape job for tracking
 * 2. Builds search queries from the ICP criteria
 * 3. Searches the web using DuckDuckGo/Google
 * 4. Parses and deduplicates company results
 * 5. Saves new companies to the database (linked to the ICP)
 * 6. Records the job results
 *
 * @param icpId - Database ID of the ICP to match against
 * @param options - Optional scrape configuration overrides
 * @returns Job result summary including counts of companies found/created
 *
 * @example
 * const result = await discoverCompanies("clxyz123");
 * console.log(`Found ${result.companiesFound} companies, created ${result.companiesCreated}`);
 */
export async function discoverCompanies(
  icpId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const jobId = await createJob("company_discovery", icpId);

  console.log("=".repeat(60));
  console.log(`[Scraper] Starting company discovery for ICP: ${icpId}`);
  console.log("=".repeat(60));

  try {
    const result = await discoverCompaniesFromIcp(icpId, options);

    await completeJob(jobId, result);

    console.log("=".repeat(60));
    console.log(
      `[Scraper] Company discovery complete. Found: ${result.companiesFound}, Created: ${result.companiesCreated}`
    );
    if (result.errors && result.errors.length > 0) {
      console.log(`[Scraper] Errors encountered: ${result.errors.length}`);
    }
    console.log("=".repeat(60));

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await failJob(jobId, errorMsg);

    console.log(`[Scraper] Company discovery FAILED: ${errorMsg}`);

    return {
      companiesFound: 0,
      companiesCreated: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Enrich a single company with additional data.
 *
 * Performs two operations:
 * 1. Website enrichment - visits the company's website to extract description,
 *    social links, technology stack, location, etc.
 * 2. Contact finding - searches for key contacts (CEO, CTO, VP, etc.) and
 *    tries to find their email addresses and LinkedIn profiles.
 *
 * @param companyId - Database ID of the company to enrich
 * @param options - Optional scrape configuration overrides
 * @returns Job result summary
 *
 * @example
 * const result = await enrichCompany("clxyz456");
 * console.log(`Found ${result.contactsCreated} new contacts`);
 */
export async function enrichCompany(
  companyId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  const jobId = await createJob("contact_enrichment", undefined, `company:${companyId}`);

  console.log("=".repeat(60));
  console.log(`[Scraper] Starting company enrichment: ${companyId}`);
  console.log("=".repeat(60));

  const combinedResult: ScrapeJobResult = {
    companiesFound: 1,
    contactsFound: 0,
    contactsCreated: 0,
    errors: [],
  };

  try {
    // --- Step 1: Enrich company data from website ---
    console.log("[Scraper] Step 1: Enriching company from website...");
    try {
      await enrichCompanyFromWebsite(companyId, opts);
    } catch (error) {
      const errorMsg = `Website enrichment failed: ${error instanceof Error ? error.message : error}`;
      console.log(`[Scraper] ${errorMsg}`);
      combinedResult.errors!.push(errorMsg);
      // Continue to contact finding even if website enrichment fails
    }

    // --- Step 2: Find contacts ---
    console.log("[Scraper] Step 2: Finding contacts...");
    try {
      const contactResult = await findContactsForCompany(companyId, opts);
      combinedResult.contactsFound = contactResult.contactsFound;
      combinedResult.contactsCreated = contactResult.contactsCreated;
      if (contactResult.errors) {
        combinedResult.errors!.push(...contactResult.errors);
      }
    } catch (error) {
      const errorMsg = `Contact finding failed: ${error instanceof Error ? error.message : error}`;
      console.log(`[Scraper] ${errorMsg}`);
      combinedResult.errors!.push(errorMsg);
    }

    await completeJob(jobId, combinedResult);

    console.log("=".repeat(60));
    console.log(
      `[Scraper] Company enrichment complete. Contacts found: ${combinedResult.contactsFound}, created: ${combinedResult.contactsCreated}`
    );
    console.log("=".repeat(60));

    return combinedResult;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await failJob(jobId, errorMsg);
    console.log(`[Scraper] Company enrichment FAILED: ${errorMsg}`);

    return {
      ...combinedResult,
      errors: [...(combinedResult.errors || []), errorMsg],
    };
  }
}

/**
 * Enrich a single contact with additional data (email, LinkedIn, etc.).
 *
 * Tries to find:
 * - Work email (using pattern generation + web search)
 * - LinkedIn profile URL
 * - Recent articles/mentions (for email personalization)
 *
 * @param contactId - Database ID of the contact to enrich
 * @param options - Optional scrape configuration overrides
 * @returns Job result summary
 *
 * @example
 * await enrichContact("clxyz789");
 */
export async function enrichContact(
  contactId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  const jobId = await createJob("contact_enrichment", undefined, `contact:${contactId}`);

  console.log("=".repeat(60));
  console.log(`[Scraper] Starting contact enrichment: ${contactId}`);
  console.log("=".repeat(60));

  const combinedResult: ScrapeJobResult = {
    contactsFound: 1,
    newsItemsFound: 0,
    newsItemsCreated: 0,
    errors: [],
  };

  try {
    // --- Step 1: Enrich contact data (email, LinkedIn) ---
    console.log("[Scraper] Step 1: Enriching contact data...");
    try {
      await enrichContactData(contactId, opts);
    } catch (error) {
      const errorMsg = `Contact enrichment failed: ${error instanceof Error ? error.message : error}`;
      console.log(`[Scraper] ${errorMsg}`);
      combinedResult.errors!.push(errorMsg);
    }

    // --- Step 2: Scan for contact articles ---
    console.log("[Scraper] Step 2: Scanning for articles...");
    try {
      const articleResult = await scanContactArticles(contactId, opts);
      combinedResult.newsItemsFound = articleResult.newsItemsFound;
      combinedResult.newsItemsCreated = articleResult.newsItemsCreated;
      if (articleResult.errors) {
        combinedResult.errors!.push(...articleResult.errors);
      }
    } catch (error) {
      const errorMsg = `Article scan failed: ${error instanceof Error ? error.message : error}`;
      console.log(`[Scraper] ${errorMsg}`);
      combinedResult.errors!.push(errorMsg);
    }

    await completeJob(jobId, combinedResult);

    console.log("=".repeat(60));
    console.log(
      `[Scraper] Contact enrichment complete. Articles found: ${combinedResult.newsItemsFound}, saved: ${combinedResult.newsItemsCreated}`
    );
    console.log("=".repeat(60));

    return combinedResult;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await failJob(jobId, errorMsg);
    console.log(`[Scraper] Contact enrichment FAILED: ${errorMsg}`);

    return {
      ...combinedResult,
      errors: [...(combinedResult.errors || []), errorMsg],
    };
  }
}

/**
 * Scan for recent news about a company.
 *
 * Searches the web for news articles, press releases, and announcements
 * mentioning the company. Found articles are saved to the database for
 * use in personalized email outreach.
 *
 * @param companyId - Database ID of the company
 * @param options - Optional scrape configuration overrides
 * @returns Job result summary with news items found/created
 *
 * @example
 * const result = await scanNews("clxyz456");
 * console.log(`Found ${result.newsItemsCreated} new articles`);
 */
export async function scanNews(
  companyId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const jobId = await createJob("news_scan", undefined, `company:${companyId}`);

  console.log("=".repeat(60));
  console.log(`[Scraper] Starting news scan for company: ${companyId}`);
  console.log("=".repeat(60));

  try {
    const result = await scanCompanyNews(companyId, options);

    await completeJob(jobId, result);

    console.log("=".repeat(60));
    console.log(
      `[Scraper] News scan complete. Found: ${result.newsItemsFound}, Saved: ${result.newsItemsCreated}`
    );
    console.log("=".repeat(60));

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await failJob(jobId, errorMsg);
    console.log(`[Scraper] News scan FAILED: ${errorMsg}`);

    return {
      newsItemsFound: 0,
      newsItemsCreated: 0,
      errors: [errorMsg],
    };
  }
}

// =============================================================================
// Batch Operations
// =============================================================================

/**
 * Enrich all companies that haven't been enriched yet for a given ICP.
 *
 * Useful after running discoverCompanies() to automatically enrich all
 * newly found companies with website data and contacts.
 *
 * @param icpId - Database ID of the ICP
 * @param options - Optional scrape configuration overrides
 * @returns Combined result summary
 */
export async function enrichAllCompanies(
  icpId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };

  console.log("=".repeat(60));
  console.log(`[Scraper] Batch enriching all companies for ICP: ${icpId}`);
  console.log("=".repeat(60));

  const combinedResult: ScrapeJobResult = {
    companiesFound: 0,
    contactsFound: 0,
    contactsCreated: 0,
    errors: [],
  };

  try {
    // Find all un-enriched companies for this ICP
    const companies = await db.company.findMany({
      where: {
        matchedIcpId: icpId,
        enrichedAt: null,
      },
      select: { id: true, name: true },
    });

    combinedResult.companiesFound = companies.length;
    console.log(`[Scraper] Found ${companies.length} companies to enrich`);

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(
        `[Scraper] Enriching (${i + 1}/${companies.length}): "${company.name}"`
      );

      try {
        const result = await enrichCompany(company.id, opts);
        combinedResult.contactsFound =
          (combinedResult.contactsFound || 0) + (result.contactsFound || 0);
        combinedResult.contactsCreated =
          (combinedResult.contactsCreated || 0) + (result.contactsCreated || 0);
        if (result.errors) {
          combinedResult.errors!.push(...result.errors);
        }
      } catch (error) {
        combinedResult.errors!.push(
          `Failed to enrich "${company.name}": ${error instanceof Error ? error.message : error}`
        );
      }

      // Delay between companies to be respectful
      if (i < companies.length - 1) {
        const { sleep } = await import("./search");
        await sleep(opts.delayBetweenRequests * 2);
      }
    }

    console.log("=".repeat(60));
    console.log(
      `[Scraper] Batch enrichment complete. Companies: ${companies.length}, Total contacts created: ${combinedResult.contactsCreated}`
    );
    console.log("=".repeat(60));
  } catch (error) {
    combinedResult.errors!.push(
      `Batch enrichment failed: ${error instanceof Error ? error.message : error}`
    );
  }

  return combinedResult;
}

/**
 * Run a full pipeline: discover companies, enrich them, and scan news.
 *
 * This is the "do everything" function that runs the complete scraping
 * pipeline for an ICP. Useful for background job processing.
 *
 * @param icpId - Database ID of the ICP
 * @param options - Optional scrape configuration overrides
 * @returns Combined result summary
 */
export async function runFullPipeline(
  icpId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };

  console.log("=".repeat(60));
  console.log(`[Scraper] FULL PIPELINE starting for ICP: ${icpId}`);
  console.log("=".repeat(60));

  const combinedResult: ScrapeJobResult = {
    companiesFound: 0,
    companiesCreated: 0,
    contactsFound: 0,
    contactsCreated: 0,
    newsItemsFound: 0,
    newsItemsCreated: 0,
    errors: [],
    queries: [],
  };

  // --- Phase 1: Discover companies ---
  console.log("[Scraper] === Phase 1: Company Discovery ===");
  const discoveryResult = await discoverCompanies(icpId, opts);
  combinedResult.companiesFound = discoveryResult.companiesFound;
  combinedResult.companiesCreated = discoveryResult.companiesCreated;
  combinedResult.queries = discoveryResult.queries;
  if (discoveryResult.errors) {
    combinedResult.errors!.push(...discoveryResult.errors);
  }

  // --- Phase 2: Enrich companies + find contacts ---
  console.log("[Scraper] === Phase 2: Company Enrichment ===");
  const enrichResult = await enrichAllCompanies(icpId, opts);
  combinedResult.contactsFound = enrichResult.contactsFound;
  combinedResult.contactsCreated = enrichResult.contactsCreated;
  if (enrichResult.errors) {
    combinedResult.errors!.push(...enrichResult.errors);
  }

  // --- Phase 3: Scan news for enriched companies ---
  console.log("[Scraper] === Phase 3: News Scanning ===");
  try {
    const companies = await db.company.findMany({
      where: { matchedIcpId: icpId },
      select: { id: true, name: true },
      take: 10, // Limit news scanning to first 10 companies
    });

    for (const company of companies) {
      try {
        const newsResult = await scanNews(company.id, opts);
        combinedResult.newsItemsFound =
          (combinedResult.newsItemsFound || 0) + (newsResult.newsItemsFound || 0);
        combinedResult.newsItemsCreated =
          (combinedResult.newsItemsCreated || 0) + (newsResult.newsItemsCreated || 0);
        if (newsResult.errors) {
          combinedResult.errors!.push(...newsResult.errors);
        }
      } catch (error) {
        combinedResult.errors!.push(
          `News scan for "${company.name}" failed: ${error instanceof Error ? error.message : error}`
        );
      }
    }
  } catch (error) {
    combinedResult.errors!.push(
      `News scanning phase failed: ${error instanceof Error ? error.message : error}`
    );
  }

  console.log("=".repeat(60));
  console.log("[Scraper] FULL PIPELINE COMPLETE");
  console.log(
    `[Scraper] Companies: ${combinedResult.companiesCreated} created`
  );
  console.log(
    `[Scraper] Contacts: ${combinedResult.contactsCreated} created`
  );
  console.log(
    `[Scraper] News items: ${combinedResult.newsItemsCreated} saved`
  );
  console.log(
    `[Scraper] Errors: ${combinedResult.errors?.length || 0}`
  );
  console.log("=".repeat(60));

  return combinedResult;
}

// =============================================================================
// Re-exports for convenience
// =============================================================================
// These allow consumers to import specific utilities directly from "@/lib/scraper"
// if needed (e.g., for testing or custom pipelines).

export type { ScrapeOptions, ScrapeJobResult } from "./types";
export { DEFAULT_SCRAPE_OPTIONS } from "./types";
export { search, searchGoogle, searchDuckDuckGo } from "./search";
export { guessEmails, verifyEmail, findEmailFromWeb } from "./email-finder";
export { buildSearchQueries } from "./company-discovery";
export { fetchPage, extractText, extractEmails, extractSocialLinks } from "./website-parser";
