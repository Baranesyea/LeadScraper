"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Company, CompanyNews } from "@/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompany(raw: any): Company {
  const technologies =
    typeof raw.technologies === "string"
      ? (() => {
          try {
            return JSON.parse(raw.technologies)
          } catch {
            return []
          }
        })()
      : Array.isArray(raw.technologies)
        ? raw.technologies
        : []

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    industry: raw.industry ?? "",
    employeeCount: raw.employeeCount ?? 0,
    employeeRange: raw.employeeRange ?? "",
    location: raw.location ?? "",
    country: raw.country ?? "",
    website: raw.website ?? "",
    logoUrl: raw.logoUrl ?? null,
    fundingStage: raw.fundingStage ?? "",
    fundingAmount: raw.fundingAmount ?? null,
    lastFundingDate: raw.lastFundingDate ?? null,
    technologies,
    news: (raw.news ?? []).map(mapCompanyNews),
    contactIds: raw.contacts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.contacts.map((c: any) => c.id)
      : [],
    enrichedAt: raw.enrichedAt ?? null,
    matchedIcpId: raw.matchedIcpId ?? null,
    createdAt: raw.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompanyNews(raw: any): CompanyNews {
  return {
    id: raw.id,
    title: raw.title,
    source: raw.source ?? "",
    url: raw.url ?? "",
    publishedAt: raw.publishedAt ?? raw.createdAt,
    snippet: raw.snippet ?? "",
  }
}

interface UseCompaniesOptions {
  search?: string
  industry?: string
  fundingStage?: string
  page?: number
  limit?: number
}

export function useCompanies(opts: UseCompaniesOptions = {}) {
  const params = new URLSearchParams()
  if (opts.search) params.set("search", opts.search)
  if (opts.industry) params.set("industry", opts.industry)
  if (opts.fundingStage) params.set("fundingStage", opts.fundingStage)
  if (opts.page) params.set("page", String(opts.page))
  if (opts.limit) params.set("limit", String(opts.limit))

  return useQuery<{ data: Company[]; total: number }>({
    queryKey: ["companies", opts],
    queryFn: async () => {
      const res = await fetch(`/api/companies?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch companies")
      const json = await res.json()
      return {
        data: (json.data ?? []).map(mapCompany),
        total: json.pagination?.total ?? 0,
      }
    },
  })
}

export function useCompany(id: string) {
  return useQuery<Company>({
    queryKey: ["company", id],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${id}`)
      if (!res.ok) throw new Error("Failed to fetch company")
      const json = await res.json()
      return mapCompany(json)
    },
    enabled: !!id,
  })
}

export function useEnrichCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (companyId: string) => {
      const res = await fetch(`/api/companies/${companyId}/enrich`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to enrich company")
      return res.json()
    },
    onSuccess: (_data, companyId) => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
    },
  })
}
