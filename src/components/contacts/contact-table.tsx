"use client"

import { useState } from "react"
import { Search, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmailStatusBadge } from "@/components/pipeline/email-status-badge"
import { LeadScoreBadge } from "@/components/pipeline/lead-score-badge"
import type { Contact } from "@/types"

interface ContactTableProps {
  contacts: Contact[]
  onSelect?: (contact: Contact) => void
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function ContactTable({ contacts, onSelect }: ContactTableProps) {
  const [search, setSearch] = useState("")

  const filtered = contacts.filter((contact) => {
    const query = search.toLowerCase()
    return (
      contact.fullName.toLowerCase().includes(query) ||
      contact.companyName.toLowerCase().includes(query) ||
      contact.title.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>LinkedIn</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer"
                  onClick={() => onSelect?.(contact)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium hover:underline">{contact.fullName}</span>
                        <p className="text-xs text-muted-foreground">{contact.title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.companyName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {contact.workEmail ?? "--"}
                  </TableCell>
                  <TableCell>
                    <EmailStatusBadge
                      status={contact.emailStatus ?? "unverified"}
                      confidence={contact.emailConfidence}
                    />
                  </TableCell>
                  <TableCell>
                    {contact.leadScore > 0 ? (
                      <LeadScoreBadge
                        score={contact.leadScore}
                        tier={contact.leadTier ?? "cold"}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.linkedinUrl ? (
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                      onClick={() => onSelect?.(contact)}
                    >
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
