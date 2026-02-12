"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue>({ open: false, setOpen: () => {} })

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(SheetContext)
  return <button className={className} onClick={() => setOpen(true)} {...props}>{children}</button>
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom"
  size?: "sm" | "half" | "lg"
}

function SheetContent({ children, className, side = "right", size = "sm", ...props }: SheetContentProps) {
  const { open, setOpen } = React.useContext(SheetContext)
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

  if (!mounted || !open) return null

  const sizeClasses = {
    sm: "w-3/4 max-w-sm",
    half: "w-full max-w-[50vw]",
    lg: "w-full max-w-[75vw]",
  }

  const sideClasses = {
    right: `inset-y-0 right-0 h-full border-l ${sizeClasses[size]}`,
    left: `inset-y-0 left-0 h-full border-r ${sizeClasses[size]}`,
    top: "inset-x-0 top-0 border-b",
    bottom: "inset-x-0 bottom-0 border-t",
  }

  const slideClasses = {
    right: visible ? "translate-x-0" : "translate-x-full",
    left: visible ? "translate-x-0" : "-translate-x-full",
    top: visible ? "translate-y-0" : "-translate-y-full",
    bottom: visible ? "translate-y-0" : "translate-y-full",
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className={cn("fixed inset-0 bg-black/50 transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")}
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out overflow-y-auto",
          sideClasses[side],
          slideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter }
