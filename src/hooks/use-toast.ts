'use client'

import { toast } from 'sonner'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export function useToast() {
  return {
    showToast: ({ type = 'info', title = '', message = '' }) => {
      switch (type) {
        case 'error':
          toast.error(title, {
            description: message
          })
          break
        case 'success':
          toast.success(title, {
            description: message
          })
          break
        case 'warning':
          toast.warning(title, {
            description: message
          })
          break
        default:
          toast.info(title, {
            description: message
          })
      }
    }
  }
}