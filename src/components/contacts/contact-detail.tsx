"use client"

import Link from "next/link"
import { Mail, Phone, Copy, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ContactSocials } from "@/components/contacts/contact-socials"
import { ContactArticles } from "@/components/contacts/contact-articles"
import type { Contact } from "@/types"

interface ContactDetailProps {
  contact: Contact
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success("Copied to clipboard")
}

export function ContactDetail({ contact }: ContactDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">
            {getInitials(contact.firstName, contact.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {contact.fullName}
          </h2>
          <p className="text-muted-foreground">{contact.title}</p>
          <Link
            href={`/companies/${contact.companyId}`}
            className="text-sm text-primary hover:underline"
          >
            {contact.companyName}
          </Link>
        </div>
      </div>

      <Separator />

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Work Email */}
            {contact.workEmail && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Work Email</p>
                  <p className="text-sm font-medium truncate">{contact.workEmail}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(contact.workEmail!)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Personal Email */}
            {contact.personalEmail && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Personal Email</p>
                  <p className="text-sm font-medium truncate">{contact.personalEmail}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(contact.personalEmail!)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Work Phone */}
            {contact.workPhone && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Work Phone</p>
                  <p className="text-sm font-medium">{contact.workPhone}</p>
                </div>
              </div>
            )}

            {/* Personal Phone */}
            {contact.personalPhone && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Personal Phone</p>
                  <p className="text-sm font-medium">{contact.personalPhone}</p>
                </div>
              </div>
            )}

            {/* No contact info at all */}
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
        <CardHeader>
          <CardTitle className="text-base">Social Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactSocials contact={contact} />
        </CardContent>
      </Card>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Articles</CardTitle>
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
        >
          <Mail className="h-4 w-4" />
          Compose Email
        </Link>
        <Button
          variant="outline"
          onClick={() => {
            toast.success("Enrichment started", {
              description: `Enriching contact data for ${contact.fullName}...`,
            })
          }}
        >
          <Sparkles className="h-4 w-4" />
          Enrich Contact
        </Button>
      </div>
    </div>
  )
}
