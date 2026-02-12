"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { EmailDraft } from "@/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEmail(raw: any): EmailDraft {
  return {
    id: raw.id,
    contactId: raw.contactId,
    contactName: raw.contact?.fullName ?? "",
    companyName: raw.contact?.company?.name ?? "",
    subject: raw.subject,
    body: raw.body,
    status: raw.status,
    sentAt: raw.sentAt ?? null,
    openedAt: raw.openedAt ?? null,
    repliedAt: raw.repliedAt ?? null,
    sequenceId: raw.sequenceId ?? null,
    sequenceStep: raw.sequenceStep ?? null,
    createdAt: raw.createdAt,
  }
}

interface UseEmailsOptions {
  status?: string
  contactId?: string
  page?: number
  limit?: number
}

export function useEmails(opts: UseEmailsOptions = {}) {
  const params = new URLSearchParams()
  if (opts.status) params.set("status", opts.status)
  if (opts.contactId) params.set("contactId", opts.contactId)
  if (opts.page) params.set("page", String(opts.page))
  if (opts.limit) params.set("limit", String(opts.limit))

  return useQuery<{ data: EmailDraft[]; total: number }>({
    queryKey: ["emails", opts],
    queryFn: async () => {
      const res = await fetch(`/api/emails?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch emails")
      const json = await res.json()
      return {
        data: (json.data ?? []).map(mapEmail),
        total: json.pagination?.total ?? 0,
      }
    },
  })
}

export function useCreateEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      contactId: string
      subject: string
      body: string
      status?: string
    }) => {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create email")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useSendEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (emailId: string) => {
      const res = await fetch(`/api/emails/${emailId}/send`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to send email")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
