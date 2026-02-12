import { db } from "@/lib/db";
import { replaceMergeVariables } from "./merge-variables";
import { sendMail } from "./smtp";
import { generateTrackingId, generateTrackingPixel } from "./tracking";
import { scheduleSequenceStep } from "./scheduler";

// ---------------------------------------------------------------------------
// Daily send limit helpers
// ---------------------------------------------------------------------------

/**
 * Return the number of emails sent today (status = "sent", "opened", or
 * "replied" with a `sentAt` timestamp in the current UTC day).
 */
export async function getDailySendCount(): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const count = await db.email.count({
    where: {
      sentAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      status: { in: ["sent", "opened", "replied"] },
    },
  });

  return count;
}

/**
 * Check whether the daily send limit has been reached.
 *
 * @returns `true` if more emails can be sent today, `false` if the limit has
 *          been hit.
 */
export async function canSendMore(): Promise<boolean> {
  const settings = await db.settings.findUnique({ where: { id: "default" } });
  const limit = settings?.dailySendLimit ?? 50;
  const sent = await getDailySendCount();
  return sent < limit;
}

// ---------------------------------------------------------------------------
// Send a single email
// ---------------------------------------------------------------------------

/**
 * Send a single email by its database ID.
 *
 * Workflow:
 *   1. Load the Email record with associated Contact and Company.
 *   2. Replace merge variables in the subject and body.
 *   3. Generate a tracking ID and tracking pixel for open tracking.
 *   4. Send the email via SMTP.
 *   5. Update the Email record: status -> "sent", set sentAt, persist trackingId.
 *
 * @param emailId - The ID of the Email to send.
 * @throws If the email or contact is not found, or if SMTP fails.
 */
export async function sendEmail(emailId: string): Promise<void> {
  // 1. Load email with contact + company context.
  const email = await db.email.findUnique({
    where: { id: emailId },
    include: {
      contact: {
        include: { company: true },
      },
    },
  });

  if (!email) {
    throw new Error(`Email not found: ${emailId}`);
  }

  if (!email.contact) {
    throw new Error(`Contact not found for email: ${emailId}`);
  }

  const contact = email.contact;
  const recipientAddress = contact.workEmail || contact.personalEmail;
  if (!recipientAddress) {
    throw new Error(
      `No email address available for contact ${contact.id} (${contact.fullName})`,
    );
  }

  // Check daily limit before sending.
  const allowed = await canSendMore();
  if (!allowed) {
    throw new Error("Daily send limit reached. Try again tomorrow.");
  }

  // 2. Replace merge variables in subject and body.
  const resolvedSubject = await replaceMergeVariables(
    email.subject,
    contact,
  );
  const resolvedBody = await replaceMergeVariables(
    email.body,
    contact,
  );

  // 3. Generate tracking assets.
  const trackingId = email.trackingId || generateTrackingId();
  const trackingPixelHtml = generateTrackingPixel(trackingId);

  // 4. Load sender settings.
  const settings = await db.settings.findUnique({ where: { id: "default" } });
  const fromName = settings?.fromName || "LeadScraper";
  const fromEmail = settings?.fromEmail || "noreply@example.com";
  const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  // 5. Send via SMTP.
  const result = await sendMail({
    to: recipientAddress,
    from: fromAddress,
    subject: resolvedSubject,
    html: resolvedBody,
    trackingPixel: trackingPixelHtml,
  });

  if (!result.success) {
    throw new Error(`SMTP send failed: ${result.error}`);
  }

  // 6. Update the email record in the database.
  await db.email.update({
    where: { id: emailId },
    data: {
      status: "sent",
      sentAt: new Date(),
      trackingId,
    },
  });

  console.log(
    `[email] Sent email ${emailId} to ${recipientAddress} ` +
      `(tracking: ${trackingId})`,
  );
}

// ---------------------------------------------------------------------------
// Process all active sequences
// ---------------------------------------------------------------------------

/**
 * Process all active email sequences.
 *
 * For each active sequence, iterates over enrolled contacts to determine if
 * it is time to send the next step:
 *   - If `nextSendAt` is null or in the past and the enrollment is still
 *     active, schedule + send the next step.
 *   - Skips contacts whose enrollment is paused, completed, or bounced.
 *   - Respects the daily send limit across all sequences.
 *
 * This function is intended to be called periodically (cron / scheduled route).
 *
 * @returns The total number of sequence emails that were sent or scheduled.
 */
export async function processSequences(): Promise<number> {
  const now = new Date();

  // Find all active sequences with their enrollments.
  const activeSequences = await db.emailSequence.findMany({
    where: { status: "active" },
    include: {
      steps: { orderBy: { order: "asc" } },
      enrolledContacts: {
        where: {
          status: "active",
          OR: [
            { nextSendAt: null },
            { nextSendAt: { lte: now } },
          ],
        },
      },
    },
  });

  if (activeSequences.length === 0) {
    console.log("[email] No active sequences to process.");
    return 0;
  }

  let processed = 0;

  for (const sequence of activeSequences) {
    console.log(
      `[email] Processing sequence "${sequence.name}" ` +
        `(${sequence.enrolledContacts.length} due enrollment(s))`,
    );

    for (const enrollment of sequence.enrolledContacts) {
      // Check daily limit before each send.
      const allowed = await canSendMore();
      if (!allowed) {
        console.warn("[email] Daily send limit reached during sequence processing.");
        return processed;
      }

      const nextStep = sequence.steps[enrollment.currentStep];

      if (!nextStep) {
        // No more steps; mark enrollment as completed.
        await db.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "completed" },
        });
        continue;
      }

      try {
        // Create an email from the step template.
        const email = await db.email.create({
          data: {
            contactId: enrollment.contactId,
            sequenceId: sequence.id,
            sequenceStep: nextStep.order,
            subject: nextStep.subject,
            body: nextStep.body,
            status: "draft",
          },
        });

        // Send it immediately.
        await sendEmail(email.id);

        // Advance the enrollment to the next step.
        const nextStepIndex = enrollment.currentStep + 1;
        const followingStep = sequence.steps[nextStepIndex];

        if (followingStep) {
          // Schedule the next step based on its delayDays.
          const nextSendAt = new Date();
          nextSendAt.setDate(nextSendAt.getDate() + followingStep.delayDays);

          await db.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: {
              currentStep: nextStepIndex,
              nextSendAt,
            },
          });
        } else {
          // This was the last step; mark complete.
          await db.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: {
              currentStep: nextStepIndex,
              status: "completed",
            },
          });
        }

        processed++;
      } catch (error) {
        console.error(
          `[email] Failed to process enrollment ${enrollment.id}:`,
          error,
        );
        // Continue to next enrollment; don't let one failure block the rest.
      }
    }
  }

  console.log(`[email] Processed ${processed} sequence email(s) total.`);
  return processed;
}

// ---------------------------------------------------------------------------
// Re-exports for convenient single-import usage
// ---------------------------------------------------------------------------

export { replaceMergeVariables, extractVariables, previewEmail } from "./merge-variables";
export { sendMail, testConnection } from "./smtp";
export {
  generateTrackingId,
  generateTrackingPixel,
  generateClickTracker,
  processOpen,
  processClick,
} from "./tracking";
export {
  scheduleEmail,
  processScheduledEmails,
  scheduleSequenceStep,
} from "./scheduler";
export {
  generatePersonalizedEmail,
  generateFollowUp,
  suggestSubjectLines,
} from "./ai-writer";
