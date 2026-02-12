"use client"

import Link from "next/link"
import { Mail, Send, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmailList } from "@/components/outreach/email-list"
import { SequenceList } from "@/components/outreach/sequence-list"
import { useEmails } from "@/hooks/use-emails"
import { useSequences } from "@/hooks/use-sequences"
import type { EmailDraft } from "@/types"

function computeStats(emails: EmailDraft[]) {
  const sent = emails.filter(
    (e) => e.status === "sent" || e.status === "opened" || e.status === "replied"
  ).length
  const opened = emails.filter(
    (e) => e.status === "opened" || e.status === "replied"
  ).length
  const replied = emails.filter((e) => e.status === "replied").length
  return { sent, opened, replied }
}

export default function OutreachPage() {
  const { data: emailsData, isLoading: isLoadingEmails } = useEmails()
  const { data: sequencesData, isLoading: isLoadingSequences } = useSequences()

  const emails = emailsData?.data ?? []
  const sequences = sequencesData ?? []
  const stats = computeStats(emails)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach"
        description="Manage your email campaigns and sequences."
      >
        <Link
          href="/outreach/compose"
          className={cn(buttonVariants())}
        >
          <Plus className="mr-2 h-4 w-4" />
          Compose Email
        </Link>
      </PageHeader>

      <Tabs defaultValue="emails">
        <TabsList>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-500" />
                  {isLoadingEmails ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <span className="text-2xl font-bold">{stats.sent}</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Opened
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-500" />
                  {isLoadingEmails ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <span className="text-2xl font-bold">{stats.opened}</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Replied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-500" />
                  {isLoadingEmails ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <span className="text-2xl font-bold">{stats.replied}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {isLoadingEmails ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <EmailList emails={emails} />
          )}
        </TabsContent>

        <TabsContent value="sequences" className="mt-4">
          {isLoadingSequences ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <SequenceList sequences={sequences} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
