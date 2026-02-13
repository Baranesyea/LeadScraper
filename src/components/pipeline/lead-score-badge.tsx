import { Badge } from "@/components/ui/badge"
import { Flame, Sun, Snowflake } from "lucide-react"
import type { LeadTier } from "@/types"

interface LeadScoreBadgeProps {
  score: number
  tier: LeadTier
  showScore?: boolean
}

const tierConfig = {
  hot: { label: "Hot", icon: Flame, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  warm: { label: "Warm", icon: Sun, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  cold: { label: "Cold", icon: Snowflake, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
}

export function LeadScoreBadge({ score, tier, showScore = true }: LeadScoreBadgeProps) {
  const config = tierConfig[tier]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
      {showScore && <span className="ml-0.5 opacity-70">{score}</span>}
    </Badge>
  )
}
