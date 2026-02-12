import { NextRequest, NextResponse } from "next/server";
import { processOpen } from "@/lib/email/tracking";

/**
 * 1x1 transparent GIF (43 bytes).
 *
 * This is the smallest valid GIF87a image. Returning it in response to the
 * tracking pixel request ensures email clients display nothing visible while
 * still firing the HTTP request we use to detect opens.
 */
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

/**
 * GET /api/track/open?id=<trackingId>
 *
 * Called automatically when the recipient's email client loads the 1x1
 * tracking pixel embedded in the email body.
 *
 * - Records the open event in the database.
 * - Returns a 1x1 transparent GIF with aggressive no-cache headers so
 *   subsequent loads also trigger a request (allowing us to count re-opens
 *   if desired).
 */
export async function GET(request: NextRequest) {
  const trackingId = request.nextUrl.searchParams.get("id");

  if (trackingId) {
    // Fire-and-forget: we don't want the pixel response to be delayed by DB
    // writes, but in a serverless environment we need to await to ensure the
    // work completes before the function is torn down.
    try {
      await processOpen(trackingId);
    } catch (error) {
      // Never fail the pixel response -- always return the image.
      console.error("[track/open] Error processing open:", error);
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
