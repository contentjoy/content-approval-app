'use client'

import { usePathname } from 'next/navigation'
import { useToast as useShadcnToast } from '@/components/ui/toast/use-toast'

// Fallback toast function that just logs to console
const noopToast = ({ type = 'info', title = '', description = '' }) => {
  console.log(`[Toast - ${type}] ${title}: ${description}`)
}

export function useToast() {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')
  const shadcnToast = useShadcnToast()

  // Return noop toast for client routes
  if (!isAdminRoute) {
    return { toast: noopToast }
  }

  // Return real toast for admin routes
  return shadcnToast
}