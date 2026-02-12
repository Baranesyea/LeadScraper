"use client"

import { PageHeader } from "@/components/shared/page-header"
import { ContactTable } from "@/components/contacts/contact-table"
import { mockContacts } from "@/lib/mock-data"

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={`${mockContacts.length} contacts total`}
      />
      <ContactTable contacts={mockContacts} />
    </div>
  )
}
