"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { PipelineStats, ValidationLog, EnrichmentData } from "@/types"

export function usePipelineStats() {
  return useQuery<PipelineStats>({
    queryKey: ["pipeline", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/pipeline/stats")
      if (!res.ok) throw new Error("Failed to fetch pipeline stats")
      return res.json()
    },
  })
}

export function useRunPipeline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactIds: string[]) => {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds }),
      })
      if (!res.ok) throw new Error("Pipeline failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] })
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
    },
  })
}

export function useValidateContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactIds: string[]) => {
      const res = await fetch("/api/pipeline/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds }),
      })
      if (!res.ok) throw new Error("Validation failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] })
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useEnrichContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactIds: string[]) => {
      const res = await fetch("/api/pipeline/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds }),
      })
      if (!res.ok) throw new Error("Enrichment failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] })
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
    },
  })
}

export function useScoreContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactIds: string[]) => {
      const res = await fetch("/api/pipeline/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds }),
      })
      if (!res.ok) throw new Error("Scoring failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] })
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useContactEnrichment(contactId: string | null) {
  return useQuery<EnrichmentData>({
    queryKey: ["contacts", contactId, "enrichment"],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}/enrichment`)
      if (!res.ok) throw new Error("Failed to fetch enrichment")
      return res.json()
    },
    enabled: !!contactId,
  })
}

export function useContactValidation(contactId: string | null) {
  return useQuery<ValidationLog[]>({
    queryKey: ["contacts", contactId, "validation"],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}/validation`)
      if (!res.ok) throw new Error("Failed to fetch validation logs")
      return res.json()
    },
    enabled: !!contactId,
  })
}
