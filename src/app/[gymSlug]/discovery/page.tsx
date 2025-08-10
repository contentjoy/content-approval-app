'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getDiscoveryForCurrentMonth, type DiscoveryItem } from '@/lib/database'

function useOEmbedHtml(url: string) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    const fetchOEmbed = async () => {
      try {
        let endpoint: string | null = null
        if (/instagram\.com|instagr\.am/.test(url)) {
          endpoint = `https://graph.facebook.com/v17.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true&hidecaption=true`
        } else if (/tiktok\.com/.test(url)) {
          endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
        }
        if (!endpoint) return
        const res = await fetch(endpoint)
        if (!res.ok) return
        const data = await res.json()
        setHtml(data?.html || null)
      } catch {
        setHtml(null)
      }
    }
    fetchOEmbed()
  }, [url])

  return html
}

export default function DiscoveryPage() {
  const [items, setItems] = useState<DiscoveryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDiscoveryForCurrentMonth().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text mb-1">Discovery</h1>
      <p className="text-sm text-muted-text mb-6">Posts discovered this month</p>

      {loading ? (
        <div className="text-muted-text">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-muted-text">No items for this month.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <DiscoveryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const html = useOEmbedHtml(item.link)
  const isEmbed = Boolean(html)
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card-bg">
      {isEmbed ? (
        <div className="w-full h-64">
          <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: html as string }} />
        </div>
      ) : (
        <a href={item.link} target="_blank" rel="noreferrer" className="block p-4 hover:bg-bg-elev-1">
          <div className="text-accent font-medium mb-1">{item.name || 'Link'}</div>
          <div className="text-sm text-muted-text break-all">{item.link}</div>
        </a>
      )}
    </div>
  )
}



