import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paginate, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (companyId) {
      where.companyId = companyId;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { title: { contains: search } },
        { workEmail: { contains: search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        include: {
          company: {
            select: { id: true, name: true, industry: true },
          },
        },
      }),
      db.contact.count({ where }),
    ]);

    return NextResponse.json({
      data: contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Failed to list contacts:", error);
    return errorResponse("Failed to list contacts");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.companyId) {
      return errorResponse("companyId is required", 400);
    }
    if (!body.firstName || !body.lastName) {
      return errorResponse("firstName and lastName are required", 400);
    }

    // Auto-generate fullName if not provided
    if (!body.fullName) {
      body.fullName = `${body.firstName} ${body.lastName}`;
    }

    const company = await db.company.findUnique({
      where: { id: body.companyId },
    });
    if (!company) {
      return errorResponse("Company not found", 404);
    }

    const contact = await db.contact.create({
      data: body,
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Failed to create contact:", error);
    return errorResponse("Failed to create contact");
  }
}
