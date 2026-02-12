import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const email = await db.email.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
        sequence: {
          select: { id: true, name: true },
        },
      },
    });

    if (!email) {
      return errorResponse("Email not found", 404);
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error("Failed to get email:", error);
    return errorResponse("Failed to get email");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.email.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Email not found", 404);
    }

    // Only allow editing draft emails
    if (existing.status !== "draft" && !body.status) {
      return errorResponse("Can only edit draft emails", 400);
    }

    // Convert scheduledFor to Date if provided
    if (body.scheduledFor) {
      body.scheduledFor = new Date(body.scheduledFor);
    }

    const email = await db.email.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(email);
  } catch (error) {
    console.error("Failed to update email:", error);
    return errorResponse("Failed to update email");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.email.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Email not found", 404);
    }

    await db.email.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete email:", error);
    return errorResponse("Failed to delete email");
  }
}
