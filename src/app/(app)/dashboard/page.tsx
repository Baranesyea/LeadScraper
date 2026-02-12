import { PageHeader } from "@/components/shared/page-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { mockDashboardStats, mockActivityItems } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your sales pipeline and outreach activity."
      />

      <StatsCards stats={mockDashboardStats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PipelineChart stages={mockDashboardStats.pipelineStages} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity items={mockActivityItems} />
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
