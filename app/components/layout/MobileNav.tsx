"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "../../../lib/utils"

export type MobileNavLink = {
  title: string
  href: string
  icon: React.ReactNode
}

interface MobileNavProps {
  links: MobileNavLink[]
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden bg-card/50 border-b border-border">
      <div className="flex items-center justify-between p-2">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center justify-center rounded-md p-2",
            "hover:bg-muted hover:text-foreground"
          )}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="space-y-1 pb-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2 text-base font-medium",
                "hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 [&>svg]:w-4 [&>svg]:h-4">
                {link.icon}
              </div>
              {link.title}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
export default MobileNav;
