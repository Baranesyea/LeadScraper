"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { SequenceBuilder } from "@/components/outreach/sequence-builder"
import { mockEmailSequences } from "@/lib/mock-data"

export default function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const sequence = mockEmailSequences.find((s) => s.id === id)

  if (!sequence) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sequence Not Found">
          <Link
            href="/outreach"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </PageHeader>
        <p className="text-muted-foreground">
          The sequence you are looking for does not exist.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Sequence">
        <Link
          href="/outreach"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </PageHeader>
      <SequenceBuilder sequence={sequence} />
    </div>
  )
}
