"use client"

import Link from "next/link"
import { Mail, Send, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { EmailList } from "@/components/outreach/email-list"
import { SequenceList } from "@/components/outreach/sequence-list"
import { mockEmailDrafts } from "@/lib/mock-data"

function computeStats() {
  const sent = mockEmailDrafts.filter(
    (e) => e.status === "sent" || e.status === "opened" || e.status === "replied"
  ).length
  const opened = mockEmailDrafts.filter(
    (e) => e.status === "opened" || e.status === "replied"
  ).length
  const replied = mockEmailDrafts.filter((e) => e.status === "replied").length
  return { sent, opened, replied }
}

export default function OutreachPage() {
  const stats = computeStats()

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
                  <span className="text-2xl font-bold">{stats.sent}</span>
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
                  <span className="text-2xl font-bold">{stats.opened}</span>
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
                  <span className="text-2xl font-bold">{stats.replied}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <EmailList />
        </TabsContent>

        <TabsContent value="sequences" className="mt-4">
          <SequenceList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
