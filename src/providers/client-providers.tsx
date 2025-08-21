'use client'

import { ReactNode } from 'react'
import { UploadProvider } from '@/contexts/upload-context'
import { BrandingProvider } from '@/contexts/branding-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { ModalProvider } from '@/components/modals/modal-provider'
import { Toaster } from 'sonner'

interface ClientProvidersProps {
  children: ReactNode
  gymSlug?: string
}

export function ClientProviders({ children, gymSlug }: ClientProvidersProps) {
  return (
    <BrandingProvider initialGymSlug={gymSlug}>
      <ThemeProvider>
        <UploadProvider>
          {children}
          <ModalProvider />
          <Toaster richColors closeButton position="top-right" />
        </UploadProvider>
      </ThemeProvider>
    </BrandingProvider>
  )
}
