"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PipelineStats } from "@/types"
import { ShieldCheck, ShieldAlert, ShieldX, AlertCircle, Flame, Sun, Snowflake, Users, CheckCircle2, TrendingUp } from "lucide-react"

interface PipelineOverviewProps {
  stats: PipelineStats
}

export function PipelineOverview({ stats }: PipelineOverviewProps) {
  // Validation funnel - shows how many leads are at each stage
  const validationStages = [
    { label: "Unverified", count: stats.unverified, icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted" },
    { label: "Verified", count: stats.verified, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Risky", count: stats.risky, icon: ShieldAlert, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { label: "Invalid", count: stats.invalid, icon: ShieldX, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  ]

  const tierBreakdown = [
    { label: "Hot Leads", count: stats.hot, icon: Flame, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
    { label: "Warm Leads", count: stats.warm, icon: Sun, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { label: "Cold Leads", count: stats.cold, icon: Snowflake, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  ]

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.validationPassRate}%</p>
                <p className="text-sm text-muted-foreground">Validation Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.enriched}</p>
                <p className="text-sm text-muted-foreground">Enriched</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Flame className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.avgConfidence}</p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Validation Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationStages.map((stage) => {
                const percentage = stats.total > 0 ? Math.round((stage.count / stats.total) * 100) : 0
                const Icon = stage.icon
                return (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stage.bg}`}>
                      <Icon className={`h-4 w-4 ${stage.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{stage.label}</span>
                        <span className="text-sm text-muted-foreground">{stage.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stage.label === "Verified" ? "bg-emerald-500" :
                            stage.label === "Risky" ? "bg-amber-500" :
                            stage.label === "Invalid" ? "bg-red-500" :
                            "bg-muted-foreground/30"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lead Tier Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tierBreakdown.map((tier) => {
                const scoredTotal = stats.hot + stats.warm + stats.cold
                const percentage = scoredTotal > 0 ? Math.round((tier.count / scoredTotal) * 100) : 0
                const Icon = tier.icon
                return (
                  <div key={tier.label} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tier.bg}`}>
                      <Icon className={`h-4 w-4 ${tier.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{tier.label}</span>
                        <span className="text-sm text-muted-foreground">{tier.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            tier.label === "Hot Leads" ? "bg-red-500" :
                            tier.label === "Warm Leads" ? "bg-amber-500" :
                            "bg-blue-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
