'use client'

// Temporary no-op toast until we implement Sonner
export function useToast() {
  return {
    toast: ({ title = '', description = '' }) => {
      console.log(`[Toast] ${title}: ${description}`)
    }
  }
}