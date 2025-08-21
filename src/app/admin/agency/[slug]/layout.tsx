'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import '@/app/globals.css'
import '../../shadcn-globals.css'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { slug } = useParams()

  useEffect(() => {
    async function loadAgencyBranding() {
      const { data: agency } = await supabase
        .from('agencies')
        .select('"Primary Color"')
        .eq('slug', slug)
        .single()

      if (agency?.['Primary Color']) {
        document.documentElement.style.setProperty('--brand', agency['Primary Color'])
      }
    }

    loadAgencyBranding()
  }, [slug])

  return (
          <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        forcedTheme="dark"
      >
        <TooltipProvider>
          <div className="relative min-h-screen bg-background text-foreground antialiased">
            <div className="relative flex min-h-screen flex-col">
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
  )
}
