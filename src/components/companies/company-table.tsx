"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { Company } from "@/types"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

interface CompanyTableProps {
  companies: Company[]
}

type SortKey = "name" | "industry" | "employeeCount" | "location" | "fundingStage"
type SortDir = "asc" | "desc"

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

const fundingOrder: Record<string, number> = {
  "pre-seed": 0,
  seed: 1,
  "series-a": 2,
  "series-b": 3,
  "series-c": 4,
  "series-d-plus": 5,
  public: 6,
  bootstrapped: -1,
}

export function CompanyTable({ companies }: CompanyTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = useMemo(() => {
    return [...companies].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "industry":
          cmp = a.industry.localeCompare(b.industry)
          break
        case "employeeCount":
          cmp = a.employeeCount - b.employeeCount
          break
        case "location":
          cmp = a.location.localeCompare(b.location)
          break
        case "fundingStage":
          cmp = (fundingOrder[a.fundingStage] ?? 0) - (fundingOrder[b.fundingStage] ?? 0)
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [companies, sortKey, sortDir])

  function SortableHead({ label, field }: { label: string; field: SortKey }) {
    return (
      <TableHead>
        <button
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors -ml-1 px-1 py-0.5 rounded"
          onClick={() => handleSort(field)}
        >
          {label}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </TableHead>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Name" field="name" />
          <SortableHead label="Industry" field="industry" />
          <SortableHead label="Size" field="employeeCount" />
          <SortableHead label="Location" field="location" />
          <SortableHead label="Funding" field="fundingStage" />
          <TableHead>Technologies</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((company) => (
          <TableRow key={company.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/companies/${company.id}`}
                className="font-medium hover:underline underline-offset-4"
              >
                {company.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{company.industry}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {company.employeeRange}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {company.location}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {fundingLabel[company.fundingStage] ?? company.fundingStage}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {company.technologies.slice(0, 2).map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {company.technologies.length > 2 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{company.technologies.length - 2}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/companies/${company.id}`}>
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
