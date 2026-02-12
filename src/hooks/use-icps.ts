"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ICP, FundingStage } from "@/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapIcp(raw: any): ICP {
  return {
    id: raw.id,
    name: raw.name,
    industries: raw.industries ?? [],
    companySizeMin: raw.companySizeMin ?? null,
    companySizeMax: raw.companySizeMax ?? null,
    locations: raw.locations ?? [],
    technologies: raw.technologies ?? [],
    fundingStages: (raw.fundingStages ?? []) as FundingStage[],
    revenueMin: raw.revenueMin ?? null,
    revenueMax: raw.revenueMax ?? null,
    keywords: raw.keywords ?? [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export function useIcps() {
  return useQuery<ICP[]>({
    queryKey: ["icps"],
    queryFn: async () => {
      const res = await fetch("/api/icp")
      if (!res.ok) throw new Error("Failed to fetch ICPs")
      const json = await res.json()
      return (Array.isArray(json) ? json : []).map(mapIcp)
    },
  })
}

export function useIcp(id: string) {
  return useQuery<ICP>({
    queryKey: ["icp", id],
    queryFn: async () => {
      const res = await fetch(`/api/icp/${id}`)
      if (!res.ok) throw new Error("Failed to fetch ICP")
      const json = await res.json()
      return mapIcp(json)
    },
    enabled: !!id,
  })
}

export function useCreateIcp() {
  const queryClient = useQueryClient()
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
      const res = await fetch("/api/icp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create ICP")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icps"] })
    },
  })
}

export function useUpdateIcp() {
  const queryClient = useQueryClient()
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/icp/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update ICP")
      return res.json()
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["icp", id] })
      queryClient.invalidateQueries({ queryKey: ["icps"] })
    },
  })
}

export function useDeleteIcp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/icp/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete ICP")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icps"] })
    },
  })
}
