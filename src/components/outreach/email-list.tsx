import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { Mail } from "lucide-react"
import { EMAIL_STATUSES } from "@/lib/constants"
import type { EmailDraft } from "@/types"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  opened: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  replied: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

interface EmailListProps {
  emails: EmailDraft[]
}

export function EmailList({ emails }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No emails yet"
        description="Compose your first email to start reaching out to contacts."
      />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => {
            const statusConfig = EMAIL_STATUSES.find(
              (s) => s.value === email.status
            )
            return (
              <TableRow key={email.id}>
                <TableCell className="font-medium">
                  {email.contactName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {email.companyName}
                </TableCell>
                <TableCell className="max-w-[240px] truncate">
                  {email.subject}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={STATUS_STYLES[email.status] ?? ""}
                  >
                    {statusConfig?.label ?? email.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(email.sentAt)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
