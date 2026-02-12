import { db } from "@/lib/db";
import { sendEmail, canSendMore } from "./index";

// ---------------------------------------------------------------------------
// Schedule a single email
// ---------------------------------------------------------------------------

/**
 * Schedule an email for future sending.
 *
 * Sets the email's `scheduledFor` timestamp and moves its status to
 * "scheduled". The email will be picked up by `processScheduledEmails()` when
 * the time arrives.
 *
 * @param emailId - The ID of the Email record to schedule.
 * @param sendAt  - The date/time at which the email should be sent.
 */
export async function scheduleEmail(
  emailId: string,
  sendAt: Date,
): Promise<void> {
  await db.email.update({
    where: { id: emailId },
    data: {
      scheduledFor: sendAt,
      status: "scheduled",
    },
  });

  console.log(
    `[scheduler] Email ${emailId} scheduled for ${sendAt.toISOString()}`,
  );
}

// ---------------------------------------------------------------------------
// Process all due scheduled emails
// ---------------------------------------------------------------------------

/**
 * Find all emails whose `scheduledFor` timestamp has passed and whose status
 * is still "scheduled", then send each one (respecting the daily send limit).
 *
 * This function is designed to be called periodically (e.g. via a cron job or
 * Next.js route handler invoked by an external scheduler every 1-5 minutes).
 *
 * @returns The number of emails that were successfully sent in this run.
 */
export async function processScheduledEmails(): Promise<number> {
  const now = new Date();

  const dueEmails = await db.email.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
  });

  if (dueEmails.length === 0) {
    return 0;
  }

  console.log(`[scheduler] Found ${dueEmails.length} due email(s)`);

  let sentCount = 0;

  for (const email of dueEmails) {
    // Respect the daily send limit.
    const allowed = await canSendMore();
    if (!allowed) {
      console.warn(
        "[scheduler] Daily send limit reached. Remaining emails will be retried later.",
      );
      break;
    }

    try {
      await sendEmail(email.id);
      sentCount++;
    } catch (error) {
      console.error(`[scheduler] Failed to send email ${email.id}:`, error);
      // Leave the email as "scheduled" so it is retried on the next run.
    }
  }

  console.log(`[scheduler] Sent ${sentCount} / ${dueEmails.length} email(s)`);
  return sentCount;
}

// ---------------------------------------------------------------------------
// Sequence step scheduling
// ---------------------------------------------------------------------------

/**
 * Calculate and schedule the next email in a sequence for a given enrollment.
 *
 * Looks up the enrollment's current step, finds the next step in the sequence,
 * creates an Email draft from the step template, schedules it based on the
 * step's `delayDays`, and advances the enrollment's `nextSendAt`.
 *
 * @param enrollmentId - The ID of the SequenceEnrollment to advance.
 * @returns `true` if a step was scheduled, `false` if the sequence is complete
 *          or the enrollment was not found.
 */
export async function scheduleSequenceStep(
  enrollmentId: string,
): Promise<boolean> {
  const enrollment = await db.sequenceEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      sequence: {
        include: {
          steps: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!enrollment || enrollment.status !== "active") {
    return false;
  }

  const { sequence } = enrollment;
  const nextStepIndex = enrollment.currentStep; // 0-based index into sorted steps
  const nextStep = sequence.steps[nextStepIndex];

  // No more steps -> mark enrollment as completed.
  if (!nextStep) {
    await db.sequenceEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "completed" },
    });
    console.log(
      `[scheduler] Enrollment ${enrollmentId} completed (no more steps)`,
    );
    return false;
  }

  // Calculate the send time: now + delayDays.
  const sendAt = new Date();
  sendAt.setDate(sendAt.getDate() + nextStep.delayDays);

  // Create an email draft from the step template.
  const email = await db.email.create({
    data: {
      contactId: enrollment.contactId,
      sequenceId: sequence.id,
      sequenceStep: nextStep.order,
      subject: nextStep.subject,
      body: nextStep.body,
      status: "scheduled",
      scheduledFor: sendAt,
    },
  });

  // Update the enrollment: advance the step pointer and record nextSendAt.
  await db.sequenceEnrollment.update({
    where: { id: enrollmentId },
    data: {
      currentStep: enrollment.currentStep + 1,
      nextSendAt: sendAt,
    },
  });

  console.log(
    `[scheduler] Scheduled step ${nextStep.order} (email ${email.id}) ` +
      `for enrollment ${enrollmentId} at ${sendAt.toISOString()}`,
  );

  return true;
}
