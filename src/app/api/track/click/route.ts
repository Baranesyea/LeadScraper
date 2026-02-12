import { NextRequest, NextResponse } from "next/server";
import { processClick } from "@/lib/email/tracking";

/**
 * GET /api/track/click?id=<trackingId>&url=<destinationUrl>
 *
 * Called when the recipient clicks a tracked link in an email. The link URLs
 * are rewritten by `generateClickTracker()` to route through this endpoint.
 *
 * Workflow:
 *   1. Extract the tracking ID and destination URL from query parameters.
 *   2. Record the click event in the database.
 *   3. Redirect the user to the original destination URL.
 *
 * If the destination URL is missing or invalid, redirects to the app root.
 */
export async function GET(request: NextRequest) {
  const trackingId = request.nextUrl.searchParams.get("id");
  const destinationUrl = request.nextUrl.searchParams.get("url");

  // Record the click if we have valid parameters.
  if (trackingId && destinationUrl) {
    try {
      await processClick(trackingId, destinationUrl);
    } catch (error) {
      // Never block the redirect -- the user experience takes priority.
      console.error("[track/click] Error processing click:", error);
    }
  }

  // Validate the destination URL to prevent open-redirect vulnerabilities.
  // Only allow http(s) URLs.
  let safeUrl = "/";
  if (destinationUrl) {
    try {
      const parsed = new URL(destinationUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        safeUrl = parsed.toString();
      }
    } catch {
      // Invalid URL: fall through to default redirect.
      console.warn("[track/click] Invalid destination URL:", destinationUrl);
    }
  }

  return NextResponse.redirect(safeUrl, { status: 302 });
}
