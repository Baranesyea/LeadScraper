"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { EmailSequence, SequenceStep } from "@/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSequence(raw: any): EmailSequence {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    steps: (raw.steps ?? []).map(mapStep),
    enrolledContactIds: raw.enrolledContacts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.enrolledContacts.map((e: any) => e.contactId ?? e.id)
      : [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStep(raw: any): SequenceStep {
  return {
    id: raw.id,
    order: raw.order,
    delayDays: raw.delayDays,
    subject: raw.subject,
    body: raw.body,
    type: raw.type ?? "follow-up",
  }
}

export function useSequences() {
  return useQuery<EmailSequence[]>({
    queryKey: ["sequences"],
    queryFn: async () => {
      const res = await fetch("/api/sequences")
      if (!res.ok) throw new Error("Failed to fetch sequences")
      const json = await res.json()
      // List endpoint returns _count but not full steps/enrolledContacts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Array.isArray(json) ? json : []).map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        steps: s.steps ?? [],
        enrolledContactIds: [],
        // Use _count for display in list view
        _count: s._count,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    },
  })
}

export function useSequence(id: string) {
  return useQuery<EmailSequence>({
    queryKey: ["sequence", id],
    queryFn: async () => {
      const res = await fetch(`/api/sequences/${id}`)
      if (!res.ok) throw new Error("Failed to fetch sequence")
      const json = await res.json()
      return mapSequence(json)
    },
    enabled: !!id && id !== "new",
  })
}

export function useCreateSequence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; status?: string }) => {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create sequence")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] })
    },
  })
}

export function useUpdateSequence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; status?: string }
    }) => {
      const res = await fetch(`/api/sequences/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update sequence")
      return res.json()
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sequence", id] })
      queryClient.invalidateQueries({ queryKey: ["sequences"] })
    },
  })
}

export function useSaveSequenceSteps() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sequenceId,
      steps,
    }: {
      sequenceId: string
      steps: Array<{
        id?: string
        order: number
        delayDays: number
        subject: string
        body: string
        type: string
      }>
    }) => {
      const res = await fetch(`/api/sequences/${sequenceId}/steps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps }),
      })
      if (!res.ok) throw new Error("Failed to save steps")
      return res.json()
    },
    onSuccess: (_data, { sequenceId }) => {
      queryClient.invalidateQueries({ queryKey: ["sequence", sequenceId] })
      queryClient.invalidateQueries({ queryKey: ["sequences"] })
    },
  })
}
