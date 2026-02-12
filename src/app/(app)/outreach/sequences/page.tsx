"use client"

import { PageHeader } from "@/components/shared/page-header"
import { SequenceList } from "@/components/outreach/sequence-list"
import { Skeleton } from "@/components/ui/skeleton"
import { useSequences } from "@/hooks/use-sequences"

export default function SequencesPage() {
  const { data: sequences, isLoading } = useSequences()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sequences"
        description="Automate multi-step email outreach."
      />
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <SequenceList sequences={sequences ?? []} />
      )}
    </div>
  )
}
