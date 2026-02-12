import { randomBytes } from "crypto";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Tracking ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique, URL-safe tracking ID.
 * Uses 16 random bytes encoded as hex (32 chars) which gives a collision-proof
 * identifier without any external dependencies.
 */
export function generateTrackingId(): string {
  return randomBytes(16).toString("hex");
}

// ---------------------------------------------------------------------------
// Tracking pixel / click wrapper generation
// ---------------------------------------------------------------------------

/** Base URL for the running application (falls back to localhost in dev). */
function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  );
}

/**
 * Generate a 1x1 transparent-pixel `<img>` tag that fires a GET request to the
 * open-tracking endpoint when the recipient's email client loads it.
 *
 * @param trackingId - The unique tracking ID tied to a specific Email record.
 * @returns An HTML string for the tracking pixel.
 */
export function generateTrackingPixel(trackingId: string): string {
  const url = `${getBaseUrl()}/api/track/open?id=${encodeURIComponent(trackingId)}`;
  return `<img src="${url}" width="1" height="1" alt="" style="display:none;" />`;
}

/**
 * Wrap a URL so that clicks route through our click-tracking endpoint first,
 * then redirect the user to the real destination.
 *
 * @param url        - The original destination URL.
 * @param trackingId - The unique tracking ID tied to a specific Email record.
 * @returns A click-tracked URL string.
 */
export function generateClickTracker(url: string, trackingId: string): string {
  const base = getBaseUrl();
  const params = new URLSearchParams({ id: trackingId, url });
  return `${base}/api/track/click?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Event processors (called by the API route handlers)
// ---------------------------------------------------------------------------

/**
 * Record that an email was opened.
 *
 * - Looks up the Email record by its unique `trackingId`.
 * - Sets `openedAt` (only on first open) and upgrades `status` to "opened"
 *   unless the email has already progressed to "replied".
 *
 * @param trackingId - The tracking ID from the pixel request.
 * @returns `true` if the open was recorded, `false` if the tracking ID was not
 *          found or the email was already in a terminal state.
 */
export async function processOpen(trackingId: string): Promise<boolean> {
  try {
    const email = await db.email.findUnique({
      where: { trackingId },
    });

    if (!email) {
      console.warn(`[tracking] open: unknown trackingId ${trackingId}`);
      return false;
    }

    // Don't downgrade status if the email has already been replied to.
    if (email.status === "replied") {
      return false;
    }

    await db.email.update({
      where: { trackingId },
      data: {
        // Only set openedAt on the first open event.
        openedAt: email.openedAt ?? new Date(),
        status: "opened",
      },
    });

    return true;
  } catch (error) {
    console.error("[tracking] processOpen error:", error);
    return false;
  }
}

/**
 * Record that a link inside an email was clicked.
 *
 * - Marks the email as opened (if not already) since a click implies an open.
 * - In the future this could write to a dedicated `EmailClick` table; for now
 *   it piggy-backs on the open-tracking fields and logs the URL.
 *
 * @param trackingId - The tracking ID from the click request.
 * @param url        - The original destination URL the recipient clicked.
 * @returns `true` if the click was recorded.
 */
export async function processClick(
  trackingId: string,
  url: string,
): Promise<boolean> {
  try {
    const email = await db.email.findUnique({
      where: { trackingId },
    });

    if (!email) {
      console.warn(`[tracking] click: unknown trackingId ${trackingId}`);
      return false;
    }

    // Record an open if we haven't yet (a click implies an open).
    if (!email.openedAt) {
      await db.email.update({
        where: { trackingId },
        data: {
          openedAt: new Date(),
          status: email.status === "replied" ? "replied" : "opened",
        },
      });
    }

    // Log the click. In a production system you would persist this to a
    // dedicated EmailClick model with columns for url, clickedAt, userAgent, etc.
    console.log(
      `[tracking] click recorded: emailId=${email.id} url=${url}`,
    );

    return true;
  } catch (error) {
    console.error("[tracking] processClick error:", error);
    return false;
  }
}
