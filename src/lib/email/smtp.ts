import { db } from "@/lib/db";
import { writeFileSync, readFileSync, existsSync } from "fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  /** Optional tracking pixel HTML to append to the body. */
  trackingPixel?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SmtpSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

// ---------------------------------------------------------------------------
// Settings loader
// ---------------------------------------------------------------------------

/**
 * Load SMTP settings from the database Settings row.
 * Falls back to sensible defaults when the row doesn't exist yet.
 */
async function loadSmtpSettings(): Promise<SmtpSettings> {
  const settings = await db.settings.findUnique({ where: { id: "default" } });
  return {
    smtpHost: settings?.smtpHost ?? "",
    smtpPort: settings?.smtpPort ?? 587,
    smtpUser: settings?.smtpUser ?? "",
    smtpPass: settings?.smtpPass ?? "",
    fromEmail: settings?.fromEmail ?? "",
    fromName: settings?.fromName ?? "",
  };
}

// ---------------------------------------------------------------------------
// Transport creation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------
// REPLACE WITH REAL SMTP
//
// When you are ready to send real emails, install nodemailer:
//
//   pnpm add nodemailer
//   pnpm add -D @types/nodemailer
//
// Then uncomment the block below and delete the mock transport.
//
// ```ts
// import nodemailer from "nodemailer";
//
// export async function createTransport() {
//   const cfg = await loadSmtpSettings();
//   return nodemailer.createTransport({
//     host: cfg.smtpHost,
//     port: cfg.smtpPort,
//     secure: cfg.smtpPort === 465,   // true for 465, false for 587/25
//     auth: {
//       user: cfg.smtpUser,
//       pass: cfg.smtpPass,
//     },
//     // --- Provider-specific notes ---
//     // Gmail:      host "smtp.gmail.com", port 587, use an App Password
//     // Outlook:    host "smtp-mail.outlook.com", port 587
//     // SendGrid:   host "smtp.sendgrid.net", port 587, user "apikey", pass = API key
//     // Amazon SES: host "email-smtp.<region>.amazonaws.com", port 587
//     // Mailgun:    host "smtp.mailgun.org", port 587
//   });
// }
// ```
// ---------------------------------------------------------------

/**
 * Create an SMTP transport handle.
 *
 * Currently returns a **mock transport** that logs emails to the console and
 * persists them to `/tmp/sent-emails.json` for local debugging.
 *
 * Replace with the real nodemailer transport above for production use.
 */
export async function createTransport() {
  const cfg = await loadSmtpSettings();

  // Return an object that mimics the nodemailer transport API surface.
  return {
    _config: cfg,

    /** Send a single email through the mock transport. */
    async sendMail(options: MailOptions): Promise<SendResult> {
      const messageId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const record = {
        messageId,
        to: options.to,
        from: options.from,
        subject: options.subject,
        htmlLength: options.html.length,
        hasTrackingPixel: !!options.trackingPixel,
        sentAt: new Date().toISOString(),
      };

      console.log("[smtp:mock] Email sent:", JSON.stringify(record, null, 2));

      // Persist to a local JSON file so developers can inspect sent emails.
      persistToDebugFile(record);

      return { success: true, messageId };
    },

    /** Test the SMTP connection. */
    async verify(): Promise<boolean> {
      if (!cfg.smtpHost) {
        console.warn(
          "[smtp:mock] No SMTP host configured. Running in mock mode.",
        );
        return true; // Mock always "succeeds"
      }
      // In real mode, `nodemailer.createTransport(...).verify()` goes here.
      return true;
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an email through the configured SMTP transport.
 *
 * Appends the tracking pixel to the HTML body (if provided) and delegates to
 * the transport layer.
 *
 * @param options - The mail options (to, from, subject, html, trackingPixel).
 * @returns A result indicating success or failure.
 */
export async function sendMail(options: MailOptions): Promise<SendResult> {
  try {
    const transport = await createTransport();

    // Inject the tracking pixel just before </body> if present, or append it.
    let finalHtml = options.html;
    if (options.trackingPixel) {
      if (finalHtml.includes("</body>")) {
        finalHtml = finalHtml.replace(
          "</body>",
          `${options.trackingPixel}</body>`,
        );
      } else {
        finalHtml += options.trackingPixel;
      }
    }

    return transport.sendMail({ ...options, html: finalHtml });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown SMTP error";
    console.error("[smtp] sendMail error:", message);
    return { success: false, error: message };
  }
}

/**
 * Test the SMTP connection using the currently saved settings.
 *
 * @returns `{ success: true }` if the connection is good, or
 *          `{ success: false, error: "..." }` with the failure reason.
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const transport = await createTransport();
    const ok = await transport.verify();
    return ok
      ? { success: true }
      : { success: false, error: "SMTP verification failed" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown connection error";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Debug file helper
// ---------------------------------------------------------------------------

const DEBUG_FILE = "/tmp/sent-emails.json";

/**
 * Append an email record to the local debug JSON file.
 * This is only used by the mock transport for development inspection.
 */
function persistToDebugFile(record: Record<string, unknown>): void {
  try {
    let existing: Record<string, unknown>[] = [];
    if (existsSync(DEBUG_FILE)) {
      const raw = readFileSync(DEBUG_FILE, "utf-8");
      existing = JSON.parse(raw);
    }
    existing.push(record);
    writeFileSync(DEBUG_FILE, JSON.stringify(existing, null, 2), "utf-8");
  } catch {
    // Non-critical: debug persistence failure should not break email sending.
    console.warn("[smtp:mock] Could not write debug file:", DEBUG_FILE);
  }
}
