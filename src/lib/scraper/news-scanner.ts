// =============================================================================
// News & Articles Scanner
// =============================================================================
// Searches the web for recent news articles and press mentions about companies
// and contacts. This data is used for email personalization (referencing a
// recent news item makes outreach more relevant).
//
// Strategy:
// - Search Google News-style queries for recent company mentions
// - Parse search results into structured news items
// - Save to the database for use in email templates
//
// Future enhancements - plug in paid news APIs:
//   - NewsAPI.org (https://newsapi.org) - 100k+ news sources
//   - Google News API / SERP API - structured news results
//   - Bing News Search API - Microsoft's news search
//   - Diffbot Article API - extract structured article data from URLs
//   - Feedly / Meltwater - enterprise news monitoring
// =============================================================================

import { db } from "@/lib/db";
import { search, sleep } from "./search";
import type { ScrapedNewsItem, ScrapedArticle, ScrapeOptions, ScrapeJobResult } from "./types";
import { DEFAULT_SCRAPE_OPTIONS } from "./types";

// =============================================================================
// News Parsing
// =============================================================================

/**
 * Parse a search result into a structured news item.
 *
 * Extracts:
 * - Title (cleaned up from the search result title)
 * - Source (domain name of the news source)
 * - URL
 * - Published date (if found in snippet)
 * - Snippet (summary text)
 *
 * @param title - Search result title
 * @param url - Search result URL
 * @param snippet - Search result snippet
 * @returns Structured news item
 */
function parseNewsItem(
  title: string,
  url: string,
  snippet: string
): ScrapedNewsItem {
  // Extract source name from domain
  let source = "";
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    // Convert domain to a readable source name
    // e.g., "techcrunch.com" -> "TechCrunch", "reuters.com" -> "Reuters"
    source = domain.split(".")[0];
    // Capitalize first letter
    source = source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    source = "Unknown";
  }

  // Try to extract a published date from the snippet
  // Common patterns: "Jan 15, 2024", "2024-01-15", "3 days ago", "January 15, 2024"
  let publishedAt = "";

  const datePatterns = [
    // "Jan 15, 2024" or "January 15, 2024"
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
    // "2024-01-15"
    /\b(\d{4}-\d{2}-\d{2})\b/,
    // "01/15/2024"
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
    // "15 Jan 2024"
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
  ];

  for (const pattern of datePatterns) {
    const dateMatch = snippet.match(pattern) || title.match(pattern);
    if (dateMatch) {
      publishedAt = dateMatch[1];
      break;
    }
  }

  // Clean up the title (remove source name suffixes)
  const cleanTitle = title
    .replace(/\s*[-–|]\s*(?:TechCrunch|Reuters|Bloomberg|Forbes|CNBC|VentureBeat|The Verge|Wired|Ars Technica|Business Insider|WSJ|NYT).*$/i, "")
    .replace(/\s*\.\.\.$/, "")
    .trim();

  return {
    title: cleanTitle || title,
    source,
    url,
    publishedAt,
    snippet: snippet.trim(),
  };
}

/**
 * Filter news items to remove duplicates and low-quality results.
 */
function filterNewsItems(items: ScrapedNewsItem[]): ScrapedNewsItem[] {
  const seen = new Set<string>();
  const filtered: ScrapedNewsItem[] = [];

  // Domains that typically don't have relevant company news
  const skipDomains = [
    "wikipedia.org",
    "youtube.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "pinterest.com",
    "reddit.com",
    "quora.com",
  ];

  for (const item of items) {
    // Skip duplicates (by normalized title)
    const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(normalizedTitle)) continue;
    seen.add(normalizedTitle);

    // Skip items from non-news domains
    try {
      const domain = new URL(item.url).hostname;
      if (skipDomains.some((d) => domain.includes(d))) continue;
    } catch {
      continue;
    }

    // Skip items with very short titles (likely not real articles)
    if (item.title.length < 15) continue;

    filtered.push(item);
  }

  return filtered;
}

// =============================================================================
// Company News Scanner
// =============================================================================

/**
 * Search for recent news about a company.
 *
 * Searches multiple query patterns:
 * 1. "Company Name" news - general news search
 * 2. "Company Name" announcement - press releases
 * 3. "Company Name" funding/launch/partnership - specific events
 *
 * @param companyId - Database ID of the company
 * @param options - Scrape options
 * @returns Summary of the scan job
 */
export async function scanCompanyNews(
  companyId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  const result: ScrapeJobResult = {
    newsItemsFound: 0,
    newsItemsCreated: 0,
    errors: [],
  };

  try {
    // --- Load company from database ---
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { news: true },
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    console.log(`[NewsScanner] Scanning news for "${company.name}"`);

    // Build news search queries
    const queries = [
      `"${company.name}" news`,
      `"${company.name}" announcement`,
      `"${company.name}" funding OR launch OR partnership OR acquisition`,
    ];

    // If company has a known industry, add an industry-specific query
    if (company.industry) {
      queries.push(`"${company.name}" ${company.industry} news`);
    }

    const allNewsItems: ScrapedNewsItem[] = [];

    // Execute searches
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      try {
        console.log(
          `[NewsScanner] Searching (${i + 1}/${queries.length}): "${query}"`
        );

        const searchResults = await search(query, {
          maxResults: opts.maxNewsPerCompany || 5,
          timeout: opts.timeout,
          searchProvider: opts.searchProvider,
        });

        for (const searchResult of searchResults) {
          const newsItem = parseNewsItem(
            searchResult.title,
            searchResult.url,
            searchResult.snippet
          );
          allNewsItems.push(newsItem);
        }
      } catch (error) {
        const errorMsg = `News search "${query}" failed: ${error instanceof Error ? error.message : error}`;
        console.log(`[NewsScanner] ${errorMsg}`);
        result.errors!.push(errorMsg);
      }

      // Delay between queries
      if (i < queries.length - 1) {
        await sleep(opts.delayBetweenRequests);
      }
    }

    // Filter and deduplicate
    const filteredNews = filterNewsItems(allNewsItems);
    result.newsItemsFound = filteredNews.length;

    console.log(
      `[NewsScanner] Found ${filteredNews.length} news items for "${company.name}"`
    );

    // Get existing news URLs to avoid duplicates in database
    const existingUrls = new Set(company.news.map((n) => n.url));

    // Save new news items (up to maxNewsPerCompany)
    const maxToSave = opts.maxNewsPerCompany || 5;
    let savedCount = 0;

    for (const newsItem of filteredNews) {
      if (savedCount >= maxToSave) break;
      if (existingUrls.has(newsItem.url)) continue;

      try {
        await db.companyNews.create({
          data: {
            companyId: company.id,
            title: newsItem.title,
            source: newsItem.source,
            url: newsItem.url,
            publishedAt: newsItem.publishedAt,
            snippet: newsItem.snippet,
          },
        });

        savedCount++;
        console.log(`[NewsScanner] Saved: "${newsItem.title}" (${newsItem.source})`);
      } catch (error) {
        const errorMsg = `Failed to save news "${newsItem.title}": ${error instanceof Error ? error.message : error}`;
        console.log(`[NewsScanner] ${errorMsg}`);
        result.errors!.push(errorMsg);
      }
    }

    result.newsItemsCreated = savedCount;
    console.log(
      `[NewsScanner] Complete for "${company.name}". Found: ${result.newsItemsFound}, Saved: ${result.newsItemsCreated}`
    );
  } catch (error) {
    const errorMsg = `News scan failed: ${error instanceof Error ? error.message : error}`;
    console.log(`[NewsScanner] ${errorMsg}`);
    result.errors!.push(errorMsg);
  }

  return result;
}

// =============================================================================
// Contact Article Scanner
// =============================================================================

/**
 * Search for articles, talks, or mentions of a specific contact.
 *
 * This is useful for email personalization - referencing a recent talk,
 * blog post, or interview makes cold outreach more personal and effective.
 *
 * @param contactId - Database ID of the contact
 * @param options - Scrape options
 * @returns Summary of the scan job
 */
export async function scanContactArticles(
  contactId: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeJobResult> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  const result: ScrapeJobResult = {
    newsItemsFound: 0,
    newsItemsCreated: 0,
    errors: [],
  };

  try {
    // --- Load contact from database ---
    const contact = await db.contact.findUnique({
      where: { id: contactId },
      include: {
        company: true,
        articles: true,
      },
    });

    if (!contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }

    console.log(
      `[NewsScanner] Scanning articles for "${contact.fullName}" at "${contact.company.name}"`
    );

    // Build search queries for the contact
    const queries = [
      `"${contact.fullName}" "${contact.company.name}"`,
      `"${contact.fullName}" ${contact.title ? contact.title : ""} interview OR talk OR article`,
      `"${contact.fullName}" blog OR podcast OR conference`,
    ];

    const allArticles: ScrapedArticle[] = [];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();

      try {
        console.log(
          `[NewsScanner] Contact search (${i + 1}/${queries.length}): "${query}"`
        );

        const searchResults = await search(query, {
          maxResults: 5,
          timeout: opts.timeout,
          searchProvider: opts.searchProvider,
        });

        for (const searchResult of searchResults) {
          // Extract source from domain
          let source = "";
          try {
            const domain = new URL(searchResult.url).hostname.replace(
              /^www\./,
              ""
            );
            source =
              domain.split(".")[0].charAt(0).toUpperCase() +
              domain.split(".")[0].slice(1);
          } catch {
            source = "Unknown";
          }

          // Try to find a date in the snippet
          let publishedAt = "";
          const dateMatch = searchResult.snippet.match(
            /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i
          );
          if (dateMatch) {
            publishedAt = dateMatch[1];
          }

          allArticles.push({
            title: searchResult.title,
            source,
            url: searchResult.url,
            publishedAt,
            snippet: searchResult.snippet,
          });
        }
      } catch (error) {
        result.errors!.push(
          `Article search failed: ${error instanceof Error ? error.message : error}`
        );
      }

      if (i < queries.length - 1) {
        await sleep(opts.delayBetweenRequests);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    // Filter out non-article domains
    const skipDomains = [
      "linkedin.com",
      "facebook.com",
      "twitter.com",
      "instagram.com",
      "youtube.com",
      "google.com",
    ];

    const filteredArticles = uniqueArticles.filter((a) => {
      try {
        const domain = new URL(a.url).hostname;
        return !skipDomains.some((d) => domain.includes(d));
      } catch {
        return false;
      }
    });

    result.newsItemsFound = filteredArticles.length;

    // Get existing article URLs
    const existingUrls = new Set(contact.articles.map((a) => a.url));

    // Save new articles (up to 5)
    let savedCount = 0;
    for (const article of filteredArticles.slice(0, 5)) {
      if (existingUrls.has(article.url)) continue;

      try {
        await db.contactArticle.create({
          data: {
            contactId: contact.id,
            title: article.title,
            source: article.source,
            url: article.url,
            publishedAt: article.publishedAt || "",
            snippet: article.snippet,
          },
        });

        savedCount++;
        console.log(
          `[NewsScanner] Saved article for "${contact.fullName}": "${article.title}"`
        );
      } catch (error) {
        result.errors!.push(
          `Failed to save article: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    result.newsItemsCreated = savedCount;
    console.log(
      `[NewsScanner] Complete for "${contact.fullName}". Found: ${result.newsItemsFound}, Saved: ${result.newsItemsCreated}`
    );
  } catch (error) {
    const errorMsg = `Article scan failed: ${error instanceof Error ? error.message : error}`;
    console.log(`[NewsScanner] ${errorMsg}`);
    result.errors!.push(errorMsg);
  }

  return result;
}
