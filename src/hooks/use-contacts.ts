"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Contact, ContactArticle } from "@/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContact(raw: any): Contact {
  return {
    id: raw.id,
    companyId: raw.companyId,
    companyName: raw.company?.name ?? raw.companyName ?? "",
    firstName: raw.firstName,
    lastName: raw.lastName,
    fullName: raw.fullName,
    title: raw.title ?? "",
    department: raw.department ?? "",
    photoUrl: raw.photoUrl ?? null,
    workEmail: raw.workEmail ?? null,
    personalEmail: raw.personalEmail ?? null,
    workPhone: raw.workPhone ?? null,
    personalPhone: raw.personalPhone ?? null,
    linkedinUrl: raw.linkedinUrl ?? null,
    facebookUrl: raw.facebookUrl ?? null,
    instagramUrl: raw.instagramUrl ?? null,
    articles: (raw.articles ?? []).map(mapArticle),
    enrichedAt: raw.enrichedAt ?? null,
    createdAt: raw.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArticle(raw: any): ContactArticle {
  return {
    id: raw.id,
    title: raw.title,
    source: raw.source ?? "",
    url: raw.url ?? "",
    publishedAt: raw.publishedAt ?? raw.createdAt,
    snippet: raw.snippet ?? "",
  }
}

interface UseContactsOptions {
  search?: string
  companyId?: string
  page?: number
  limit?: number
}

export function useContacts(opts: UseContactsOptions = {}) {
  const params = new URLSearchParams()
  if (opts.search) params.set("search", opts.search)
  if (opts.companyId) params.set("companyId", opts.companyId)
  if (opts.page) params.set("page", String(opts.page))
  if (opts.limit) params.set("limit", String(opts.limit))

  return useQuery<{ data: Contact[]; total: number }>({
    queryKey: ["contacts", opts],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch contacts")
      const json = await res.json()
      return {
        data: (json.data ?? []).map(mapContact),
        total: json.pagination?.total ?? 0,
      }
    },
  })
}

export function useContact(id: string) {
  return useQuery<Contact>({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`)
      if (!res.ok) throw new Error("Failed to fetch contact")
      const json = await res.json()
      return mapContact(json)
    },
    enabled: !!id,
  })
}

export function useEnrichContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactId: string) => {
      const res = await fetch(`/api/contacts/${contactId}/enrich`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to enrich contact")
      return res.json()
    },
    onSuccess: (_data, contactId) => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] })
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}
