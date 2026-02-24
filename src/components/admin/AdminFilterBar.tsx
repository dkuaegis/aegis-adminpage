import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface AdminFilterBarProps {
  children: ReactNode
  className?: string
}

export function AdminFilterBar({ children, className }: AdminFilterBarProps) {
  return <div className={cn("grid grid-cols-1 gap-3", className)}>{children}</div>
}
