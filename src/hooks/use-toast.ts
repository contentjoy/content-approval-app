'use client'

import { useContext } from 'react'
import { ToastContext } from '@/contexts/toast-context'

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return { toast: context.showToast }
}