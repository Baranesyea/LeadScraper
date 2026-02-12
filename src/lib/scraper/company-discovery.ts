// =============================================================================
// Company Discovery Logic
// =============================================================================
// Discovers companies that match an Ideal Customer Profile (ICP) by searching
// the web and parsing results. This is the primary entry point for finding
// new leads.
//
// How it works:
// 1. Load the ICP criteria from the database
// 2. Build multiple search queries from different angles (industry + location,
//    funding stage + size, technology stack, keywords, etc.)
// 3. Search the web using DuckDuckGo/Google
// 4. Parse company information from search results
// 5. Deduplicate results (by company name and domain)
// 6. Optionally enrich by visiting company websites
// 7. Save new companies to the database
//
// Future enhancements - plug in paid company databases:
//   - Crunchbase API - comprehensive startup/funding data
//   - PitchBook API - investment and financial data
//   - Apollo.io API - company and contact database
//   - ZoomInfo API - B2B company intelligence
//   - Clearbit Enrichment API - company data from domain
//   - BuiltWith API - technology stack detection
// =============================================================================

import { db } from "@/lib/db";
import { search, sleep } from "./search";
import { fetchPage, extractCompanyInfo, getDomain } from "./website-parser";
import type {
  ScrapedCompany,
  SearchResult,
  ScrapeOptions,
  ScrapeJobResult,
} from "./types";
import { DEFAULT_SCRAPE_OPTIONS } from "./types";

// =============================================================================
// Search Query Building
// =============================================================================

/**
 * ICP criteria structure (matches what we load from the database).
 * The JSON array fields are parsed from their string storage format.
 */
interface IcpCriteria {
  id: string;
  name: string;
  industries: string[];
  companySizeMin: number | null;
  companySizeMax: number | null;
  locations: string[];
  technologies: string[];
  fundingStages: string[];
  revenueMin: number | null;
  revenueMax: number | null;
  keywords: string[];
}

/**
 * Build a human-readable size description from min/max employee counts.
 */
function buildSizeDescription(
  min: number | null,
  max: number | null
): string {
  if (min && max) return `${min}-${max} employees`;
  if (min) return `${min}+ employees`;
  if (max) return `up to ${max} employees`;
  return "";
}

/**
 * Map funding stage slugs to human-readable search terms.
 */
function formatFundingStage(stage: string): string {
  const map: Record<string, string> = {
    "pre-seed": "Pre-Seed",
    seed: "Seed",
    "series-a": "Series A",
    "series-b": "Series B",
    "series-c": "Series C",
    "series-d-plus": "Series D+",
    public: "Public",
    bootstrapped: "Bootstrapped",
  };
  return map[stage] || stage;
}

/**
 * Build multiple search queries from ICP criteria.
 *
 * Strategy: Generate queries from different "angles" to maximize coverage:
 * - Industry + location queries (e.g., "SaaS companies in San Francisco")
 * - Industry + funding stage (e.g., "FinTech startups Series A funding")
 * - Industry + size (e.g., "AI companies 50-200 employees")
 * - Technology + industry (e.g., "companies using React in healthcare")
 * - Keyword-based queries
 * - Combined queries for more specific results
 *
 * @param icp - The ICP criteria
 * @returns Array of search query strings
 */
export function buildSearchQueries(icp: IcpCriteria): string[] {
  const queries: string[] = [];

  const industries = icp.industries.length > 0 ? icp.industries : ["technology"];
  const locations = icp.locations;
  const fundingStages = icp.fundingStages;
  const technologies = icp.technologies;
  const keywords = icp.keywords;
  const sizeDesc = buildSizeDescription(icp.companySizeMin, icp.companySizeMax);

  // --- Angle 1: Industry + Location ---
  // "SaaS companies in San Francisco"
  for (const industry of industries.slice(0, 3)) {
    if (locations.length > 0) {
      for (const location of locations.slice(0, 3)) {
        queries.push(`${industry} companies in ${location}`);
      }
    } else {
      queries.push(`${industry} companies startups list`);
    }
  }

  // --- Angle 2: Industry + Funding Stage ---
  // "FinTech startups Series A funding 2024"
  for (const industry of industries.slice(0, 2)) {
    for (const stage of fundingStages.slice(0, 2)) {
      queries.push(
        `${industry} startups ${formatFundingStage(stage)} funding`
      );
    }
  }

  // --- Angle 3: Industry + Company Size ---
  // "AI companies 50-200 employees"
  if (sizeDesc) {
    for (const industry of industries.slice(0, 2)) {
      queries.push(`${industry} companies ${sizeDesc}`);
    }
  }

  // --- Angle 4: Technology-based ---
  // "companies using React and TypeScript"
  if (technologies.length > 0) {
    const techChunks = [];
    for (let i = 0; i < technologies.length; i += 3) {
      techChunks.push(technologies.slice(i, i + 3).join(" and "));
    }
    for (const chunk of techChunks.slice(0, 2)) {
      queries.push(`companies using ${chunk}`);
      if (industries.length > 0) {
        queries.push(`${industries[0]} companies using ${chunk}`);
      }
    }
  }

  // --- Angle 5: Keyword-based ---
  // Direct keyword searches
  for (const keyword of keywords.slice(0, 3)) {
    queries.push(`${keyword} companies`);
    if (locations.length > 0) {
      queries.push(`${keyword} companies ${locations[0]}`);
    }
  }

  // --- Angle 6: "Top/Best" list queries ---
  // These often lead to curated lists of companies
  for (const industry of industries.slice(0, 2)) {
    queries.push(`top ${industry} companies to watch`);
    queries.push(`best ${industry} startups`);
  }

  // Remove duplicate queries and limit total count
  const uniqueQueries = [...new Set(queries)];
  return uniqueQueries.slice(0, 15); // Cap at 15 queries to be reasonable
}

// =============================================================================
// Company Parsing
// =============================================================================

/**
 * Try to extract company information from a search result.
 *
 * Parses the title and snippet to find:
 * - Company name (from the title, before common separators)
 * - Description (from the snippet)
 * - Website URL (from the result URL)
 *
 * This is a heuristic approach that works well for company list pages,
 * Crunchbase/LinkedIn profiles, and company homepages.
 *
 * @param result - A search result to parse
 * @returns Extracted company info, or null if it doesn't look like a company
 */
export function parseCompanyFromSearch(
  result: SearchResult
): ScrapedCompany | null {
  try {
    const { title, url, snippet } = result;

    // Skip non-useful results (search engine pages, job sites, etc.)
    const skipDomains = [
      "google.com",
      "bing.com",
      "duckduckgo.com",
      "youtube.com",
      "wikipedia.org",
      "indeed.com",
      "glassdoor.com",
      "yelp.com",
      "amazon.com",
      "reddit.com",
      "facebook.com",
      "twitter.com",
      "instagram.com",
    ];

    const domain = getDomain(url);
    if (skipDomains.some((d) => domain.includes(d))) {
      return null;
    }

    // --- Extract company name from title ---
    // Common title patterns:
    // "Acme Corp - Leading SaaS Platform"
    // "Acme Corp | Enterprise Solutions"
    // "Acme Corp: Cloud Infrastructure"
    // "About Acme Corp - Company Profile on Crunchbase"
    let name = title;

    // Handle Crunchbase/LinkedIn profile pages
    if (domain.includes("crunchbase.com")) {
      const cbMatch = title.match(/^(.+?)(?:\s*[-|:]\s*Crunchbase)/i);
      if (cbMatch) name = cbMatch[1].trim();
    } else if (domain.includes("linkedin.com")) {
      const liMatch = title.match(
        /^(.+?)(?:\s*[-|:]\s*LinkedIn|\s*\|\s*LinkedIn)/i
      );
      if (liMatch) name = liMatch[1].trim();
    } else {
      // For regular websites, take the first segment before | - :
      const segments = name.split(/\s*[|–—:]\s*/);
      if (segments.length > 1) {
        // Usually the company name is the first or shortest segment
        name = segments[0].trim();
      }
    }

    // Clean up the name
    name = name
      .replace(/^About\s+/i, "")
      .replace(/\s+Inc\.?$|\s+LLC$|\s+Ltd\.?$|\s+Corp\.?$/i, "")
      .replace(/\s*[-–]\s*$/, "")
      .trim();

    // Skip if name is too short or too long (likely not a company name)
    if (name.length < 2 || name.length > 100) {
      return null;
    }

    // Skip if name looks like a generic page title
    const genericTitles = [
      "home",
      "homepage",
      "welcome",
      "about us",
      "contact us",
      "blog",
      "news",
      "products",
      "services",
      "pricing",
      "careers",
      "top",
      "best",
      "list",
    ];
    if (genericTitles.includes(name.toLowerCase())) {
      return null;
    }

    // Build the scraped company object
    const company: ScrapedCompany = {
      name,
      description: snippet || undefined,
      website: url,
      sourceUrl: url,
    };

    // Try to extract additional info from the snippet
    if (snippet) {
      // Look for employee count mentions
      const empMatch = snippet.match(/(\d[\d,]*)\s*(?:\+\s*)?employees/i);
      if (empMatch) {
        company.employeeCount = parseInt(empMatch[1].replace(/,/g, ""), 10);
      }

      // Look for location mentions (City, STATE pattern)
      const locMatch = snippet.match(
        /(?:based in|headquartered in|located in)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:,\s*[A-Z]{2,})?)(?:\s|[.,]|$)/
      );
      if (locMatch) {
        company.location = locMatch[1];
      }

      // Look for funding mentions
      const fundingMatch = snippet.match(
        /(?:raised|funding|round)\s*(?:of\s*)?\$?([\d.]+)\s*(million|billion|M|B|K)/i
      );
      if (fundingMatch) {
        let amount = parseFloat(fundingMatch[1]);
        const unit = fundingMatch[2].toLowerCase();
        if (unit === "billion" || unit === "b") amount *= 1000000000;
        else if (unit === "million" || unit === "m") amount *= 1000000;
        else if (unit === "k") amount *= 1000;
        company.fundingAmount = Math.round(amount);
      }

      // Look for Series mentions
      const seriesMatch = snippet.match(
        /Series\s+([A-F])\b/i
      );
      if (seriesMatch) {
        company.fundingStage = `series-${seriesMatch[1].toLowerCase()}`;
      } else if (/seed\s+(round|funding)/i.test(snippet)) {
        company.fundingStage = "seed";
      }
    }

    return company;
  } catch (error) {
    console.log(
      `[CompanyDiscovery] Error parsing search result:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// =============================================================================
// Deduplication
// =============================================================================

/**
 * Deduplicate scraped companies by name similarity and domain.
 *
 * Two companies are considered duplicates if:
 * 1. Their names are identical (case-insensitive), OR
 * 2. Their website domains match
 *
 * When duplicates are found, the entry with more data (longer description,
 * more fields filled) is kept.
 */
function deduplicateCompanies(
  companies: ScrapedCompany[]
): ScrapedCompany[] {
  const seen = new Map<string, ScrapedCompany>();

  for (const company of companies) {
    // Normalize name for comparison
    const normalizedName = company.name.toLowerCase().trim();

    // Also check domain
    const domain = company.website ? getDomain(company.website) : "";

    // Check if we've seen this company before (by name or domain)
    let isDuplicate = false;
    let existingKey = "";

    for (const [key, existing] of seen.entries()) {
      const existingDomain = existing.website
        ? getDomain(existing.website)
        : "";

      if (
        key === normalizedName ||
        (domain && existingDomain && domain === existingDomain)
      ) {
        isDuplicate = true;
        existingKey = key;
        break;
      }
    }

    if (isDuplicate && existingKey) {
      // Keep the entry with more data
      const existing = seen.get(existingKey)!;
      const existingScore = countFilledFields(existing);
      const newScore = countFilledFields(company);

      if (newScore > existingScore) {
        seen.delete(existingKey);
        seen.set(normalizedName, company);
      }
    } else {
      seen.set(normalizedName, company);
    }
  }

  return Array.from(seen.values());
}

/**
 * Count how many fields are filled in a scraped company object.
 * Used for deduplication to prefer entries with more data.
 */
function countFilledFields(company: ScrapedCompany): number {
  let count = 0;
  if (company.name) count++;
  if (company.description && company.description.length > 10) count += 2;
  if (company.industry) count++;
  if (company.website) count++;
  if (company.location) count++;
  if (company.employeeCount) count++;
  if (company.fundingStage) count++;
  if (company.fundingAmount) count++;
  if (company.technologies && company.technologies.length > 0) count++;
  return count;
}

// =============================================================================
// Main Discovery Function
// =============================================================================

/**
 * Discover companies that match an ICP by searching the web.
 *
 * Full pipeline:
 * 1. Load ICP criteria from database
 * 2. Build search queries from multiple angles
 * 3. Execute searches with delays between requests
 * 4. Parse company data from results
 * 5. Deduplicate results
 * 6. Check which companies already exist in the database
 * 7. Save new companies to the database (linked to the ICP)
 * 8. Return summary of what was found
 *
 * @param icpId - The database ID of the ICP to match against
 * @param options - Scrape options
 * @returns Summary of the discovery job
 */
export async function discoverCompaniesFromIcp(
  icpId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  const result: ScrapeJobResult = {
    companiesFound: 0,
    companiesCreated: 0,
    errors: [],
    queries: [],
  };

  try {
    // --- Step 1: Load ICP from database ---
    console.log(`[CompanyDiscovery] Loading ICP: ${icpId}`);

    const icpRecord = await db.icpProfile.findUnique({
      where: { id: icpId },
    });

    if (!icpRecord) {
      throw new Error(`ICP not found: ${icpId}`);
    }

    // Parse JSON array fields from their string storage
    const icp: IcpCriteria = {
      id: icpRecord.id,
      name: icpRecord.name,
      industries: JSON.parse(icpRecord.industries) as string[],
      companySizeMin: icpRecord.companySizeMin,
      companySizeMax: icpRecord.companySizeMax,
      locations: JSON.parse(icpRecord.locations) as string[],
      technologies: JSON.parse(icpRecord.technologies) as string[],
      fundingStages: JSON.parse(icpRecord.fundingStages) as string[],
      revenueMin: icpRecord.revenueMin,
      revenueMax: icpRecord.revenueMax,
      keywords: JSON.parse(icpRecord.keywords) as string[],
    };

    console.log(
      `[CompanyDiscovery] ICP loaded: "${icp.name}" - Industries: ${icp.industries.join(", ")}`
    );

    // --- Step 2: Build search queries ---
    const queries = buildSearchQueries(icp);
    result.queries = queries;
    console.log(
      `[CompanyDiscovery] Generated ${queries.length} search queries`
    );

    // --- Step 3: Execute searches ---
    const allCompanies: ScrapedCompany[] = [];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(
        `[CompanyDiscovery] Searching (${i + 1}/${queries.length}): "${query}"`
      );

      try {
        const searchResults = await search(query, {
          maxResults: opts.maxResults,
          timeout: opts.timeout,
          searchProvider: opts.searchProvider,
        });

        // --- Step 4: Parse company data from results ---
        for (const searchResult of searchResults) {
          const company = parseCompanyFromSearch(searchResult);
          if (company) {
            allCompanies.push(company);
          }
        }

        console.log(
          `[CompanyDiscovery] Query "${query}" yielded ${searchResults.length} results`
        );
      } catch (error) {
        const errorMsg = `Query "${query}" failed: ${error instanceof Error ? error.message : error}`;
        console.log(`[CompanyDiscovery] ${errorMsg}`);
        result.errors!.push(errorMsg);
      }

      // Delay between queries to avoid rate limiting
      if (i < queries.length - 1) {
        await sleep(opts.delayBetweenRequests);
      }
    }

    console.log(
      `[CompanyDiscovery] Total raw companies found: ${allCompanies.length}`
    );

    // --- Step 5: Deduplicate ---
    const uniqueCompanies = deduplicateCompanies(allCompanies);
    result.companiesFound = uniqueCompanies.length;
    console.log(
      `[CompanyDiscovery] Unique companies after dedup: ${uniqueCompanies.length}`
    );

    // --- Step 6 & 7: Check existing and save new companies ---
    let createdCount = 0;

    for (const company of uniqueCompanies) {
      try {
        // Check if company already exists (by name, case-insensitive)
        const existing = await db.company.findFirst({
          where: {
            name: {
              equals: company.name,
            },
          },
        });

        if (existing) {
          console.log(
            `[CompanyDiscovery] Company already exists: "${company.name}"`
          );
          continue;
        }

        // Determine employee range from count
        let employeeRange = "";
        if (company.employeeCount) {
          if (company.employeeCount <= 10) employeeRange = "1-10";
          else if (company.employeeCount <= 50) employeeRange = "11-50";
          else if (company.employeeCount <= 200) employeeRange = "51-200";
          else if (company.employeeCount <= 500) employeeRange = "201-500";
          else if (company.employeeCount <= 1000) employeeRange = "501-1000";
          else if (company.employeeCount <= 5000) employeeRange = "1001-5000";
          else employeeRange = "5000+";
        }

        // Save new company to database
        await db.company.create({
          data: {
            name: company.name,
            description: company.description || "",
            industry: company.industry || "",
            website: company.website || "",
            location: company.location || "",
            country: company.country || "",
            employeeCount: company.employeeCount || 0,
            employeeRange,
            fundingStage: company.fundingStage || "",
            fundingAmount: company.fundingAmount || null,
            technologies: JSON.stringify(company.technologies || []),
            matchedIcpId: icpId,
          },
        });

        createdCount++;
        console.log(`[CompanyDiscovery] Saved new company: "${company.name}"`);
      } catch (error) {
        const errorMsg = `Failed to save "${company.name}": ${error instanceof Error ? error.message : error}`;
        console.log(`[CompanyDiscovery] ${errorMsg}`);
        result.errors!.push(errorMsg);
      }
    }

    result.companiesCreated = createdCount;
    console.log(
      `[CompanyDiscovery] Complete. Found: ${result.companiesFound}, Created: ${result.companiesCreated}`
    );
  } catch (error) {
    const errorMsg = `Discovery failed: ${error instanceof Error ? error.message : error}`;
    console.log(`[CompanyDiscovery] ${errorMsg}`);
    result.errors!.push(errorMsg);
  }

  return result;
}

// =============================================================================
// Single Company Enrichment
// =============================================================================

/**
 * Enrich an existing company with additional data by visiting its website.
 *
 * Fetches the company's website and extracts:
 * - Better description (from meta tags)
 * - Email addresses
 * - Social media links
 * - Technology stack
 * - Location information
 *
 * Only updates fields that are currently empty - it never overwrites
 * existing data.
 *
 * @param companyId - Database ID of the company to enrich
 * @param options - Scrape options
 */
export async function enrichCompanyFromWebsite(
  companyId: string,
  options?: Partial<ScrapeOptions>
): Promise<void> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };

  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      console.log(
        `[CompanyDiscovery] Company not found for enrichment: ${companyId}`
      );
      return;
    }

    if (!company.website) {
      console.log(
        `[CompanyDiscovery] No website for company "${company.name}", skipping enrichment`
      );
      return;
    }

    console.log(
      `[CompanyDiscovery] Enriching "${company.name}" from ${company.website}`
    );

    // Fetch the company's homepage
    const html = await fetchPage(company.website, opts);
    if (!html) {
      console.log(
        `[CompanyDiscovery] Could not fetch website for "${company.name}"`
      );
      return;
    }

    // Extract information from the page
    const info = extractCompanyInfo(html, company.website);

    // Build update object (only update empty fields)
    const updates: Record<string, unknown> = {
      enrichedAt: new Date(),
    };

    if (!company.description && info.description) {
      updates.description = info.description;
    }

    if (!company.location && info.location) {
      updates.location = info.location;
    }

    if (company.employeeCount === 0 && info.employeeCount) {
      updates.employeeCount = info.employeeCount;
    }

    // Merge technologies
    const existingTech = JSON.parse(company.technologies) as string[];
    if (info.technologies && info.technologies.length > 0) {
      const mergedTech = [...new Set([...existingTech, ...info.technologies])];
      updates.technologies = JSON.stringify(mergedTech);
    }

    // Update the company record
    await db.company.update({
      where: { id: companyId },
      data: updates,
    });

    console.log(
      `[CompanyDiscovery] Enriched "${company.name}" with ${Object.keys(updates).length - 1} new fields`
    );

    // Also try the about page if it exists
    await sleep(opts.delayBetweenRequests);
    const aboutUrl = new URL("/about", company.website).toString();
    const aboutHtml = await fetchPage(aboutUrl, opts);

    if (aboutHtml) {
      const aboutInfo = extractCompanyInfo(aboutHtml, aboutUrl);

      const aboutUpdates: Record<string, unknown> = {};

      // A company's about page usually has a better description
      if (aboutInfo.description && aboutInfo.description.length > (company.description?.length || 0)) {
        aboutUpdates.description = aboutInfo.description;
      }

      if (!company.location && !updates.location && aboutInfo.location) {
        aboutUpdates.location = aboutInfo.location;
      }

      if (Object.keys(aboutUpdates).length > 0) {
        await db.company.update({
          where: { id: companyId },
          data: aboutUpdates,
        });
        console.log(
          `[CompanyDiscovery] Additional data from about page for "${company.name}"`
        );
      }
    }
  } catch (error) {
    console.log(
      `[CompanyDiscovery] Enrichment error for ${companyId}:`,
      error instanceof Error ? error.message : error
    );
  }
}
