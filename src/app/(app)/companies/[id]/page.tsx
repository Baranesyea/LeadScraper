"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { CompanyDetail } from "@/components/companies/company-detail"
import { Button } from "@/components/ui/button"
import { mockCompanies, mockContacts } from "@/lib/mock-data"
import { ArrowLeft } from "lucide-react"

interface CompanyPageProps {
  params: Promise<{ id: string }>
}

export default function CompanyPage({ params }: CompanyPageProps) {
  const { id } = use(params)

  const company = mockCompanies.find((c) => c.id === id)
  if (!company) {
    notFound()
  }

  const contacts = mockContacts.filter((c) => company.contactIds.includes(c.id))

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
