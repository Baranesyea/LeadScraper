import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paginate, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");
    const fundingStage = searchParams.get("fundingStage");
    const search = searchParams.get("search");
    const icpId = searchParams.get("icpId");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (industry) {
      where.industry = { contains: industry };
    }
    if (fundingStage) {
      where.fundingStage = fundingStage;
    }
    if (icpId) {
      where.matchedIcpId = icpId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { industry: { contains: search } },
      ];
    }

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: {
              contacts: true,
              news: true,
            },
          },
          matchedIcp: {
            select: { id: true, name: true },
          },
        },
      }),
      db.company.count({ where }),
    ]);

    return NextResponse.json({
      data: companies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Failed to list companies:", error);
    return errorResponse("Failed to list companies");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name) {
      return errorResponse("Company name is required", 400);
    }

    // Stringify technologies if it's an array
    if (Array.isArray(body.technologies)) {
      body.technologies = JSON.stringify(body.technologies);
    }

    const company = await db.company.create({
      data: body,
      include: {
        _count: {
          select: {
            contacts: true,
            news: true,
          },
        },
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Failed to create company:", error);
    return errorResponse("Failed to create company");
  }
}
