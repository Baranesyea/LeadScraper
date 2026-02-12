import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paginate, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const status = searchParams.get("status");

    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      db.scrapeJob.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.scrapeJob.count({ where }),
    ]);

    // Parse JSON results field for each job
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = jobs.map((job: any) => ({
      ...job,
      results:
        typeof job.results === "string"
          ? JSON.parse(job.results)
          : job.results,
    }));

    return NextResponse.json({
      data: parsed,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Failed to list scrape jobs:", error);
    return errorResponse("Failed to list scrape jobs");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.type) {
      return errorResponse("type is required", 400);
    }
    if (!body.query) {
      return errorResponse("query is required", 400);
    }

    // Validate ICP exists if icpId is provided
    if (body.icpId) {
      const icp = await db.icpProfile.findUnique({
        where: { id: body.icpId },
      });
      if (!icp) {
        return errorResponse("ICP not found", 404);
      }
    }

    const job = await db.scrapeJob.create({
      data: {
        icpId: body.icpId || null,
        type: body.type,
        query: body.query,
        status: "pending",
        results: JSON.stringify({}),
      },
    });

    // Placeholder: In the future, this will trigger the actual scrape engine.
    // For now, simulate starting the job by updating status to "running".
    const startedJob = await db.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: "running",
        startedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ...startedJob,
        results: JSON.parse(startedJob.results),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to start scrape job:", error);
    return errorResponse("Failed to start scrape job");
  }
}
