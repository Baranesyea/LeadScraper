"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Mail, Shield, Zap, Bell } from "lucide-react"

export default function SettingsPage() {
  const [emailConnected, setEmailConnected] = useState(false)
  const [dailyLimit] = useState(5)
  const [notifications, setNotifications] = useState(true)
  const [autoEnrich, setAutoEnrich] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, email configuration, and preferences."
      />

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
          <CardDescription>
            Connect your email account to send outreach emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailConnected ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">team@floeey.com</p>
                  <p className="text-xs text-muted-foreground">Connected via SMTP</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">Connected</Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input id="smtp-host" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password / App Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              setEmailConnected(!emailConnected)
              toast.success(emailConnected ? "Email disconnected" : "Email connected successfully")
            }}
          >
            {emailConnected ? "Disconnect" : "Connect Email"}
          </Button>
        </CardFooter>
      </Card>

      {/* Sending Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Sending Limits</CardTitle>
          </div>
          <CardDescription>
            Control your daily email sending volume. Start low for better deliverability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Daily Send Limit</p>
              <p className="text-xs text-muted-foreground">
                Maximum number of emails sent per day
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{dailyLimit}</span>
              <span className="text-sm text-muted-foreground">emails/day</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            We recommend keeping this low (5-10/day) for highly personalized outreach.
            Quality over quantity yields better response rates.
          </p>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when leads reply to your emails
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Enrich New Leads</Label>
              <p className="text-xs text-muted-foreground">
                Automatically enrich data when new companies are discovered
              </p>
            </div>
            <Switch checked={autoEnrich} onCheckedChange={setAutoEnrich} />
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <CardDescription>
            API keys for data enrichment services (coming soon).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api-key-1">Enrichment API Key</Label>
              <Input id="api-key-1" placeholder="sk-..." disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key-2">Search API Key</Label>
              <Input id="api-key-2" placeholder="sk-..." disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            API integrations will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
