"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { SequenceBuilder } from "@/components/outreach/sequence-builder"
import { useSequence } from "@/hooks/use-sequences"

export default function SequenceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: sequence, isLoading, error } = useSequence(id)

  if (isLoading) {
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
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !sequence) {
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
