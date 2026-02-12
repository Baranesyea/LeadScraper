import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const body = await request.json();

    const sequence = await db.emailSequence.findUnique({
      where: { id: sequenceId },
      include: {
        steps: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    if (!sequence) {
      return errorResponse("Sequence not found", 404);
    }

    if (!body.contactIds || !Array.isArray(body.contactIds) || body.contactIds.length === 0) {
      return errorResponse("contactIds array is required and must not be empty", 400);
    }

    // Verify all contacts exist
    const contacts = await db.contact.findMany({
      where: { id: { in: body.contactIds } },
      select: { id: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundIds = new Set(contacts.map((c: any) => c.id));
    const missingIds = body.contactIds.filter(
      (id: string) => !foundIds.has(id)
    );
    if (missingIds.length > 0) {
      return errorResponse(
        `Contacts not found: ${missingIds.join(", ")}`,
        404
      );
    }

    // Check for already-enrolled contacts
    const existingEnrollments = await db.sequenceEnrollment.findMany({
      where: {
        sequenceId,
        contactId: { in: body.contactIds },
      },
      select: { contactId: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alreadyEnrolled = new Set(
      existingEnrollments.map((e: any) => e.contactId)
    );
    const newContactIds = body.contactIds.filter(
      (id: string) => !alreadyEnrolled.has(id)
    );

    if (newContactIds.length === 0) {
      return NextResponse.json({
        success: true,
        enrolled: 0,
        skipped: body.contactIds.length,
        message: "All contacts are already enrolled in this sequence",
      });
    }

    // Calculate initial nextSendAt (now + first step delay)
    const firstStepDelay = sequence.steps[0]?.delayDays ?? 0;
    const nextSendAt = new Date();
    nextSendAt.setDate(nextSendAt.getDate() + firstStepDelay);

    // Create enrollments
    const enrollments = await Promise.all(
      newContactIds.map((contactId: string) =>
        db.sequenceEnrollment.create({
          data: {
            sequenceId,
            contactId,
            currentStep: 0,
            status: "active",
            nextSendAt,
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        enrolled: enrollments.length,
        skipped: alreadyEnrolled.size,
        enrollments,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to enroll contacts:", error);
    return errorResponse("Failed to enroll contacts in sequence");
  }
}
