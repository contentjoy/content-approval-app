'use client'

import { useContext } from 'react'
import { ToastContext } from '@/contexts/toast-context'

// Fallback toast function that just logs to console
const fallbackToast = {
  toast: ({ type = 'info', title = '', message = '' }) => {
    console.log(`[Toast - ${type}] ${title}: ${message}`)
  }
}

export function useToast() {
  try {
    const context = useContext(ToastContext)
    if (!context) {
      return fallbackToast
    }
    return { toast: context.showToast }
  } catch (error) {
    return fallbackToast
  }
}