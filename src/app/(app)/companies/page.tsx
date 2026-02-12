"use client"

import { useState, useMemo } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { ViewToggle } from "@/components/shared/view-toggle"
import { EmptyState } from "@/components/shared/empty-state"
import { CompanyCard } from "@/components/companies/company-card"
import { CompanyTable } from "@/components/companies/company-table"
import { CompanyFilters, type CompanyFilterValues } from "@/components/companies/company-filters"
import { Button } from "@/components/ui/button"
import { mockCompanies } from "@/lib/mock-data"
import { Building2, Sparkles } from "lucide-react"

export default function CompaniesPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState<CompanyFilterValues>({
    search: "",
    industry: "",
    fundingStage: "",
    companySize: "",
  })

  const filtered = useMemo(() => {
    return mockCompanies.filter((company) => {
      if (
        filters.search &&
        !company.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }
      if (filters.industry && company.industry !== filters.industry) {
        return false
      }
      if (filters.fundingStage && company.fundingStage !== filters.fundingStage) {
        return false
      }
      if (filters.companySize && company.employeeRange !== filters.companySize) {
        return false
      }
      return true
    })
  }, [filters])

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description="Discover and track target companies">
        <ViewToggle view={view} onViewChange={setView} />
        <Button>
          <Sparkles className="h-4 w-4 mr-1.5" />
          Scan for Companies
        </Button>
      </PageHeader>

      <CompanyFilters filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description="Try adjusting your filters or scan for new companies to get started."
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <CompanyTable companies={filtered} />
      )}
    </div>
  )
}
