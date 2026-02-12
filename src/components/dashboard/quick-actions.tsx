"use client"

import Link from "next/link"
import { Target, Building2, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const actions = [
  {
    label: "Define ICP",
    href: "/icp",
    icon: Target,
    description: "Set your ideal customer profile",
  },
  {
    label: "Find Companies",
    href: "/companies",
    icon: Building2,
    description: "Discover matching companies",
  },
  {
    label: "Compose Email",
    href: "/outreach",
    icon: Mail,
    description: "Draft and send outreach",
  },
]

export function QuickActions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-auto gap-2.5 px-4 py-2.5"
          )}
        >
          <action.icon className="h-4 w-4 shrink-0" />
          <div className="text-left">
            <div className="text-sm font-medium leading-none">
              {action.label}
            </div>
            <div className="mt-1 text-xs font-normal text-muted-foreground">
              {action.description}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
