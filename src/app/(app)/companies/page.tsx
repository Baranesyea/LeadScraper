"use client"

import { useState, useMemo, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { ViewToggle } from "@/components/shared/view-toggle"
import { EmptyState } from "@/components/shared/empty-state"
import { CompanyCard } from "@/components/companies/company-card"
import { CompanyTable } from "@/components/companies/company-table"
import { CompanyFilters, type CompanyFilterValues } from "@/components/companies/company-filters"
import { CompanyPanel } from "@/components/companies/company-panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompanies } from "@/hooks/use-companies"
import type { Company } from "@/types"
import { Building2, Sparkles } from "lucide-react"

export default function CompaniesPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState<CompanyFilterValues>({
    search: "",
    industry: "",
    fundingStage: "",
    companySize: "",
  })
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  function handleSelectCompany(company: Company) {
    setSelectedCompany(company)
    setPanelOpen(true)
  }

  // Debounce the search value by 300ms
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  const { data, isLoading } = useCompanies({
    search: debouncedSearch || undefined,
    industry: filters.industry || undefined,
    fundingStage: filters.fundingStage || undefined,
  })

  // Client-side filtering for companySize since the API doesn't support it
  const filtered = useMemo(() => {
    const companies = data?.data ?? []
    if (!filters.companySize) return companies
    return companies.filter(
      (company) => company.employeeRange === filters.companySize
    )
  }, [data, filters.companySize])

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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description="Try adjusting your filters or scan for new companies to get started."
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} onSelect={handleSelectCompany} />
          ))}
        </div>
      ) : (
        <CompanyTable companies={filtered} onSelect={handleSelectCompany} />
      )}

      <CompanyPanel
        company={selectedCompany}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </div>
  )
}
