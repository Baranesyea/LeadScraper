import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/pipeline/stats
// Returns pipeline statistics
export async function GET() {
  try {
    const [
      total,
      unverified,
      verified,
      risky,
      invalid,
      emailMissing,
      enriched,
      hot,
      warm,
      cold,
      avgConfidenceResult,
    ] = await Promise.all([
      db.contact.count(),
      db.contact.count({ where: { emailStatus: "unverified" } }),
      db.contact.count({ where: { emailStatus: "verified" } }),
      db.contact.count({ where: { emailStatus: "risky" } }),
      db.contact.count({ where: { emailStatus: "invalid" } }),
      db.contact.count({ where: { emailStatus: "email_missing" } }),
      db.contact.count({ where: { enrichedAt: { not: null } } }),
      db.contact.count({ where: { leadTier: "hot" } }),
      db.contact.count({ where: { leadTier: "warm" } }),
      db.contact.count({ where: { leadTier: "cold" } }),
      db.contact.aggregate({ _avg: { emailConfidence: true }, where: { emailStatus: { not: "unverified" } } }),
    ])

    const validatedTotal = verified + risky + invalid
    const validationPassRate = validatedTotal > 0 ? Math.round((verified / validatedTotal) * 100) : 0

    return NextResponse.json({
      total,
      unverified,
      verified,
      risky,
      invalid,
      emailMissing,
      enriched,
      hot,
      warm,
      cold,
      validationPassRate,
      avgConfidence: Math.round(avgConfidenceResult._avg.emailConfidence || 0),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
