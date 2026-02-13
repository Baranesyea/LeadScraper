import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const logs = await db.validationLog.findMany({
      where: { contactId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch validation logs" }, { status: 500 })
  }
}
