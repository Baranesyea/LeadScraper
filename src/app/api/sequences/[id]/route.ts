import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sequence = await db.emailSequence.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        enrolledContacts: {
          include: {
            // We need contact details for enrolled contacts display
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            steps: true,
            enrolledContacts: true,
            emails: true,
          },
        },
      },
    });

    if (!sequence) {
      return errorResponse("Sequence not found", 404);
    }

    // Fetch contact details for enrolled contacts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrollmentContactIds = sequence.enrolledContacts.map(
      (e: any) => e.contactId
    );
    const contacts = await db.contact.findMany({
      where: { id: { in: enrollmentContactIds } },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        company: {
          select: { id: true, name: true },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contactMap = new Map(contacts.map((c: any) => [c.id, c]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedEnrollments = sequence.enrolledContacts.map((enrollment: any) => ({
      ...enrollment,
      contact: contactMap.get(enrollment.contactId) || null,
    }));

    return NextResponse.json({
      ...sequence,
      enrolledContacts: enrichedEnrollments,
    });
  } catch (error) {
    console.error("Failed to get sequence:", error);
    return errorResponse("Failed to get sequence");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.emailSequence.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Sequence not found", 404);
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.status !== undefined) updateData.status = body.status;

    const sequence = await db.emailSequence.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            steps: true,
            enrolledContacts: true,
          },
        },
      },
    });

    return NextResponse.json(sequence);
  } catch (error) {
    console.error("Failed to update sequence:", error);
    return errorResponse("Failed to update sequence");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.emailSequence.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Sequence not found", 404);
    }

    await db.emailSequence.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete sequence:", error);
    return errorResponse("Failed to delete sequence");
  }
}
