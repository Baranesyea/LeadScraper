"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { ContactDetail } from "@/components/contacts/contact-detail"
import { mockContacts } from "@/lib/mock-data"

interface ContactPageProps {
  params: Promise<{ id: string }>
}

export default function ContactPage({ params }: ContactPageProps) {
  const { id } = use(params)
  const contact = mockContacts.find((c) => c.id === id)

  if (!contact) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title={contact.fullName} description={`${contact.title} at ${contact.companyName}`}>
        <Link
          href="/contacts"
          className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>
      </PageHeader>
      <ContactDetail contact={contact} />
    </div>
  )
}
