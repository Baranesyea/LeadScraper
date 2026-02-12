"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { ContactTable } from "@/components/contacts/contact-table"
import { ContactPanel } from "@/components/contacts/contact-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useContacts } from "@/hooks/use-contacts"
import type { Contact } from "@/types"

export default function ContactsPage() {
  const { data, isLoading } = useContacts()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  function handleSelectContact(contact: Contact) {
    setSelectedContact(contact)
    setPanelOpen(true)
  }

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
      <ContactTable contacts={contacts} onSelect={handleSelectContact} />

      <ContactPanel
        contact={selectedContact}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </div>
  )
}
