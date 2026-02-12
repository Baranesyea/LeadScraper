"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { mockICPs } from "@/lib/mock-data"
import type { ICP, FundingStage } from "@/types"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IcpForm, type IcpFormValues } from "@/components/icp/icp-form"

export default function EditIcpPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [icp, setIcp] = React.useState<ICP | undefined>(() =>
    mockICPs.find((item) => item.id === params.id)
  )

  if (!icp) {
    return (
      <div className="space-y-6">
        <PageHeader title="ICP Not Found">
          <Button variant="outline" onClick={() => router.push("/icp")}>
            <ArrowLeft className="h-4 w-4" />
            Back to ICPs
          </Button>
        </PageHeader>
        <p className="text-sm text-muted-foreground">
          The ICP profile you are looking for does not exist.
        </p>
      </div>
    )
  }

  function handleSave(data: IcpFormValues) {
    setIcp((prev) =>
      prev
        ? {
            ...prev,
            ...data,
            fundingStages: data.fundingStages as FundingStage[],
            updatedAt: new Date().toISOString(),
          }
        : prev
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit ICP" description={icp.name}>
        <Button variant="outline" onClick={() => router.push("/icp")}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <IcpForm
            initialData={icp}
            onSave={handleSave}
            onCancel={() => router.push("/icp")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
