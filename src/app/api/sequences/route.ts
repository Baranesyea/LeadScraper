import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const sequences = await db.emailSequence.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            steps: true,
            enrolledContacts: true,
          },
        },
      },
    });

    return NextResponse.json(sequences);
  } catch (error) {
    console.error("Failed to list sequences:", error);
    return errorResponse("Failed to list sequences");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name) {
      return errorResponse("Sequence name is required", 400);
    }

    const sequence = await db.emailSequence.create({
      data: {
        name: body.name,
        status: body.status || "draft",
      },
      include: {
        _count: {
          select: {
            steps: true,
            enrolledContacts: true,
          },
        },
      },
    });

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    console.error("Failed to create sequence:", error);
    return errorResponse("Failed to create sequence");
  }
}
