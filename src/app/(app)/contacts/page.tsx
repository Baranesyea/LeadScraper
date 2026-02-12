"use client"

import { PageHeader } from "@/components/shared/page-header"
import { ContactTable } from "@/components/contacts/contact-table"
import { Skeleton } from "@/components/ui/skeleton"
import { useContacts } from "@/hooks/use-contacts"

export default function ContactsPage() {
  const { data, isLoading } = useContacts()

  const contacts = data?.data ?? []
  const total = data?.total ?? 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contacts"
          description="Loading contacts..."
        />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={`${total} contacts total`}
      />
      <ContactTable contacts={contacts} />
    </div>
  )
}
