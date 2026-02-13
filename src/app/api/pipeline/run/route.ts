import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateEmail, discoverEmail } from "@/lib/services/validation"
import { enrichContact } from "@/lib/services/enrichment"
import { calculateLeadScore } from "@/lib/services/scoring"

// POST /api/pipeline/run
// Body: { contactId: string } or { contactIds: string[] }
// Runs the full pipeline: Validate → Enrich → Score
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

      // Step 1: Validate
      let email = contact.workEmail || contact.personalEmail

      if (!email && contact.company?.website) {
        try {
          const domain = new URL(contact.company.website.startsWith("http") ? contact.company.website : `https://${contact.company.website}`).hostname
          const discovered = discoverEmail(contact.firstName, contact.lastName, domain)
          if (discovered) {
            email = discovered
            await db.contact.update({
              where: { id: contactId },
              data: { workEmail: discovered, emailSource: "discovered" }
            })
          }
        } catch {}
      }

      if (!email) {
        await db.contact.update({
          where: { id: contactId },
          data: { emailStatus: "email_missing", emailConfidence: 0, validatedAt: new Date() }
        })
        results.push({ contactId, status: "email_missing" })
        continue
      }

      const validation = await validateEmail(email)

      await db.validationLog.create({
        data: { contactId, email, ...validation }
      })

      const emailStatus = validation.status === "pass" ? "verified"
        : validation.status === "risky" ? "risky" : "invalid"

      await db.contact.update({
        where: { id: contactId },
        data: { emailStatus, emailConfidence: validation.confidence, validatedAt: new Date() }
      })

      // Step 2: Enrich (only if confidence >= 70)
      let enrichmentResult = null
      if (validation.confidence >= 70) {
        const enrichment = enrichContact({
          name: contact.fullName,
          email,
          company: contact.company?.name || "",
          website: contact.company?.website || "",
          location: contact.company?.location || "",
        })

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

        enrichmentResult = enrichment

        // Step 3: Score
        const scoreInput = {
          crmDetected: enrichment.crmDetected,
          googleReviewCount: enrichment.googleReviewCount,
          hasWebsite: enrichment.hasWebsite,
          websiteQuality: enrichment.websiteQuality,
          isIndependent: (contact.company?.employeeCount || 0) < 50,
          isUSMarket: (contact.company?.country || "").toLowerCase().includes("us") || (contact.company?.location || "").toLowerCase().includes("usa"),
          hasNegativeReview: enrichment.signals.some(s => s.type === "negative_review" || s.type === "low_rating"),
          ratingDropped: false,
          isNewAgent: false,
          changedBrokerage: false,
          websiteBroken: (enrichment.websiteQuality || 100) < 30,
          isHighSeason: [3, 4, 5, 6].includes(new Date().getMonth()),
          emailConfidence: validation.confidence,
          enrichmentDone: true,
          dataSourceCount: [
            !!enrichment.googleRating,
            enrichment.hasWebsite,
            !!enrichment.fbPageUrl || !!enrichment.igFollowers,
            !!contact.linkedinUrl,
            !!contact.workPhone,
          ].filter(Boolean).length,
          hasPhone: !!contact.workPhone || !!contact.personalPhone,
          hasSocialProfiles: !!(contact.linkedinUrl || contact.facebookUrl || contact.instagramUrl || enrichment.fbPageUrl),
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

        results.push({ contactId, validation: { emailStatus, confidence: validation.confidence }, enrichment: { leadPriority: enrichment.leadPriority, crmDetected: enrichment.crmDetected }, score })
      } else {
        results.push({ contactId, validation: { emailStatus, confidence: validation.confidence }, enrichment: null, score: null })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: "Pipeline failed" }, { status: 500 })
  }
}
