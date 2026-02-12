"use client"

import * as React from "react"
import { Plus, Target } from "lucide-react"
import { toast } from "sonner"
import { useIcps, useCreateIcp, useDeleteIcp } from "@/hooks/use-icps"
import type { ICP } from "@/types"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { IcpCard } from "@/components/icp/icp-card"
import { IcpForm, type IcpFormValues } from "@/components/icp/icp-form"

export default function IcpPage() {
  const { data: icps = [], isLoading, error } = useIcps()
  const createIcp = useCreateIcp()
  const deleteIcp = useDeleteIcp()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  async function handleCreate(data: IcpFormValues) {
    try {
      await createIcp.mutateAsync(data)
      setDialogOpen(false)
      toast.success("ICP profile created")
    } catch {
      toast.error("Failed to create ICP profile")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteIcp.mutateAsync(id)
      toast.success("ICP profile deleted")
    } catch {
      toast.error("Failed to delete ICP profile")
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="ICP Profiles" description="Define your ideal customer profiles to target the right companies." />
        <p className="text-sm text-destructive">
          Failed to load ICP profiles. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ICP Profiles" description="Define your ideal customer profiles to target the right companies.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)} disabled={createIcp.isPending}>
            <Plus className="h-4 w-4" />
            Create New
          </Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create ICP Profile</DialogTitle>
              <DialogDescription>
                Define the characteristics of your ideal customer.
              </DialogDescription>
            </DialogHeader>
            <IcpForm
              onSave={handleCreate}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : icps.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No ICP profiles yet"
          description="Create your first Ideal Customer Profile to start targeting the right companies."
        >
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {icps.map((icp) => (
            <IcpCard key={icp.id} icp={icp} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
