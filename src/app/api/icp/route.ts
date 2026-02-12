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

export async function GET() {
  try {
    const icps = await db.icpProfile.findMany({
      orderBy: { updatedAt: "desc" },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = icps.map((icp: any) => parseJsonFields(icp, JSON_FIELDS));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to list ICPs:", error);
    return errorResponse("Failed to list ICPs");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name) {
      return errorResponse("Name is required", 400);
    }

    const data = stringifyJsonFields(body, JSON_FIELDS);

    const icp = await db.icpProfile.create({ data });

    return NextResponse.json(parseJsonFields(icp, JSON_FIELDS), {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create ICP:", error);
    return errorResponse("Failed to create ICP");
  }
}
