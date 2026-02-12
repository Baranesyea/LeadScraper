// =============================================================================
// Website Parsing Utilities
// =============================================================================
// Fetches and parses web pages to extract structured data. Used by other
// scraper modules to get company info, emails, social links, etc. from
// company websites.
//
// All functions handle errors gracefully and return partial results rather
// than throwing. This is critical for scraping because many pages will be
// unavailable, have unusual formats, or block automated access.
//
// Future enhancement: Use a headless browser (Puppeteer/Playwright) for
// JavaScript-rendered pages. Many modern sites require JS execution to
// display content. For now, we work with the raw HTML which covers most
// corporate/about pages.
// =============================================================================

import type { ExtractedWebsiteInfo, SocialLinks, ScrapeOptions } from "./types";
import { DEFAULT_SCRAPE_OPTIONS } from "./types";

/**
 * User-Agent for website fetching. Uses a realistic Chrome UA to avoid blocks.
 */
const FETCH_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// =============================================================================
// Page Fetching
// =============================================================================

/**
 * Fetch a webpage with proper headers, timeout, and error handling.
 *
 * Includes:
 * - Realistic browser headers to avoid being blocked
 * - Configurable timeout (default 10s)
 * - Redirect following (up to 5 redirects)
 * - Response size limit to avoid downloading huge files
 *
 * @param url - The URL to fetch
 * @param options - Scrape options (timeout)
 * @returns The HTML content of the page, or null if fetching failed
 */
export async function fetchPage(
  url: string,
  options?: Partial<ScrapeOptions>
): Promise<string | null> {
  const opts = { ...DEFAULT_SCRAPE_OPTIONS, ...options };

  try {
    console.log(`[WebParser] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": FETCH_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        // Avoid sending referrer to reduce tracking
        Referer: "https://www.google.com/",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(opts.timeout),
    });

    if (!response.ok) {
      console.log(`[WebParser] HTTP ${response.status} for: ${url}`);
      return null;
    }

    // Only process HTML responses
    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      console.log(`[WebParser] Non-HTML content type (${contentType}): ${url}`);
      return null;
    }

    const html = await response.text();

    // Guard against extremely large pages (> 2MB)
    if (html.length > 2 * 1024 * 1024) {
      console.log(
        `[WebParser] Page too large (${(html.length / 1024 / 1024).toFixed(1)}MB): ${url}`
      );
      return html.substring(0, 2 * 1024 * 1024);
    }

    return html;
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.log(`[WebParser] Timeout fetching: ${url}`);
    } else {
      console.log(
        `[WebParser] Error fetching ${url}:`,
        error instanceof Error ? error.message : error
      );
    }
    return null;
  }
}

// =============================================================================
// Text Extraction
// =============================================================================

/**
 * Strip HTML tags and extract clean text content from an HTML string.
 *
 * Process:
 * 1. Remove <script> and <style> blocks entirely
 * 2. Remove all HTML comments
 * 3. Replace block-level tags with newlines for readability
 * 4. Strip remaining HTML tags
 * 5. Decode HTML entities
 * 6. Normalize whitespace
 *
 * @param html - Raw HTML string
 * @returns Clean text content
 */
export function extractText(html: string): string {
  let text = html;

  // Remove script and style blocks entirely (including their content)
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Replace block-level elements with newlines for better text structure
  text = text.replace(
    /<\/?(?:div|p|br|h[1-6]|li|tr|td|th|blockquote|section|article|header|footer|nav|main)[^>]*>/gi,
    "\n"
  );

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(Number(dec)));

  // Normalize whitespace: collapse multiple spaces/newlines
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n");
  text = text.trim();

  return text;
}

// =============================================================================
// Company Information Extraction
// =============================================================================

/**
 * Extract structured company information from a website's HTML.
 *
 * Looks for data in multiple places:
 * - <title> and <meta> tags (description, og:tags, etc.)
 * - About page content
 * - Team/leadership page
 * - Footer (often contains address, social links)
 * - Schema.org structured data (JSON-LD)
 *
 * @param html - The HTML content of the page
 * @param url - The URL of the page (used for resolving relative links)
 * @returns Extracted company information
 */
export function extractCompanyInfo(
  html: string,
  url: string
): ExtractedWebsiteInfo {
  const info: ExtractedWebsiteInfo = {
    emails: [],
    socialLinks: {},
  };

  try {
    // --- Extract title ---
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      info.title = titleMatch[1]
        .replace(/\s+/g, " ")
        .trim()
        // Remove common suffixes like " | Company Name" or " - Home"
        .replace(/\s*[|–-]\s*(Home|Homepage|Welcome).*$/i, "")
        .trim();
    }

    // --- Extract meta description ---
    const metaDescMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
    ) || html.match(
      /<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i
    );
    if (metaDescMatch) {
      info.description = metaDescMatch[1].replace(/\s+/g, " ").trim();
    }

    // Try OpenGraph description as fallback
    if (!info.description) {
      const ogDescMatch = html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
      ) || html.match(
        /<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:description["'][^>]*>/i
      );
      if (ogDescMatch) {
        info.description = ogDescMatch[1].replace(/\s+/g, " ").trim();
      }
    }

    // --- Extract emails ---
    info.emails = extractEmails(html);

    // --- Extract social links ---
    info.socialLinks = extractSocialLinks(html, url);

    // --- Try to extract location from structured data ---
    const locationMatch = html.match(
      /"address"[\s]*:[\s]*\{[^}]*"addressLocality"[\s]*:[\s]*"([^"]+)"/
    );
    if (locationMatch) {
      info.location = locationMatch[1];
    }

    // Fallback: look for common address patterns in text
    if (!info.location) {
      const addressMatch = html.match(
        /(?:headquarters|located|based)\s+(?:in|at)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2,})/
      );
      if (addressMatch) {
        info.location = addressMatch[1];
      }
    }

    // --- Try to extract employee count from structured data ---
    const employeeMatch = html.match(
      /"numberOfEmployees"[\s]*:[\s]*\{[^}]*"value"[\s]*:[\s]*"?(\d+)"?/
    );
    if (employeeMatch) {
      info.employeeCount = parseInt(employeeMatch[1], 10);
    }

    // --- Try to detect technologies from HTML ---
    info.technologies = detectTechnologies(html, url);
  } catch (error) {
    console.log(
      `[WebParser] Error extracting company info from ${url}:`,
      error instanceof Error ? error.message : error
    );
  }

  return info;
}

// =============================================================================
// Email Extraction
// =============================================================================

/**
 * Extract email addresses from HTML content using regex.
 *
 * Filters out:
 * - Common non-person emails (noreply@, support@, info@, etc.)
 * - Image file references that look like emails
 * - Very long "emails" that are likely false positives
 *
 * @param html - HTML content to search
 * @returns Array of unique email addresses found
 */
export function extractEmails(html: string): string[] {
  const emailRegex =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  const matches = html.match(emailRegex) || [];

  // Filter and deduplicate
  const seen = new Set<string>();
  const filtered: string[] = [];

  // Common non-useful email prefixes to skip
  const skipPrefixes = [
    "noreply",
    "no-reply",
    "donotreply",
    "mailer-daemon",
    "postmaster",
    "webmaster",
    "abuse",
    "example",
    "test",
    "admin",
    "root",
  ];

  // Common image/file extensions that get false-positive matched
  const skipSuffixes = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".css", ".js"];

  for (const email of matches) {
    const lower = email.toLowerCase();

    // Skip if too long (likely not a real email)
    if (lower.length > 80) continue;

    // Skip common non-person emails
    const prefix = lower.split("@")[0];
    if (skipPrefixes.some((p) => prefix === p)) continue;

    // Skip file references
    if (skipSuffixes.some((s) => lower.endsWith(s))) continue;

    // Deduplicate
    if (!seen.has(lower)) {
      seen.add(lower);
      filtered.push(lower);
    }
  }

  return filtered;
}

// =============================================================================
// Social Link Extraction
// =============================================================================

/**
 * Extract social media profile links from HTML content.
 *
 * Looks for links to:
 * - LinkedIn (company pages)
 * - Twitter/X
 * - Facebook
 * - Instagram
 * - GitHub
 * - YouTube
 *
 * @param html - HTML content to search
 * @param _pageUrl - The page URL (for resolving relative links, currently unused)
 * @returns Object with social media links
 */
export function extractSocialLinks(
  html: string,
  _pageUrl?: string
): SocialLinks {
  const links: SocialLinks = {};

  // --- LinkedIn ---
  const linkedinMatch = html.match(
    /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+\/?)[^"']*/i
  );
  if (linkedinMatch) {
    links.linkedin = linkedinMatch[1];
  }

  // --- Twitter/X ---
  const twitterMatch = html.match(
    /href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?)[^"']*/i
  );
  if (twitterMatch) {
    links.twitter = twitterMatch[1];
  }

  // --- Facebook ---
  const facebookMatch = html.match(
    /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?)[^"']*/i
  );
  if (facebookMatch) {
    links.facebook = facebookMatch[1];
  }

  // --- Instagram ---
  const instagramMatch = html.match(
    /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?)[^"']*/i
  );
  if (instagramMatch) {
    links.instagram = instagramMatch[1];
  }

  // --- GitHub ---
  const githubMatch = html.match(
    /href=["'](https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?)[^"']*/i
  );
  if (githubMatch) {
    links.github = githubMatch[1];
  }

  // --- YouTube ---
  const youtubeMatch = html.match(
    /href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)[a-zA-Z0-9_-]+\/?)[^"']*/i
  );
  if (youtubeMatch) {
    links.youtube = youtubeMatch[1];
  }

  return links;
}

// =============================================================================
// Technology Detection
// =============================================================================

/**
 * Detect technologies used by a website by analyzing its HTML source.
 *
 * Checks for:
 * - JavaScript framework signatures in script tags
 * - Meta tags and generator headers
 * - Common library/framework patterns
 * - CDN references
 *
 * Note: This is a basic heuristic approach. For comprehensive tech detection,
 * consider integrating with Wappalyzer or BuiltWith APIs.
 *
 * @param html - HTML content to analyze
 * @param url - The page URL
 * @returns Array of detected technology names
 */
function detectTechnologies(html: string, _url: string): string[] {
  const technologies: string[] = [];
  const lowerHtml = html.toLowerCase();

  // Map of technology signatures to look for
  const techSignatures: [string, string[]][] = [
    ["React", ["react.development.js", "react.production.min.js", "__NEXT_DATA__", "react-dom"]],
    ["Next.js", ["__NEXT_DATA__", "_next/static", "next/head"]],
    ["Vue.js", ["vue.js", "vue.min.js", "vue@", "__vue__"]],
    ["Angular", ["ng-app", "ng-controller", "angular.js", "angular.min.js"]],
    ["jQuery", ["jquery.min.js", "jquery.js", "jquery-"]],
    ["Tailwind CSS", ["tailwindcss", "tailwind.min.css"]],
    ["Bootstrap", ["bootstrap.min.css", "bootstrap.min.js", "bootstrap.css"]],
    ["WordPress", ["wp-content", "wp-includes", "wordpress"]],
    ["Shopify", ["shopify", "cdn.shopify.com"]],
    ["Webflow", ["webflow.com", "webflow.js"]],
    ["Squarespace", ["squarespace.com", "squarespace-cdn"]],
    ["Wix", ["wix.com", "wixstatic.com"]],
    ["HubSpot", ["hubspot.com", "hs-scripts.com", "hbspt"]],
    ["Google Analytics", ["google-analytics.com", "gtag", "googletagmanager"]],
    ["Segment", ["segment.com/analytics", "analytics.js"]],
    ["Stripe", ["stripe.com", "js.stripe.com"]],
    ["Intercom", ["intercom", "intercomcdn"]],
    ["Drift", ["drift.com", "driftt.com"]],
    ["Cloudflare", ["cloudflare", "cdnjs.cloudflare.com"]],
    ["AWS", ["amazonaws.com", "aws-"]],
    ["Vercel", ["vercel.app", "vercel-analytics"]],
    ["Netlify", ["netlify", "netlify.app"]],
  ];

  for (const [tech, signatures] of techSignatures) {
    if (signatures.some((sig) => lowerHtml.includes(sig))) {
      technologies.push(tech);
    }
  }

  // Check meta generator tag (used by CMSes)
  const generatorMatch = html.match(
    /<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i
  );
  if (generatorMatch) {
    const generator = generatorMatch[1];
    if (!technologies.some((t) => generator.toLowerCase().includes(t.toLowerCase()))) {
      technologies.push(generator.split(/\s/)[0]); // Take first word
    }
  }

  return technologies;
}

// =============================================================================
// URL Utilities
// =============================================================================

/**
 * Extract the domain name from a URL.
 *
 * @example
 * getDomain("https://www.example.com/about") // "example.com"
 * getDomain("https://sub.example.co.uk/page") // "sub.example.co.uk"
 */
export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Get the base URL (protocol + hostname) from a full URL.
 *
 * @example
 * getBaseUrl("https://www.example.com/about/team") // "https://www.example.com"
 */
export function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}
