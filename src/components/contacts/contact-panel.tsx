"use client"

import Link from "next/link"
import type { Contact } from "@/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { ContactSocials } from "@/components/contacts/contact-socials"
import { ContactArticles } from "@/components/contacts/contact-articles"
import {
  Mail,
  Phone,
  Copy,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

interface ContactPanelProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success("Copied to clipboard")
}

export function ContactPanel({ contact, open, onOpenChange }: ContactPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="half" className="p-0 flex flex-col">
        {contact ? (
          <>
            {/* Header */}
            <div className="p-6 pb-4 border-b">
              <SheetHeader className="text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="text-sm">
                        {getInitials(contact.firstName, contact.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <SheetTitle className="text-xl truncate">
                        {contact.fullName}
                      </SheetTitle>
                      <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
                      <Link
                        href={`/companies/${contact.companyId}`}
                        className="text-sm text-primary hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        {contact.companyName}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.success("Enrichment started", {
                          description: `Enriching contact data for ${contact.fullName}...`,
                        })
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Enrich
                    </Button>
                    <Link href={`/contacts/${contact.id}`}>
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
              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {contact.workEmail && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Work Email</p>
                          <p className="text-sm font-medium truncate">{contact.workEmail}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyToClipboard(contact.workEmail!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {contact.personalEmail && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Personal Email</p>
                          <p className="text-sm font-medium truncate">{contact.personalEmail}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyToClipboard(contact.personalEmail!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {contact.workPhone && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Work Phone</p>
                          <p className="text-sm font-medium">{contact.workPhone}</p>
                        </div>
                      </div>
                    )}

                    {contact.personalPhone && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Personal Phone</p>
                          <p className="text-sm font-medium">{contact.personalPhone}</p>
                        </div>
                      </div>
                    )}

                    {!contact.workEmail &&
                      !contact.personalEmail &&
                      !contact.workPhone &&
                      !contact.personalPhone && (
                        <p className="text-sm text-muted-foreground col-span-2">
                          No contact information available.
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Social Profiles */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Social Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactSocials contact={contact} />
                </CardContent>
              </Card>

              {/* Recent Articles */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactArticles articles={contact.articles} />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Link
                  href="/outreach/compose"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                  onClick={() => onOpenChange(false)}
                >
                  <Mail className="h-4 w-4" />
                  Compose Email
                </Link>
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
