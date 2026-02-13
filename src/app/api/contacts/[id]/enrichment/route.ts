import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonFields } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const enrichment = await db.enrichmentData.findUnique({
      where: { contactId: id }
    })

    if (!enrichment) {
      return NextResponse.json({ error: "No enrichment data" }, { status: 404 })
    }

    const parsed = parseJsonFields(enrichment as unknown as Record<string, unknown>, ["recentReviews", "techStack", "signals", "hooks"])
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch enrichment" }, { status: 500 })
  }
}
