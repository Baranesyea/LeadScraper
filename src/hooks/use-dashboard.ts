"use client"

import { useQuery } from "@tanstack/react-query"
import type { DashboardStats, ActivityItem } from "@/types"

const STAGE_COLORS: Record<string, string> = {
  "pre-seed": "#94a3b8",
  seed: "#60a5fa",
  "series-a": "#34d399",
  "series-b": "#a78bfa",
  "series-c": "#f97316",
  "series-d-plus": "#ec4899",
  public: "#06b6d4",
  bootstrapped: "#84cc16",
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Failed to fetch dashboard stats")
      const data = await res.json()

      return {
        totalCompanies: data.totalCompanies ?? 0,
        totalContacts: data.totalContacts ?? 0,
        emailsSentThisWeek: data.emailsSentThisWeek ?? 0,
        emailsSentTotal: data.emailsSentTotal ?? 0,
        openRate: data.openRate ?? 0,
        replyRate: data.replyRate ?? 0,
        pipelineStages: (data.pipelineStages ?? []).map(
          (s: { stage: string; count: number }) => ({
            name: s.stage,
            count: s.count,
            color: STAGE_COLORS[s.stage] ?? "#94a3b8",
          })
        ),
      }
    },
  })
}

export function useRecentActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/emails?limit=10")
      if (!res.ok) return []
      const data = await res.json()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data.data ?? []).slice(0, 8).map((email: any) => ({
        id: email.id,
        type:
          email.status === "replied"
            ? "email_replied"
            : email.status === "opened"
              ? "email_opened"
              : email.status === "sent"
                ? "email_sent"
                : "lead_added",
        description: `${
          email.status === "replied"
            ? "Reply from"
            : email.status === "opened"
              ? "Email opened by"
              : email.status === "sent"
                ? "Email sent to"
                : "Draft created for"
        } ${email.contact?.fullName ?? "Unknown"}`,
        timestamp: email.sentAt ?? email.createdAt,
        contactName: email.contact?.fullName,
        companyName: email.contact?.company?.name,
      })) as ActivityItem[]
    },
  })
}
