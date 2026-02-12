"use client"

import Link from "next/link"
import type { Company, Contact } from "@/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CompanyNewsList } from "@/components/companies/company-news"
import {
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

interface CompanyDetailProps {
  company: Company
  contacts: Contact[]
}

const fundingLabel: Record<string, string> = {
  "pre-seed": "Pre-Seed",
  seed: "Seed",
  "series-a": "Series A",
  "series-b": "Series B",
  "series-c": "Series C",
  "series-d-plus": "Series D+",
  public: "Public",
  bootstrapped: "Bootstrapped",
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount}`
}

export function CompanyDetail({ company, contacts }: CompanyDetailProps) {
  function handleEnrich() {
    toast.success(`Enrichment started for ${company.name}`, {
      description: "We'll notify you when the data is ready.",
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {company.name}
              </h1>
              <Badge variant="secondary">{company.industry}</Badge>
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {new URL(company.website).hostname}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <Button onClick={handleEnrich}>
          <Sparkles className="h-4 w-4 mr-1.5" />
          Enrich Company
        </Button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            <p className="font-medium text-sm">{company.location}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Employees
            </div>
            <p className="font-medium text-sm">{company.employeeCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Funding Stage
            </div>
            <p className="font-medium text-sm">
              {fundingLabel[company.fundingStage] ?? company.fundingStage}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Total Raised
            </div>
            <p className="font-medium text-sm">
              {company.fundingAmount ? formatCurrency(company.fundingAmount) : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <div>
        <h2 className="text-lg font-semibold mb-2">About</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {company.description}
        </p>
      </div>

      {/* Technologies */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Technologies</h2>
        <div className="flex flex-wrap gap-2">
          {company.technologies.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* News */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent News</h2>
        <CompanyNewsList news={company.news} />
      </div>

      <Separator />

      {/* Key Contacts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contacts found for this company.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.slice(0, 3).map((contact) => (
              <Link key={contact.id} href={`/contacts/${contact.id}`} className="block">
                <Card className="transition-colors hover:border-foreground/20">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">{contact.fullName}</CardTitle>
                    <p className="text-xs text-muted-foreground">{contact.title}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-1">
                    {contact.workEmail && (
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.workEmail}
                      </p>
                    )}
                    {contact.linkedinUrl && (
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
