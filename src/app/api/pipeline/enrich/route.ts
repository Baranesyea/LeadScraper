import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { enrichContact } from "@/lib/services/enrichment"

// POST /api/pipeline/enrich
// Body: { contactId: string } or { contactIds: string[] }
// Only enriches contacts with emailConfidence >= 70
// Steps:
// 1. Load contact with company
// 2. Check eligibility (email verified or risky)
// 3. Run enrichContact
// 4. Upsert EnrichmentData
// 5. Update Company enrichment fields too (google rating, CRM, website quality)
// 6. Update contact enrichedAt
// 7. Return enrichment result

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
        include: { company: true }
      })

      if (!contact) {
        results.push({ contactId, error: "not found" })
        continue
      }

      if (contact.emailConfidence < 70 && contact.emailStatus !== "unverified") {
        results.push({ contactId, error: "email not verified (confidence < 70)" })
        continue
      }

      const enrichment = enrichContact({
        name: contact.fullName,
        email: contact.workEmail || contact.personalEmail || "",
        company: contact.company?.name || "",
        website: contact.company?.website || "",
        location: contact.company?.location || "",
      })

      // Upsert enrichment data
      await db.enrichmentData.upsert({
        where: { contactId },
        update: {
          ...enrichment,
          recentReviews: JSON.stringify(enrichment.recentReviews),
          techStack: JSON.stringify(enrichment.techStack),
          signals: JSON.stringify(enrichment.signals),
          hooks: JSON.stringify(enrichment.hooks),
        },
        create: {
          contactId,
          ...enrichment,
          recentReviews: JSON.stringify(enrichment.recentReviews),
          techStack: JSON.stringify(enrichment.techStack),
          signals: JSON.stringify(enrichment.signals),
          hooks: JSON.stringify(enrichment.hooks),
        },
      })

      // Update company enrichment fields
      if (contact.companyId) {
        await db.company.update({
          where: { id: contact.companyId },
          data: {
            googleRating: enrichment.googleRating,
            googleReviewCount: enrichment.googleReviewCount,
            reviewSentiment: enrichment.reviewSentiment,
            crmDetected: enrichment.crmDetected,
            crmName: enrichment.crmName,
            websiteQuality: enrichment.websiteQuality,
            hasSsl: enrichment.hasSsl,
            hasIdx: enrichment.hasIdx,
            siteAge: enrichment.siteAge,
            techStack: JSON.stringify(enrichment.techStack),
            enrichedAt: new Date(),
          }
        })
      }

      await db.contact.update({
        where: { id: contactId },
        data: { enrichedAt: new Date() }
      })

      results.push({ contactId, ...enrichment })
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 })
  }
}
