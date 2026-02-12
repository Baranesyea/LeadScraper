import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        company: true,
        articles: {
          orderBy: { createdAt: "desc" },
        },
        emails: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!contact) {
      return errorResponse("Contact not found", 404);
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Failed to get contact:", error);
    return errorResponse("Failed to get contact");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Contact not found", 404);
    }

    // Update fullName if first or last name changed
    if (body.firstName || body.lastName) {
      const firstName = body.firstName ?? existing.firstName;
      const lastName = body.lastName ?? existing.lastName;
      body.fullName = `${firstName} ${lastName}`;
    }

    const contact = await db.contact.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Failed to update contact:", error);
    return errorResponse("Failed to update contact");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Contact not found", 404);
    }

    await db.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contact:", error);
    return errorResponse("Failed to delete contact");
  }
}
