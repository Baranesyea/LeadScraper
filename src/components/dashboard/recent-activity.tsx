"use client"

import {
  UserPlus,
  Send,
  MailOpen,
  MessageSquare,
  Database,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityItem } from "@/types"

interface RecentActivityProps {
  items: ActivityItem[]
}

const activityConfig: Record<
  ActivityItem["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  lead_added: {
    icon: UserPlus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  email_sent: {
    icon: Send,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  email_opened: {
    icon: MailOpen,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  email_replied: {
    icon: MessageSquare,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  company_enriched: {
    icon: Database,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => {
            const config = activityConfig[item.type]
            const Icon = config.icon

            return (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
