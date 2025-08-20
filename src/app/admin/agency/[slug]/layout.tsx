'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { slug } = useParams()

  useEffect(() => {
    async function loadAgencyBranding() {
      const supabase = createClient()
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
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
