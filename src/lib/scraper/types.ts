// =============================================================================
// Scraper Type Definitions
// =============================================================================
// All types used across the scraper engine. These are internal scraper types,
// separate from the app-level types in @/types. Data flows from these scraper
// types into the Prisma database models.
// =============================================================================

/**
 * A single search result returned by any search provider (Google, DuckDuckGo, etc.)
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Raw company data extracted from the web before being saved to the database.
 * Fields are optional because web scraping often yields partial data.
 */
export interface ScrapedCompany {
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  location?: string;
  country?: string;
  employeeCount?: number;
  employeeRange?: string;
  fundingStage?: string;
  fundingAmount?: number;
  technologies?: string[];
  logoUrl?: string;
  sourceUrl?: string; // The URL where we found this company
}

/**
 * Raw contact data extracted from the web before being saved to the database.
 */
export interface ScrapedContact {
  firstName: string;
  lastName: string;
  fullName: string;
  title?: string;
  department?: string;
  email?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  sourceUrl?: string; // The URL where we found this contact
}

/**
 * A news article or press mention about a company.
 */
export interface ScrapedNewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  snippet: string;
}

/**
 * An article or mention about a specific contact/person.
 */
export interface ScrapedArticle {
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  snippet: string;
}

/**
 * Configuration options for scraping operations.
 */
export interface ScrapeOptions {
  /** Maximum number of search results to process per query (default: 10) */
  maxResults?: number;

  /** HTTP request timeout in milliseconds (default: 10000) */
  timeout?: number;

  /** Delay between HTTP requests in milliseconds to avoid rate limiting (default: 1500) */
  delayBetweenRequests?: number;

  /** Maximum number of contacts to find per company (default: 3) */
  maxContactsPerCompany?: number;

  /** Maximum number of news items to find per company (default: 5) */
  maxNewsPerCompany?: number;

  /**
   * Which search provider to use.
   * 'duckduckgo' is more reliable for automated queries.
   * 'google' may return better results but blocks bots more aggressively.
   * 'both' tries DuckDuckGo first, falls back to Google if no results.
   */
  searchProvider?: "google" | "duckduckgo" | "both";
}

/**
 * Default scrape options used when no overrides are provided.
 */
export const DEFAULT_SCRAPE_OPTIONS: Required<ScrapeOptions> = {
  maxResults: 10,
  timeout: 10000,
  delayBetweenRequests: 1500,
  maxContactsPerCompany: 3,
  maxNewsPerCompany: 5,
  searchProvider: "both",
};

/**
 * Information extracted from a company's website.
 */
export interface ExtractedWebsiteInfo {
  title?: string;
  description?: string;
  emails: string[];
  socialLinks: SocialLinks;
  technologies?: string[];
  location?: string;
  employeeCount?: number;
}

/**
 * Social media links extracted from a webpage.
 */
export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
}

/**
 * Result summary returned by scrape jobs for tracking purposes.
 */
export interface ScrapeJobResult {
  companiesFound?: number;
  companiesCreated?: number;
  contactsFound?: number;
  contactsCreated?: number;
  newsItemsFound?: number;
  newsItemsCreated?: number;
  errors?: string[];
  queries?: string[];
}

// =============================================================================
// Future API integration types
// =============================================================================
// When paid APIs are integrated, add provider-specific response types here.
// Examples:
//   - ClearbitCompanyResponse
//   - HunterEmailResponse
//   - ApolloContactResponse
//   - ZoomInfoEnrichmentResponse
// =============================================================================
