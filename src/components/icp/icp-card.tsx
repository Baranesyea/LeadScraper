import Link from "next/link"
import { Pencil, Trash2, Building2, MapPin, Tags } from "lucide-react"
import type { ICP } from "@/types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface IcpCardProps {
  icp: ICP
  onDelete: (id: string) => void
}

export function IcpCard({ icp, onDelete }: IcpCardProps) {
  const criteriaCount = [
    icp.industries.length > 0,
    icp.companySizeMin !== null || icp.companySizeMax !== null,
    icp.locations.length > 0,
    icp.technologies.length > 0,
    icp.fundingStages.length > 0,
    icp.revenueMin !== null || icp.revenueMax !== null,
    icp.keywords.length > 0,
  ].filter(Boolean).length

  const sizeRange =
    icp.companySizeMin !== null && icp.companySizeMax !== null
      ? `${icp.companySizeMin}-${icp.companySizeMax}`
      : icp.companySizeMin !== null
        ? `${icp.companySizeMin}+`
        : icp.companySizeMax !== null
          ? `Up to ${icp.companySizeMax}`
          : null

  return (
    <Card className="group hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5">
      <Link href={`/icp/${icp.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{icp.name}</CardTitle>
              <CardDescription>
                {criteriaCount} criteria defined
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {icp.industries.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>
                {icp.industries.length}{" "}
                {icp.industries.length === 1 ? "industry" : "industries"}
              </span>
            </div>
          )}
          {sizeRange && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tags className="h-4 w-4 shrink-0" />
              <span>{sizeRange} employees</span>
            </div>
          )}
          {icp.locations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                {icp.locations.length}{" "}
                {icp.locations.length === 1 ? "location" : "locations"}
              </span>
            </div>
          )}
          {icp.fundingStages.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {icp.fundingStages.slice(0, 3).map((stage) => (
                <Badge key={stage} variant="outline" className="text-xs">
                  {stage}
                </Badge>
              ))}
              {icp.fundingStages.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{icp.fundingStages.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="gap-2">
        <Link href={`/icp/${icp.id}`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(icp.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
