"use client"

import { useState, useRef, useCallback } from "react"
import { Send, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useContacts } from "@/hooks/use-contacts"
import { useCreateEmail } from "@/hooks/use-emails"
import { MERGE_VARIABLES } from "@/lib/constants"
import type { Contact } from "@/types"

const SAMPLE_DATA: Record<string, string> = {
  firstName: "Sarah",
  lastName: "Chen",
  fullName: "Sarah Chen",
  companyName: "Velora AI",
  title: "CEO & Co-Founder",
  industry: "AI/ML",
  newsHeadline: "Velora AI Raises $18M Series A to Scale Document Intelligence Platform",
}

export function EmailComposer() {
  const [toQuery, setToQuery] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const { data: contactsData } = useContacts({
    search: toQuery.length >= 2 ? toQuery : undefined,
    limit: 8,
  })
  const filteredContacts = contactsData?.data ?? []

  const createEmail = useCreateEmail()

  const insertMergeVariable = useCallback(
    (variableKey: string) => {
      const textarea = bodyRef.current
      if (!textarea) return
      const tag = `{{${variableKey}}}`
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newBody = body.slice(0, start) + tag + body.slice(end)
      setBody(newBody)
      requestAnimationFrame(() => {
        textarea.focus()
        const pos = start + tag.length
        textarea.setSelectionRange(pos, pos)
      })
    },
    [body]
  )

  const previewText = useCallback(
    (text: string) => {
      let result = text
      for (const [key, value] of Object.entries(SAMPLE_DATA)) {
        result = result.replaceAll(`{{${key}}}`, value)
      }
      return result
    },
    []
  )

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setToQuery(contact.workEmail ?? contact.fullName)
    setShowDropdown(false)
  }

  const handleSend = async () => {
    if (!selectedContact) return
    try {
      await createEmail.mutateAsync({
        contactId: selectedContact.id,
        subject,
        body,
        status: "scheduled",
      })
      toast.success("Email scheduled", {
        description: `Email to ${selectedContact.fullName} has been scheduled.`,
      })
      setSubject("")
      setBody("")
      setSelectedContact(null)
      setToQuery("")
    } catch {
      toast.error("Failed to schedule email", {
        description: "Something went wrong. Please try again.",
      })
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedContact) return
    try {
      await createEmail.mutateAsync({
        contactId: selectedContact.id,
        subject,
        body,
        status: "draft",
      })
      toast("Draft saved", {
        description: "Your email has been saved as a draft.",
      })
    } catch {
      toast.error("Failed to save draft", {
        description: "Something went wrong. Please try again.",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <div className="relative">
            <Input
              id="to"
              placeholder="Search contacts..."
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value)
                setShowDropdown(true)
                if (!e.target.value) setSelectedContact(null)
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowDropdown(false), 200)
              }}
            />
            {showDropdown && toQuery.length >= 2 && filteredContacts.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                <div className="max-h-48 overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectContact(contact)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{contact.fullName}</span>
                        <span className="text-xs text-muted-foreground">
                          {contact.title} at {contact.companyName}
                          {contact.workEmail && ` - ${contact.workEmail}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject line..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            ref={bodyRef}
            placeholder="Write your email body here. Use merge variables below to personalize..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="min-h-[180px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Insert merge variable
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MERGE_VARIABLES.map((v) => (
              <Badge
                key={v.key}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => insertMergeVariable(v.key)}
              >
                {`{{${v.key}}}`}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSend}
            disabled={!selectedContact || !subject || !body || createEmail.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {createEmail.isPending ? "Sending..." : "Send"}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={(!subject && !body) || !selectedContact || createEmail.isPending}
          >
            Save Draft
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">To</p>
                <p className="text-sm">
                  {selectedContact
                    ? `${selectedContact.fullName} <${selectedContact.workEmail ?? "no email"}>`
                    : toQuery || "No recipient selected"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">
                  {previewText(subject) || "No subject"}
                </p>
              </div>
              <Separator />
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {previewText(body) || "No content yet..."}
              </div>
            </TabsContent>
            <TabsContent value="raw" className="mt-4">
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Subject: {subject}</p>
                <pre className="whitespace-pre-wrap text-xs font-mono">{body || "No content yet..."}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
