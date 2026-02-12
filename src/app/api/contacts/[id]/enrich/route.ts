import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Contact not found", 404);
    }

    // Placeholder: In the future, this will trigger actual contact enrichment
    // (finding emails, social profiles, recent articles, etc.)
    // For now, just update the enrichedAt timestamp.
    const contact = await db.contact.update({
      where: { id },
      data: {
        enrichedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contact enrichment triggered",
      contact,
    });
  } catch (error) {
    console.error("Failed to enrich contact:", error);
    return errorResponse("Failed to enrich contact");
  }
}
