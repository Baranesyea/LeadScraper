"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, Shield, Zap, Bell } from "lucide-react"
import { useSettings, useUpdateSettings } from "@/hooks/use-settings"

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const { mutateAsync, isPending } = useUpdateSettings()

  // SMTP form state
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("")
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [fromEmail, setFromEmail] = useState("")

  // AI / API Keys form state
  const [aiApiKey, setAiApiKey] = useState("")
  const [aiProvider, setAiProvider] = useState("")

  // Preferences (local only, not in SettingsData)
  const [notifications, setNotifications] = useState(true)
  const [autoEnrich, setAutoEnrich] = useState(false)

  // Initialize form state from API data
  useEffect(() => {
    if (settings) {
      setSmtpHost(settings.smtpHost ?? "")
      setSmtpPort(settings.smtpPort ? String(settings.smtpPort) : "")
      setSmtpUser(settings.smtpUser ?? "")
      setSmtpPass(settings.smtpPass ?? "")
      setFromEmail(settings.fromEmail ?? "")
      setAiApiKey(settings.aiApiKey ?? "")
      setAiProvider(settings.aiProvider ?? "")
    }
  }, [settings])

  const emailConnected = Boolean(settings?.smtpHost)

  const handleConnectEmail = async () => {
    try {
      await mutateAsync({
        smtpHost,
        smtpPort: smtpPort ? Number(smtpPort) : 587,
        smtpUser,
        smtpPass,
        fromEmail,
      })
      toast.success("Email connected successfully")
    } catch {
      toast.error("Failed to save email settings")
    }
  }

  const handleDisconnectEmail = async () => {
    try {
      await mutateAsync({
        smtpHost: "",
        smtpPort: 0,
        smtpUser: "",
        smtpPass: "",
        fromEmail: "",
      })
      toast.success("Email disconnected")
    } catch {
      toast.error("Failed to disconnect email")
    }
  }

  const handleSaveApiKeys = async () => {
    try {
      await mutateAsync({ aiApiKey, aiProvider })
      toast.success("API keys saved successfully")
    } catch {
      toast.error("Failed to save API keys")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your account, email configuration, and preferences."
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                  <p className="text-sm font-medium">{settings?.fromEmail || settings?.smtpUser}</p>
                  <p className="text-xs text-muted-foreground">Connected via SMTP ({settings?.smtpHost})</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">Connected</Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    placeholder="you@company.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">Password / App Password</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    placeholder="••••••••"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="from-email">From Email Address</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="you@company.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            disabled={isPending}
            onClick={emailConnected ? handleDisconnectEmail : handleConnectEmail}
          >
            {isPending
              ? "Saving..."
              : emailConnected
                ? "Disconnect"
                : "Connect Email"}
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
              <span className="text-2xl font-bold">{settings?.dailySendLimit ?? 0}</span>
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
            Configure your AI provider and API key for lead enrichment and email generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">AI Provider</Label>
              <Input
                id="ai-provider"
                placeholder="openai"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-api-key">AI API Key</Label>
              <Input
                id="ai-api-key"
                type="password"
                placeholder="sk-..."
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled={isPending} onClick={handleSaveApiKeys}>
            {isPending ? "Saving..." : "Save API Keys"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
