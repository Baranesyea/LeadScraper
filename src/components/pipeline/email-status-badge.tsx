import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldAlert, ShieldX, AlertCircle, HelpCircle } from "lucide-react"
import type { EmailStatus } from "@/types"

interface EmailStatusBadgeProps {
  status: EmailStatus
  confidence?: number
}

const statusConfig = {
  unverified: { label: "Unverified", icon: HelpCircle, className: "bg-muted text-muted-foreground border-border" },
  verified: { label: "Verified", icon: ShieldCheck, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  risky: { label: "Risky", icon: ShieldAlert, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  invalid: { label: "Invalid", icon: ShieldX, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  email_missing: { label: "No Email", icon: AlertCircle, className: "bg-muted text-muted-foreground border-border" },
}

export function EmailStatusBadge({ status, confidence }: EmailStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
      {confidence !== undefined && confidence > 0 && (
        <span className="ml-0.5 opacity-70">{confidence}%</span>
      )}
    </Badge>
  )
}
