import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await db.company.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: { createdAt: "desc" },
        },
        news: {
          orderBy: { createdAt: "desc" },
        },
        matchedIcp: {
          select: { id: true, name: true },
        },
      },
    });

    if (!company) {
      return errorResponse("Company not found", 404);
    }

    // Parse technologies JSON field
    const parsed = {
      ...company,
      technologies:
        typeof company.technologies === "string"
          ? JSON.parse(company.technologies)
          : company.technologies,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to get company:", error);
    return errorResponse("Failed to get company");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.company.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Company not found", 404);
    }

    // Stringify technologies if it's an array
    if (Array.isArray(body.technologies)) {
      body.technologies = JSON.stringify(body.technologies);
    }

    const company = await db.company.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Failed to update company:", error);
    return errorResponse("Failed to update company");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.company.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Company not found", 404);
    }

    await db.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete company:", error);
    return errorResponse("Failed to delete company");
  }
}
