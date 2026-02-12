"use client"

import Link from "next/link"
import type { Company } from "@/types"
import { useContacts } from "@/hooks/use-contacts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CompanyNewsList } from "@/components/companies/company-news"
import {
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

interface CompanyPanelProps {
  company: Company | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function CompanyPanel({ company, open, onOpenChange }: CompanyPanelProps) {
  const { data: contactsData, isLoading: contactsLoading } = useContacts(
    company ? { companyId: company.id } : {}
  )

  const contacts = contactsData?.data ?? []

  function handleEnrich() {
    if (!company) return
    toast.success(`Enrichment started for ${company.name}`, {
      description: "We'll notify you when the data is ready.",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="half" className="p-0 flex flex-col">
        {company ? (
          <>
            {/* Header */}
            <div className="p-6 pb-4 border-b">
              <SheetHeader className="text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <SheetTitle className="text-xl truncate">
                        {company.name}
                      </SheetTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{company.industry}</Badge>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {new URL(company.website).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={handleEnrich}>
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Enrich
                    </Button>
                    <Link href={`/companies/${company.id}`}>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-3.5 w-3.5 mr-1" />
                        Full page
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Location
                    </div>
                    <p className="font-medium text-sm">{company.location}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                      <Users className="h-3.5 w-3.5" />
                      Employees
                    </div>
                    <p className="font-medium text-sm">{company.employeeCount.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Funding
                    </div>
                    <p className="font-medium text-sm">
                      {fundingLabel[company.fundingStage] ?? company.fundingStage}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Total Raised
                    </div>
                    <p className="font-medium text-sm">
                      {company.fundingAmount ? formatCurrency(company.fundingAmount) : "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* About */}
              <div>
                <h3 className="text-sm font-semibold mb-1.5">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {company.description}
                </p>
              </div>

              {/* Technologies */}
              {company.technologies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-1.5">Technologies</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {company.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* News */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Recent News</h3>
                <CompanyNewsList news={company.news} />
              </div>

              <Separator />

              {/* Key Contacts */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Key Contacts</h3>
                {contactsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contacts found.</p>
                ) : (
                  <div className="space-y-2">
                    {contacts.slice(0, 3).map((contact) => (
                      <Link
                        key={contact.id}
                        href={`/contacts/${contact.id}`}
                        className="block"
                        onClick={() => onOpenChange(false)}
                      >
                        <Card className="transition-colors hover:border-foreground/20">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{contact.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                            </div>
                            {contact.workEmail && (
                              <p className="text-xs text-muted-foreground truncate ml-4">
                                {contact.workEmail}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <Skeleton className="h-12 w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
