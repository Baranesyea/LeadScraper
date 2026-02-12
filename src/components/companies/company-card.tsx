"use client"

import Link from "next/link"
import type { Company } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Globe, MapPin, Users, DollarSign, Sparkles } from "lucide-react"

interface CompanyCardProps {
  company: Company
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

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/companies/${company.id}`} className="block group">
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{company.name}</CardTitle>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0">{company.industry}</Badge>
          </div>
          <CardDescription className="line-clamp-2 mt-1.5">
            {company.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{company.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>{company.employeeCount} employees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">
                {fundingLabel[company.fundingStage] ?? company.fundingStage}
              </Badge>
            </div>
            {company.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span
                  className="truncate text-foreground underline-offset-4 group-hover:underline"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(company.website, "_blank", "noopener,noreferrer")
                  }}
                >
                  {new URL(company.website).hostname}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Enrich
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
