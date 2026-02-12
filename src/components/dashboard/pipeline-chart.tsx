"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PipelineStage } from "@/types"

interface PipelineChartProps {
  stages: PipelineStage[]
}

export function PipelineChart({ stages }: PipelineChartProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage) => {
            const widthPercent = (stage.count / maxCount) * 100

            return (
              <div key={stage.name} className="group">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {stage.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {stage.count}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: stage.count > 0 ? `${widthPercent}%` : "0%",
                      backgroundColor: stage.color,
                      minWidth: stage.count > 0 ? "8px" : "0px",
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
