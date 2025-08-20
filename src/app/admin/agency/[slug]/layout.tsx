'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { TooltipProvider } from '@/components/ui/tooltip'

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
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </TooltipProvider>
  )
}
