'use client'

// Temporary no-op toast until we implement Sonner
export function useToast() {
  return {
    showToast: ({ type = 'info', title = '', message = '' }) => {
      console.log(`[Toast - ${type}] ${title}: ${message}`)
    }
  }
}