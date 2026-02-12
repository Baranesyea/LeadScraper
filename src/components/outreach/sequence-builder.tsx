"use client"

import { useState } from "react"
import { Plus, Play, Pause, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { EmailSequence, SequenceStep } from "@/types"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
}

const TYPE_COLORS: Record<string, string> = {
  initial: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "follow-up": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  breakup: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

interface SequenceBuilderProps {
  sequence: EmailSequence
}

export function SequenceBuilder({ sequence }: SequenceBuilderProps) {
  const [name, setName] = useState(sequence.name)
  const [status, setStatus] = useState(sequence.status)
  const [steps, setSteps] = useState<SequenceStep[]>(sequence.steps)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const toggleExpand = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const updateStep = (stepId: string, field: keyof SequenceStep, value: string | number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s))
    )
  }

  const addStep = () => {
    const newStep: SequenceStep = {
      id: `step-new-${Date.now()}`,
      order: steps.length + 1,
      delayDays: 3,
      subject: "",
      body: "",
      type: steps.length === 0 ? "initial" : "follow-up",
    }
    setSteps((prev) => [...prev, newStep])
    setExpandedSteps((prev) => new Set(prev).add(newStep.id))
  }

  const handleSave = () => {
    toast.success("Sequence saved", {
      description: `"${name}" has been saved.`,
    })
  }

  const handleActivate = () => {
    const nextStatus = status === "active" ? "paused" : "active"
    setStatus(nextStatus)
    toast.success(
      nextStatus === "active" ? "Sequence activated" : "Sequence paused",
      {
        description: `"${name}" is now ${nextStatus}.`,
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-semibold h-auto py-1 px-2 max-w-md"
          />
          <Badge
            variant="secondary"
            className={STATUS_COLORS[status] ?? ""}
          >
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave}>
            Save
          </Button>
          <Button onClick={handleActivate}>
            {status === "active" ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-0">
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(step.id)
          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border" />
                )}
              </div>

              <Card className="mb-4 flex-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="secondary"
                      className={TYPE_COLORS[step.type] ?? ""}
                    >
                      {step.type}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Wait</span>
                      <Input
                        type="number"
                        min={0}
                        value={step.delayDays}
                        onChange={(e) =>
                          updateStep(step.id, "delayDays", parseInt(e.target.value) || 0)
                        }
                        className="h-7 w-14 text-center text-sm"
                      />
                      <span>days</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Subject</Label>
                      <Input
                        value={step.subject}
                        onChange={(e) =>
                          updateStep(step.id, "subject", e.target.value)
                        }
                        placeholder="Email subject..."
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => toggleExpand(step.id)}
                      >
                        {isExpanded ? "Collapse body" : "Expand body"}
                      </button>
                      {isExpanded && (
                        <Textarea
                          value={step.body}
                          onChange={(e) =>
                            updateStep(step.id, "body", e.target.value)
                          }
                          placeholder="Email body..."
                          rows={6}
                          className="text-sm"
                        />
                      )}
                      {!isExpanded && step.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {step.body}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <Button variant="outline" onClick={addStep} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Step
      </Button>
    </div>
  )
}
