import type { Contact } from "@/types"

interface ContactSocialsProps {
  contact: Contact
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

const socialLinks = [
  {
    key: "linkedinUrl" as const,
    label: "LinkedIn",
    icon: LinkedInIcon,
  },
  {
    key: "facebookUrl" as const,
    label: "Facebook",
    icon: FacebookIcon,
  },
  {
    key: "instagramUrl" as const,
    label: "Instagram",
    icon: InstagramIcon,
  },
] as const

export function ContactSocials({ contact }: ContactSocialsProps) {
  const available = socialLinks.filter((s) => contact[s.key] != null)

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No social profiles available.</p>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {available.map((social) => {
        const Icon = social.icon
        const url = contact[social.key]!
        return (
          <a
            key={social.key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-4 w-4" />
            <span>{social.label}</span>
          </a>
        )
      })}
    </div>
  )
}
