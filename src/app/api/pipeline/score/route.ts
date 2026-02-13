import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { calculateLeadScore } from "@/lib/services/scoring"
import { parseJsonFields } from "@/lib/api-helpers"

// POST /api/pipeline/score
// Body: { contactId: string } or { contactIds: string[] }
// Calculates lead score based on enrichment data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const contactIds = body.contactIds || (body.contactId ? [body.contactId] : [])

    if (!contactIds.length) {
      return NextResponse.json({ error: "contactId or contactIds required" }, { status: 400 })
    }

    const results = []

    for (const contactId of contactIds) {
      const contact = await db.contact.findUnique({
        where: { id: contactId },
        include: { company: true, enrichment: true }
      })

      if (!contact) {
        results.push({ contactId, error: "not found" })
        continue
      }

      const enrichment = contact.enrichment
      let signals: Array<{type: string}> = []
      if (enrichment?.signals) {
        try { signals = JSON.parse(enrichment.signals as string) } catch {}
      }

      const scoreInput = {
        crmDetected: enrichment?.crmDetected || contact.company?.crmDetected || null,
        googleReviewCount: enrichment?.googleReviewCount || contact.company?.googleReviewCount || null,
        hasWebsite: enrichment?.hasWebsite ?? !!contact.company?.website,
        websiteQuality: enrichment?.websiteQuality || contact.company?.websiteQuality || null,
        isIndependent: (contact.company?.employeeCount || 0) < 50,
        isUSMarket: (contact.company?.country || "").toLowerCase().includes("us") || (contact.company?.location || "").toLowerCase().includes("usa"),
        hasNegativeReview: signals.some(s => s.type === "negative_review" || s.type === "low_rating"),
        ratingDropped: false, // Would need historical data
        isNewAgent: false, // Would need license data
        changedBrokerage: false,
        websiteBroken: (enrichment?.websiteQuality || 100) < 30,
        isHighSeason: [3, 4, 5, 6].includes(new Date().getMonth()), // Spring/Summer
        emailConfidence: contact.emailConfidence,
        enrichmentDone: !!enrichment,
        dataSourceCount: [
          !!enrichment?.googleRating,
          !!enrichment?.hasWebsite,
          !!enrichment?.fbPageUrl || !!enrichment?.igFollowers,
          !!contact.linkedinUrl,
          !!contact.workPhone,
        ].filter(Boolean).length,
        hasPhone: !!contact.workPhone || !!contact.personalPhone,
        hasSocialProfiles: !!(contact.linkedinUrl || contact.facebookUrl || contact.instagramUrl || enrichment?.fbPageUrl),
      }

      const score = calculateLeadScore(scoreInput)

      await db.contact.update({
        where: { id: contactId },
        data: {
          leadScore: score.totalScore,
          leadTier: score.tier,
          icpFitScore: score.icpFitScore,
          timingScore: score.timingScore,
          dataQualityScore: score.dataQualityScore,
          scoredAt: new Date(),
        }
      })

      results.push({ contactId, ...score })
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 })
  }
}
