import Link from "next/link"
import { Plus, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { mockEmailSequences } from "@/lib/mock-data"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
}

export function SequenceList() {
  if (mockEmailSequences.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Link
            href="/outreach/sequences/new"
            className={cn(buttonVariants())}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Sequence
          </Link>
        </div>
        <EmptyState
          icon={Mail}
          title="No sequences yet"
          description="Create your first email sequence to automate outreach follow-ups."
        >
          <Link
            href="/outreach/sequences/new"
            className={cn(buttonVariants())}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Sequence
          </Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/outreach/sequences/new"
          className={cn(buttonVariants())}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Sequence
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockEmailSequences.map((sequence) => (
          <Link key={sequence.id} href={`/outreach/sequences/${sequence.id}`}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{sequence.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[sequence.status] ?? ""}
                  >
                    {sequence.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Created{" "}
                  {new Date(sequence.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {sequence.steps.length}{" "}
                    {sequence.steps.length === 1 ? "step" : "steps"}
                  </span>
                  <span>
                    {sequence.enrolledContactIds.length}{" "}
                    {sequence.enrolledContactIds.length === 1
                      ? "contact"
                      : "contacts"}{" "}
                    enrolled
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
