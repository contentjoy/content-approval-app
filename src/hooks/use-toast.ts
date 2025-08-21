'use client'

import { usePathname } from 'next/navigation'
import { useToast as useShadcnToast } from '@/components/ui/toast/use-toast'

// Fallback toast function that just logs to console
const noopToast = {
  toast: ({ type = 'info', title = '', description = '' }) => {
    console.log(`[Toast - ${type}] ${title}: ${description}`)
  }
}

export function useToast() {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  // Only use real toast in admin routes
  if (isAdminRoute) {
    try {
      return useShadcnToast()
    } catch (error) {
      return noopToast
    }
  }

  // Use noop toast in client routes
  return noopToast
}