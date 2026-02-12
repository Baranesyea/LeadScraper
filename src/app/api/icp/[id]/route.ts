import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseJsonFields,
  stringifyJsonFields,
  errorResponse,
} from "@/lib/api-helpers";

const JSON_FIELDS = [
  "industries",
  "locations",
  "technologies",
  "fundingStages",
  "keywords",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const icp = await db.icpProfile.findUnique({
      where: { id },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            industry: true,
            location: true,
          },
        },
      },
    });

    if (!icp) {
      return errorResponse("ICP not found", 404);
    }

    return NextResponse.json(parseJsonFields(icp, JSON_FIELDS));
  } catch (error) {
    console.error("Failed to get ICP:", error);
    return errorResponse("Failed to get ICP");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.icpProfile.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("ICP not found", 404);
    }

    const data = stringifyJsonFields(body, JSON_FIELDS);

    const icp = await db.icpProfile.update({
      where: { id },
      data,
    });

    return NextResponse.json(parseJsonFields(icp, JSON_FIELDS));
  } catch (error) {
    console.error("Failed to update ICP:", error);
    return errorResponse("Failed to update ICP");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.icpProfile.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("ICP not found", 404);
    }

    await db.icpProfile.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ICP:", error);
    return errorResponse("Failed to delete ICP");
  }
}
