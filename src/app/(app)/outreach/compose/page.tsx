"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { EmailComposer } from "@/components/outreach/email-composer"

export default function ComposePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Compose Email">
        <Link
          href="/outreach"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </PageHeader>
      <EmailComposer />
    </div>
  )
}
