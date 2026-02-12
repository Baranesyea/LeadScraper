import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.company.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Company not found", 404);
    }

    // Placeholder: In the future, this will trigger actual enrichment
    // (scraping additional data, news, contacts, etc.)
    // For now, just update the enrichedAt timestamp.
    const company = await db.company.update({
      where: { id },
      data: {
        enrichedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Enrichment triggered",
      company,
    });
  } catch (error) {
    console.error("Failed to enrich company:", error);
    return errorResponse("Failed to enrich company");
  }
}
