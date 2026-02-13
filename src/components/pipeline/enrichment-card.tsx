"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  MessageSquare,
  Globe,
  Monitor,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  Lightbulb,
  Zap,
  AlertTriangle,
} from "lucide-react"
import type { EnrichmentData } from "@/types"

interface EnrichmentCardProps {
  data: EnrichmentData
}

const priorityConfig = {
  HIGH: { label: "High Priority", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  MEDIUM: { label: "Medium Priority", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  LOW: { label: "Low Priority", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
}

export function EnrichmentCard({ data }: EnrichmentCardProps) {
  const priority = data.leadPriority ? priorityConfig[data.leadPriority as keyof typeof priorityConfig] : null

  return (
    <div className="space-y-4">
      {/* Priority Badge */}
      {priority && (
        <Badge variant="outline" className={priority.className}>
          {priority.label} — {data.crmDetected === "none" ? "No CRM Detected" : data.crmDetected === "basic" ? `Basic CRM (${data.crmName})` : `Full CRM (${data.crmName})`}
        </Badge>
      )}

      {/* Google Business */}
      {data.googleRating !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Google Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Rating</p>
                <p className="font-semibold flex items-center gap-1">
                  {data.googleRating?.toFixed(1)}
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Reviews</p>
                <p className="font-semibold">{data.googleReviewCount?.toLocaleString()}</p>
              </div>
              {data.reviewSentiment && (
                <div>
                  <p className="text-muted-foreground">Sentiment</p>
                  <Badge variant="outline" className={
                    data.reviewSentiment === "positive" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    data.reviewSentiment === "mixed" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-red-500/10 text-red-600 border-red-500/20"
                  }>
                    {data.reviewSentiment}
                  </Badge>
                </div>
              )}
              {data.googleCategory && (
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{data.googleCategory}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Website Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Website Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Website</p>
              <p className="font-medium">{data.hasWebsite ? "Yes" : "No website"}</p>
            </div>
            {data.crmDetected && (
              <div>
                <p className="text-muted-foreground">CRM</p>
                <p className="font-medium">{data.crmName || data.crmDetected}</p>
              </div>
            )}
            {data.websiteQuality !== null && (
              <div>
                <p className="text-muted-foreground">Quality Score</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (data.websiteQuality || 0) >= 70 ? "bg-emerald-500" :
                        (data.websiteQuality || 0) >= 40 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${data.websiteQuality}%` }}
                    />
                  </div>
                  <span className="font-semibold">{data.websiteQuality}</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">SSL / IDX</p>
              <p className="font-medium">
                {data.hasSsl ? "SSL" : "No SSL"}
                {" / "}
                {data.hasIdx ? "IDX" : "No IDX"}
              </p>
            </div>
          </div>
          {data.techStack.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {data.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Presence */}
      {(data.fbPageUrl || data.igFollowers || data.ytHasChannel || data.linkedinHeadline) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Social Presence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {data.fbPageUrl && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span>Facebook</span>
                  </div>
                  <span className="text-muted-foreground">{data.fbFollowers?.toLocaleString()} followers · {data.fbPostFrequency}</span>
                </div>
              )}
              {data.igFollowers && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <span>Instagram</span>
                  </div>
                  <span className="text-muted-foreground">{data.igFollowers?.toLocaleString()} followers · {data.igPostFrequency}</span>
                </div>
              )}
              {data.ytHasChannel && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600" />
                    <span>YouTube</span>
                  </div>
                  <span className="text-muted-foreground">{data.ytVideoCount} videos</span>
                </div>
              )}
              {data.linkedinHeadline && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    <span>LinkedIn</span>
                  </div>
                  <span className="text-muted-foreground">{data.linkedinConnections?.toLocaleString()} connections</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Signals */}
      {data.signals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Business Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.signals.map((signal, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                    signal.severity === "CRITICAL" ? "text-red-500" :
                    signal.severity === "HIGH" ? "text-amber-500" : "text-blue-500"
                  }`} />
                  <div>
                    <p className="font-medium">{signal.description}</p>
                    <p className="text-xs text-muted-foreground">{signal.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalization Hooks */}
      {data.hooks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Personalization Hooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.hooks.map((hook, i) => (
                <div key={i} className="rounded-lg border bg-muted/50 p-3 text-sm italic">
                  "{hook.text}"
                  <p className="mt-1 text-xs text-muted-foreground not-italic">
                    Based on: {hook.signal}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
