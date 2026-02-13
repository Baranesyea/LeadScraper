import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateEmail, discoverEmail } from "@/lib/services/validation"

// POST /api/pipeline/validate
// Body: { contactId: string } or { contactIds: string[] }
// Validates email for one or more contacts
// Steps:
// 1. Load contact from DB (with company)
// 2. If no email, try email discovery using firstName, lastName, company website domain
// 3. Run validateEmail on the email
// 4. Save ValidationLog record
// 5. Update contact emailStatus, emailConfidence, validatedAt
// 6. Return updated contact with validation result

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

      let email = contact.workEmail || contact.personalEmail

      // Email discovery if missing
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
        results.push({ contactId, status: "email_missing", confidence: 0 })
        continue
      }

      const validation = await validateEmail(email)

      // Save log
      await db.validationLog.create({
        data: {
          contactId,
          email,
          ...validation,
        }
      })

      // Map status to emailStatus
      const emailStatus = validation.status === "pass" ? "verified"
        : validation.status === "risky" ? "risky"
        : "invalid"

      await db.contact.update({
        where: { id: contactId },
        data: {
          emailStatus,
          emailConfidence: validation.confidence,
          validatedAt: new Date(),
        }
      })

      results.push({ contactId, email, ...validation, emailStatus })
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
