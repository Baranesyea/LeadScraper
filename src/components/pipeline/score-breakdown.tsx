import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Clock, Database } from "lucide-react"

interface ScoreBreakdownProps {
  icpFit: number
  timing: number
  dataQuality: number
  total: number
}

export function ScoreBreakdown({ icpFit, timing, dataQuality, total }: ScoreBreakdownProps) {
  const dimensions = [
    { label: "ICP Fit", score: icpFit, max: 40, icon: Target, color: "bg-violet-500" },
    { label: "Timing", score: timing, max: 30, icon: Clock, color: "bg-amber-500" },
    { label: "Data Quality", score: dataQuality, max: 30, icon: Database, color: "bg-blue-500" },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Lead Score Breakdown</CardTitle>
          <span className="text-2xl font-bold">{total}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dimensions.map((dim) => {
            const Icon = dim.icon
            const pct = Math.round((dim.score / dim.max) * 100)
            return (
              <div key={dim.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{dim.label}</span>
                  </div>
                  <span className="text-muted-foreground">{dim.score}/{dim.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${dim.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
