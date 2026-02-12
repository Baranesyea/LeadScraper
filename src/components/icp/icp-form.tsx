"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { X } from "lucide-react"
import { toast } from "sonner"
import type { FundingStage } from "@/types"
import { INDUSTRIES, FUNDING_STAGES, LOCATIONS, TECHNOLOGIES } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MultiSelect } from "@/components/icp/multi-select"

export interface IcpFormValues {
  name: string
  industries: string[]
  companySizeMin: number | null
  companySizeMax: number | null
  locations: string[]
  technologies: string[]
  fundingStages: string[]
  revenueMin: number | null
  revenueMax: number | null
  keywords: string[]
}

interface IcpFormProps {
  initialData?: IcpFormValues
  onSave: (data: IcpFormValues) => void
  onCancel: () => void
}

export function IcpForm({ initialData, onSave, onCancel }: IcpFormProps) {
  const [keywordInput, setKeywordInput] = React.useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IcpFormValues>({
    defaultValues: {
      name: initialData?.name ?? "",
      industries: initialData?.industries ?? [],
      companySizeMin: initialData?.companySizeMin ?? null,
      companySizeMax: initialData?.companySizeMax ?? null,
      locations: initialData?.locations ?? [],
      technologies: initialData?.technologies ?? [],
      fundingStages: initialData?.fundingStages ?? [],
      revenueMin: initialData?.revenueMin ?? null,
      revenueMax: initialData?.revenueMax ?? null,
      keywords: initialData?.keywords ?? [],
    },
  })

  const industries = watch("industries")
  const locations = watch("locations")
  const technologies = watch("technologies")
  const fundingStages = watch("fundingStages")
  const keywords = watch("keywords")

  function toggleFundingStage(stage: FundingStage) {
    const current = fundingStages
    if (current.includes(stage)) {
      setValue(
        "fundingStages",
        current.filter((s) => s !== stage)
      )
    } else {
      setValue("fundingStages", [...current, stage])
    }
  }

  function addKeyword(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = keywordInput.trim()
      if (value && !keywords.includes(value)) {
        setValue("keywords", [...keywords, value])
      }
      setKeywordInput("")
    }
  }

  function removeKeyword(keyword: string) {
    setValue(
      "keywords",
      keywords.filter((k) => k !== keyword)
    )
  }

  function onSubmit(data: IcpFormValues) {
    if (!data.name.trim()) return
    onSave(data)
    toast.success(
      initialData ? "ICP profile updated" : "ICP profile created"
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="e.g. High-Growth B2B SaaS"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <Separator />

      {/* Industries */}
      <div className="space-y-2">
        <Label>Industries</Label>
        <MultiSelect
          options={[...INDUSTRIES]}
          selected={industries}
          onSelectedChange={(val) => setValue("industries", val)}
          placeholder="Select industries"
        />
      </div>

      {/* Company Size Range */}
      <div className="space-y-2">
        <Label>Company Size (employees)</Label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Min"
            {...register("companySizeMin", {
              setValueAs: (v: string) => (v === "" ? null : Number(v)),
            })}
          />
          <Input
            type="number"
            placeholder="Max"
            {...register("companySizeMax", {
              setValueAs: (v: string) => (v === "" ? null : Number(v)),
            })}
          />
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <Label>Locations</Label>
        <MultiSelect
          options={[...LOCATIONS]}
          selected={locations}
          onSelectedChange={(val) => setValue("locations", val)}
          placeholder="Select locations"
        />
      </div>

      {/* Technologies */}
      <div className="space-y-2">
        <Label>Technologies</Label>
        <MultiSelect
          options={[...TECHNOLOGIES]}
          selected={technologies}
          onSelectedChange={(val) => setValue("technologies", val)}
          placeholder="Select technologies"
        />
      </div>

      <Separator />

      {/* Funding Stages */}
      <div className="space-y-2">
        <Label>Funding Stages</Label>
        <div className="flex flex-wrap gap-2">
          {FUNDING_STAGES.map(({ value, label }) => {
            const isActive = fundingStages.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleFundingStage(value)}
              >
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {label}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Revenue Range */}
      <div className="space-y-2">
        <Label>Revenue Range ($)</Label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Min"
            {...register("revenueMin", {
              setValueAs: (v: string) => (v === "" ? null : Number(v)),
            })}
          />
          <Input
            type="number"
            placeholder="Max"
            {...register("revenueMax", {
              setValueAs: (v: string) => (v === "" ? null : Number(v)),
            })}
          />
        </div>
      </div>

      <Separator />

      {/* Keywords */}
      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords</Label>
        <Input
          id="keywords"
          placeholder="Type a keyword and press Enter"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={addKeyword}
        />
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="gap-1">
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="rounded-full outline-none hover:bg-foreground/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}
