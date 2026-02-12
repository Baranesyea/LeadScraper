"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { CompanyDetail } from "@/components/companies/company-detail"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompany } from "@/hooks/use-companies"
import { useContacts } from "@/hooks/use-contacts"
import { ArrowLeft, Building2 } from "lucide-react"

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>()

  const { data: company, isLoading: companyLoading, error: companyError } = useCompany(id)
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ companyId: id })

  const isLoading = companyLoading || contactsLoading
  const contacts = contactsData?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="">
          <Link href="/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Companies
            </Button>
          </Link>
        </PageHeader>

        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-36" />
          </div>

          {/* Info grid skeleton */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>

          {/* About skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Technologies skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (companyError || !company) {
    return (
      <div className="space-y-6">
        <PageHeader title="">
          <Link href="/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Companies
            </Button>
          </Link>
        </PageHeader>

        <EmptyState
          icon={Building2}
          title="Company not found"
          description="The company you're looking for doesn't exist or may have been removed."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="">
        <Link href="/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Companies
          </Button>
        </Link>
      </PageHeader>

      <CompanyDetail company={company} contacts={contacts} />
    </div>
  )
}
