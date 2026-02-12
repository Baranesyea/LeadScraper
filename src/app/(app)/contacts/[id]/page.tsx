"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { ContactDetail } from "@/components/contacts/contact-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { useContact } from "@/hooks/use-contacts"

export default function ContactPage() {
  const { id } = useParams<{ id: string }>()
  const { data: contact, isLoading, error } = useContact(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="">
          <Link
            href="/contacts"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Link>
        </PageHeader>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contact Not Found" description="The contact you are looking for does not exist.">
          <Link
            href="/contacts"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Link>
        </PageHeader>
      </div>
    )
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
