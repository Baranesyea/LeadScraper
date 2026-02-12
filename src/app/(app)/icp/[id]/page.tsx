"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useIcp, useUpdateIcp } from "@/hooks/use-icps"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IcpForm, type IcpFormValues } from "@/components/icp/icp-form"

export default function EditIcpPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: icp, isLoading, error } = useIcp(params.id)
  const updateIcp = useUpdateIcp()

  async function handleSave(data: IcpFormValues) {
    try {
      await updateIcp.mutateAsync({ id: params.id, data })
      toast.success("ICP profile updated")
    } catch {
      toast.error("Failed to update ICP profile")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit ICP">
          <Button variant="outline" onClick={() => router.push("/icp")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-6 w-18" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !icp) {
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
