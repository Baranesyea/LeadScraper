"use client"

import { PageHeader } from "@/components/shared/page-header"
import { SequenceList } from "@/components/outreach/sequence-list"

export default function SequencesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sequences"
        description="Automate multi-step email outreach."
      />
      <SequenceList />
    </div>
  )
}
