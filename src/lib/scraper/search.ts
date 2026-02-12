// =============================================================================
// Web Search Utilities
// =============================================================================
// Provides web search functionality using free/public search engines.
// No API keys required. Uses Google and DuckDuckGo HTML endpoints.
//
// IMPORTANT: These methods scrape public search pages. Search engines may
// occasionally block requests or change their HTML structure. The parsers
// are designed to degrade gracefully when this happens.
//
// Future enhancement: Replace with paid search APIs for more reliable results:
//   - SerpAPI (https://serpapi.com) - structured Google results
//   - Bing Web Search API - Microsoft's search API
//   - Google Custom Search JSON API - official Google API
// =============================================================================

import type { SearchResult, ScrapeOptions } from "./types";
import { DEFAULT_SCRAPE_OPTIONS } from "./types";

/**
 * Common User-Agent strings to rotate through.
 * Using realistic browser User-Agents reduces the chance of being blocked.
 */
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

/**
 * Returns a random User-Agent string from the pool.
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Sleep utility to add delays between requests and avoid rate limiting.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decode HTML entities in a string (e.g., &amp; -> &, &#39; -> ', etc.)
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec));
}

/**
 * Strip HTML tags from a string, leaving only text content.
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// =============================================================================
// Google Search
// =============================================================================

/**
 * Search Google by fetching the HTML search results page and parsing it.
 *
 * How it works:
 * 1. Fetches https://www.google.com/search?q=<query> with a browser User-Agent
 * 2. Parses the HTML to find search result blocks
 * 3. Extracts title, URL, and snippet from each result
 *
 * Limitations:
 * - Google may serve CAPTCHAs or block requests from servers
 * - HTML structure may change, breaking the parser
 * - Rate limiting is aggressive; use delays between requests
 *
 * @param query - The search query string
 * @param options - Scrape options (maxResults, timeout)
 * @returns Array of search results
 */
export async function searchGoogle(
  query: string,
  options?: Partial<ScrapeOptions>
): Promise<SearchResult[]> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  const results: SearchResult[] = [];

  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${opts.maxResults}&hl=en`;

    console.log(`[Search:Google] Searching for: "${query}"`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
      },
      signal: AbortSignal.timeout(opts.timeout),
    });

    if (!response.ok) {
      console.log(
        `[Search:Google] HTTP ${response.status} - may be rate limited`
      );
      return results;
    }

    const html = await response.text();

    // --- Strategy 1: Parse standard Google result blocks ---
    // Google wraps each result in a <div class="g"> element.
    // Inside, the <a> tag has the URL, <h3> has the title, and a nested
    // <div> or <span> contains the snippet text.
    const resultBlockRegex =
      /<div class="g"[^>]*>([\s\S]*?)(?=<div class="g"|<div id="foot|$)/gi;
    let blockMatch: RegExpExecArray | null;

    while (
      (blockMatch = resultBlockRegex.exec(html)) !== null &&
      results.length < opts.maxResults
    ) {
      const block = blockMatch[1];

      // Extract URL from the first <a href="..."> that points to an external site
      const urlMatch = block.match(
        /<a\s+href="(https?:\/\/(?!www\.google)[^"]+)"/
      );
      if (!urlMatch) continue;

      // Extract title from <h3> tag
      const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      if (!titleMatch) continue;

      // Extract snippet - look for text in various snippet containers
      const snippetMatch =
        block.match(
          /<div[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>([\s\S]*?)<\/div>/
        ) ||
        block.match(/<span[^>]*class="[^"]*st[^"]*"[^>]*>([\s\S]*?)<\/span>/) ||
        block.match(
          /<div[^>]*data-sncf[^>]*>([\s\S]*?)<\/div>/
        );

      const resultUrl = decodeHtmlEntities(urlMatch[1]);
      const title = decodeHtmlEntities(stripHtmlTags(titleMatch[1]));
      const snippet = snippetMatch
        ? decodeHtmlEntities(stripHtmlTags(snippetMatch[1]))
        : "";

      // Skip Google's own pages and empty results
      if (
        resultUrl.includes("google.com/search") ||
        resultUrl.includes("accounts.google") ||
        !title
      ) {
        continue;
      }

      results.push({ title, url: resultUrl, snippet });
    }

    // --- Strategy 2: Fallback - extract any linked results ---
    // If Strategy 1 found nothing (HTML structure changed), try a broader approach
    if (results.length === 0) {
      console.log(
        "[Search:Google] Primary parser found no results, trying fallback parser"
      );

      const linkRegex =
        /<a\s+href="\/url\?q=(https?:\/\/[^&"]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch: RegExpExecArray | null;

      while (
        (linkMatch = linkRegex.exec(html)) !== null &&
        results.length < opts.maxResults
      ) {
        const linkUrl = decodeURIComponent(decodeHtmlEntities(linkMatch[1]));
        const linkText = decodeHtmlEntities(stripHtmlTags(linkMatch[2]));

        if (
          linkUrl.includes("google.com") ||
          linkUrl.includes("youtube.com/results") ||
          !linkText ||
          linkText.length < 5
        ) {
          continue;
        }

        results.push({
          title: linkText,
          url: linkUrl,
          snippet: "",
        });
      }
    }

    console.log(
      `[Search:Google] Found ${results.length} results for: "${query}"`
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.log(`[Search:Google] Request timed out for: "${query}"`);
    } else {
      console.log(
        `[Search:Google] Error searching for "${query}":`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return results;
}

// =============================================================================
// DuckDuckGo Search
// =============================================================================

/**
 * Search DuckDuckGo using their HTML-only endpoint (more scraper-friendly).
 *
 * How it works:
 * 1. Fetches https://html.duckduckgo.com/html/?q=<query>
 * 2. DuckDuckGo's lite HTML page is simpler to parse than Google's
 * 3. Results are in <div class="result"> blocks with <a class="result__a"> links
 *
 * Advantages over Google:
 * - Less aggressive bot detection
 * - Simpler, more stable HTML structure
 * - No CAPTCHAs
 *
 * Limitations:
 * - Results may be less relevant than Google for some queries
 * - Still subject to occasional blocking
 *
 * @param query - The search query string
 * @param options - Scrape options (maxResults, timeout)
 * @returns Array of search results
 */
export async function searchDuckDuckGo(
  query: string,
  options?: Partial<ScrapeOptions>
): Promise<SearchResult[]> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  const results: SearchResult[] = [];

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    console.log(`[Search:DDG] Searching for: "${query}"`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `q=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(opts.timeout),
    });

    if (!response.ok) {
      console.log(
        `[Search:DDG] HTTP ${response.status} - may be rate limited`
      );
      return results;
    }

    const html = await response.text();

    // --- Parse DuckDuckGo result blocks ---
    // Each result is in a <div class="result ..."> with:
    //   - <a class="result__a" href="...">Title</a>
    //   - <a class="result__snippet" ...>Snippet text</a>
    const resultBlockRegex =
      /<div[^>]*class="[^"]*result\b[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*result\b|$)/gi;
    let blockMatch: RegExpExecArray | null;

    while (
      (blockMatch = resultBlockRegex.exec(html)) !== null &&
      results.length < opts.maxResults
    ) {
      const block = blockMatch[1];

      // Extract URL and title from the result link
      const linkMatch = block.match(
        /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/
      );
      if (!linkMatch) continue;

      // Extract snippet
      const snippetMatch = block.match(
        /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/
      );

      let resultUrl = decodeHtmlEntities(linkMatch[1]);
      const title = decodeHtmlEntities(stripHtmlTags(linkMatch[2]));
      const snippet = snippetMatch
        ? decodeHtmlEntities(stripHtmlTags(snippetMatch[1]))
        : "";

      // DuckDuckGo sometimes wraps URLs in a redirect; extract the actual URL
      if (resultUrl.includes("uddg=")) {
        const uddgMatch = resultUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          resultUrl = decodeURIComponent(uddgMatch[1]);
        }
      }

      // Skip non-http URLs and empty titles
      if (!resultUrl.startsWith("http") || !title) {
        continue;
      }

      results.push({ title, url: resultUrl, snippet });
    }

    // --- Fallback parser: simpler link extraction ---
    if (results.length === 0) {
      console.log(
        "[Search:DDG] Primary parser found no results, trying fallback parser"
      );

      const linkRegex =
        /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch: RegExpExecArray | null;

      while (
        (linkMatch = linkRegex.exec(html)) !== null &&
        results.length < opts.maxResults
      ) {
        let linkUrl = decodeHtmlEntities(linkMatch[1]);
        const linkText = decodeHtmlEntities(stripHtmlTags(linkMatch[2]));

        if (linkUrl.includes("uddg=")) {
          const uddgMatch = linkUrl.match(/uddg=([^&]+)/);
          if (uddgMatch) {
            linkUrl = decodeURIComponent(uddgMatch[1]);
          }
        }

        if (!linkUrl.startsWith("http") || !linkText || linkText.length < 3) {
          continue;
        }

        results.push({ title: linkText, url: linkUrl, snippet: "" });
      }
    }

    console.log(
      `[Search:DDG] Found ${results.length} results for: "${query}"`
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.log(`[Search:DDG] Request timed out for: "${query}"`);
    } else {
      console.log(
        `[Search:DDG] Error searching for "${query}":`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return results;
}

// =============================================================================
// Unified Search
// =============================================================================

/**
 * Perform a web search using the configured provider(s).
 *
 * When searchProvider is 'both' (default):
 * 1. Tries DuckDuckGo first (more reliable for automated queries)
 * 2. Falls back to Google if DuckDuckGo returns no results
 *
 * @param query - The search query string
 * @param options - Scrape options
 * @returns Deduplicated array of search results
 */
export async function search(
  query: string,
  options?: Partial<ScrapeOptions>
): Promise<SearchResult[]> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };

  let results: SearchResult[] = [];

  if (opts.searchProvider === "google") {
    results = await searchGoogle(query, opts);
  } else if (opts.searchProvider === "duckduckgo") {
    results = await searchDuckDuckGo(query, opts);
  } else {
    // 'both' - try DuckDuckGo first, fall back to Google
    results = await searchDuckDuckGo(query, opts);

    if (results.length === 0) {
      console.log("[Search] DuckDuckGo returned no results, trying Google...");
      await sleep(opts.delayBetweenRequests);
      results = await searchGoogle(query, opts);
    }
  }

  // Deduplicate results by URL
  const seen = new Set<string>();
  const deduplicated: SearchResult[] = [];

  for (const result of results) {
    // Normalize URL for deduplication (remove trailing slash, www prefix)
    const normalizedUrl = result.url
      .replace(/\/$/, "")
      .replace(/^https?:\/\/www\./, "https://");

    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      deduplicated.push(result);
    }
  }

  return deduplicated.slice(0, opts.maxResults);
}
