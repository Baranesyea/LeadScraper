"use client"

import { Building2, Users, Mail, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DashboardStats } from "@/types"

interface StatsCardsProps {
  stats: DashboardStats
}

const kpiCards = [
  {
    key: "totalCompanies" as const,
    label: "Total Companies",
    icon: Building2,
    trend: "+12%",
    format: (value: number) => value.toLocaleString(),
  },
  {
    key: "totalContacts" as const,
    label: "Total Contacts",
    icon: Users,
    trend: "+8%",
    format: (value: number) => value.toLocaleString(),
  },
  {
    key: "emailsSentTotal" as const,
    label: "Emails Sent",
    icon: Mail,
    trend: "+24%",
    format: (value: number) => value.toLocaleString(),
  },
  {
    key: "replyRate" as const,
    label: "Response Rate",
    icon: TrendingUp,
    trend: "+3.2%",
    format: (value: number) => `${value}%`,
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi) => {
        const Icon = kpi.icon
        const value = stats[kpi.key]

        return (
          <Card key={kpi.key} className="hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <Badge
                  variant="secondary"
                  className="border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  {kpi.trend}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold tracking-tight">
                  {kpi.format(value)}
                </p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
