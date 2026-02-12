import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paginate, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const contactId = searchParams.get("contactId");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (status) {
      where.status = status;
    }
    if (contactId) {
      where.contactId = contactId;
    }

    const [emails, total] = await Promise.all([
      db.email.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          contact: {
            select: {
              id: true,
              fullName: true,
              workEmail: true,
              company: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      db.email.count({ where }),
    ]);

    return NextResponse.json({
      data: emails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Failed to list emails:", error);
    return errorResponse("Failed to list emails");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.contactId) {
      return errorResponse("contactId is required", 400);
    }
    if (!body.subject || !body.body) {
      return errorResponse("subject and body are required", 400);
    }

    const contact = await db.contact.findUnique({
      where: { id: body.contactId },
    });
    if (!contact) {
      return errorResponse("Contact not found", 404);
    }

    const email = await db.email.create({
      data: {
        contactId: body.contactId,
        subject: body.subject,
        body: body.body,
        status: body.status || "draft",
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        sequenceId: body.sequenceId || null,
        sequenceStep: body.sequenceStep || null,
        trackingId: body.trackingId || null,
      },
      include: {
        contact: {
          select: {
            id: true,
            fullName: true,
            workEmail: true,
          },
        },
      },
    });

    return NextResponse.json(email, { status: 201 });
  } catch (error) {
    console.error("Failed to create email:", error);
    return errorResponse("Failed to create email");
  }
}
