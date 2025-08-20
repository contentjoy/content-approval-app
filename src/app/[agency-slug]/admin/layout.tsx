'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function AgencyAdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { 'agency-slug': agencySlug } = useParams()

  useEffect(() => {
    async function loadAgencyBranding() {
      const supabase = createClient()
      const { data: agency } = await supabase
        .from('agencies')
        .select('"Primary Color"')
        .eq('slug', agencySlug)
        .single()

      if (agency?.['Primary Color']) {
        document.documentElement.style.setProperty('--brand', agency['Primary Color'])
      }
    }

    loadAgencyBranding()
  }, [agencySlug])

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
