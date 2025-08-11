'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getDiscoveryForCurrentMonth, type DiscoveryItem } from '@/lib/database'
import { getEmbedHtml } from '@/lib/utils'

export default function DiscoveryPage() {
  const [items, setItems] = useState<(DiscoveryItem & { embedHtml?: string | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getDiscoveryForCurrentMonth()
      const embeds = await Promise.all(
        data.map(async (item) => ({
          ...item,
          embedHtml: await getEmbedHtml(item.link, item.platform).catch(() => null),
        }))
      )
      setItems(embeds)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center p-6 text-muted-text">Loading…</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text mb-1">Discovery</h1>
      <p className="text-sm text-muted-text mb-6">Posts discovered this month</p>

      {items.length === 0 ? (
        <div className="text-muted-text">No items for this month.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4"
           >
              <h3 className="text-sm font-medium mb-2 text-text">{item.title}</h3>
              {item.embedHtml ? (
                <div className="w-full h-64" dangerouslySetInnerHTML={{ __html: item.embedHtml }} />
              ) : (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  View on {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}



