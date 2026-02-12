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
  const [shouldRender, setShouldRender] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    if (open) {
      setShouldRender(true)
      // Double rAF ensures browser paints initial off-screen state before animating in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true)
        })
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Close on ESC
  React.useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, setOpen])

  // Lock body scroll
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [open])

  if (!mounted || !shouldRender) return null

  const sizeClasses = {
    sm: "w-3/4 max-w-sm",
    half: "w-[50vw] min-w-[360px]",
    lg: "w-[75vw]",
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
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "fixed z-50 bg-background p-6 shadow-2xl transition-transform duration-300 ease-out",
          sideClasses[side],
          slideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-muted transition-all"
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
