"use client"

import { PageHeader } from "@/components/shared/page-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { PipelineOverview } from "@/components/pipeline/pipeline-overview"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats, useRecentActivity } from "@/hooks/use-dashboard"
import { usePipelineStats } from "@/lib/hooks/use-pipeline"
import type { DashboardStats, PipelineStats } from "@/types"

const defaultStats: DashboardStats = {
  totalCompanies: 0,
  totalContacts: 0,
  emailsSentThisWeek: 0,
  emailsSentTotal: 0,
  openRate: 0,
  replyRate: 0,
  pipelineStages: [],
}

const defaultPipelineStats: PipelineStats = {
  total: 0,
  unverified: 0,
  verified: 0,
  risky: 0,
  invalid: 0,
  emailMissing: 0,
  enriched: 0,
  hot: 0,
  warm: 0,
  cold: 0,
  validationPassRate: 0,
  avgConfidence: 0,
}

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats()
  const { data: activityItems, isLoading: activityLoading } =
    useRecentActivity()
  const { data: pipelineStats, isLoading: pipelineLoading } =
    usePipelineStats()

  const dashboardStats = stats ?? defaultStats
  const pipeline = pipelineStats ?? defaultPipelineStats

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your sales pipeline and outreach activity."
      />

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load dashboard stats. Please try refreshing the page.
        </div>
      ) : (
        <StatsCards stats={dashboardStats} />
      )}

      {/* Pipeline Overview */}
      {pipelineLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : pipeline.total > 0 ? (
        <PipelineOverview stats={pipeline} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {statsLoading ? (
            <Skeleton className="h-80 w-full rounded-xl" />
          ) : (
            <PipelineChart stages={dashboardStats.pipelineStages} />
          )}
        </div>
        <div className="lg:col-span-2">
          {activityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <RecentActivity items={activityItems ?? []} />
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Quick Actions
        </h2>
        <QuickActions />
      </div>
    </div>
  )
}
