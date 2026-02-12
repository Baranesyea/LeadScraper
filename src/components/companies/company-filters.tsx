"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { INDUSTRIES, FUNDING_STAGES, COMPANY_SIZES } from "@/lib/constants"
import { Search } from "lucide-react"

export interface CompanyFilterValues {
  search: string
  industry: string
  fundingStage: string
  companySize: string
}

interface CompanyFiltersProps {
  filters: CompanyFilterValues
  onChange: (filters: CompanyFilterValues) => void
}

export function CompanyFilters({ filters, onChange }: CompanyFiltersProps) {
  function update(patch: Partial<CompanyFilterValues>) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-9 h-9"
        />
      </div>

      <div className="w-[160px]">
        <Select value={filters.industry} onValueChange={(v) => update({ industry: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Industries</SelectItem>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[160px]">
        <Select value={filters.fundingStage} onValueChange={(v) => update({ fundingStage: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Funding Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Stages</SelectItem>
            {FUNDING_STAGES.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[160px]">
        <Select value={filters.companySize} onValueChange={(v) => update({ companySize: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Company Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sizes</SelectItem>
            {COMPANY_SIZES.map((size) => (
              <SelectItem key={size.label} value={size.label}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
