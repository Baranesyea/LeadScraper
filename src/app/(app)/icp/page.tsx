"use client"

import * as React from "react"
import { Plus, Target } from "lucide-react"
import { mockICPs } from "@/lib/mock-data"
import type { ICP, FundingStage } from "@/types"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
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
  const [icps, setIcps] = React.useState<ICP[]>(mockICPs)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  function handleCreate(data: IcpFormValues) {
    const newIcp: ICP = {
      ...data,
      id: `icp-${Date.now()}`,
      fundingStages: data.fundingStages as FundingStage[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setIcps((prev) => [...prev, newIcp])
    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    setIcps((prev) => prev.filter((icp) => icp.id !== id))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ICP Profiles" description="Define your ideal customer profiles to target the right companies.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
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

      {icps.length === 0 ? (
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
