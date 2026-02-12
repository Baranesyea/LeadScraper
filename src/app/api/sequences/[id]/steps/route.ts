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
    });
    if (!sequence) {
      return errorResponse("Sequence not found", 404);
    }

    if (!body.subject || !body.body) {
      return errorResponse("subject and body are required", 400);
    }

    // Auto-determine the next order number if not provided
    let order = body.order;
    if (order === undefined || order === null) {
      const lastStep = await db.sequenceStep.findFirst({
        where: { sequenceId },
        orderBy: { order: "desc" },
      });
      order = lastStep ? lastStep.order + 1 : 0;
    }

    const step = await db.sequenceStep.create({
      data: {
        sequenceId,
        order,
        delayDays: body.delayDays ?? 0,
        subject: body.subject,
        body: body.body,
        type: body.type || "follow-up",
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Failed to add step:", error);
    return errorResponse("Failed to add step to sequence");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const body = await request.json();

    const sequence = await db.emailSequence.findUnique({
      where: { id: sequenceId },
    });
    if (!sequence) {
      return errorResponse("Sequence not found", 404);
    }

    if (!body.stepId) {
      return errorResponse("stepId is required", 400);
    }

    const existingStep = await db.sequenceStep.findUnique({
      where: { id: body.stepId },
    });
    if (!existingStep || existingStep.sequenceId !== sequenceId) {
      return errorResponse("Step not found in this sequence", 404);
    }

    const updateData: Record<string, unknown> = {};
    if (body.order !== undefined) updateData.order = body.order;
    if (body.delayDays !== undefined) updateData.delayDays = body.delayDays;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.type !== undefined) updateData.type = body.type;

    const step = await db.sequenceStep.update({
      where: { id: body.stepId },
      data: updateData,
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to update step:", error);
    return errorResponse("Failed to update sequence step");
  }
}
