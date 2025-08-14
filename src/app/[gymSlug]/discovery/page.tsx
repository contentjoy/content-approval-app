'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getDiscoveryForCurrentMonth, type DiscoveryItem } from '@/lib/database'
import { getEmbedHtml } from '@/lib/utils'

export default function DiscoveryPage() {
  const [items, setItems] = useState<(DiscoveryItem & { embedHtml?: string | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [embedStates, setEmbedStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({})

  useEffect(() => {
    async function load() {
      const data = await getDiscoveryForCurrentMonth()
      
      // Initialize embed states
      const initialStates = data.reduce((acc, item) => {
        acc[item.id] = 'loading'
        return acc
      }, {} as Record<string, 'loading' | 'loaded' | 'error'>)
      setEmbedStates(initialStates)
      
      const embeds = await Promise.all(
        data.map(async (item) => {
          try {
            const embedHtml = await getEmbedHtml(item.link, item.platform)
            setEmbedStates(prev => ({ ...prev, [item.id]: 'loaded' }))
            return { ...item, embedHtml }
          } catch (error) {
            setEmbedStates(prev => ({ ...prev, [item.id]: 'error' }))
            return { ...item, embedHtml: null }
          }
        })
      )
      setItems(embeds)
      setLoading(false)
      
      // Give embeds more time to render before processing Instagram embeds
      setTimeout(() => {
        try {
          // Dynamically inject instagram embed script once
          if (!(window as any).instgrm && !document.getElementById('instagram-embed-js')) {
            const s = document.createElement('script')
            s.id = 'instagram-embed-js'
            s.async = true
            s.src = 'https://www.instagram.com/embed.js'
            document.body.appendChild(s)
            s.onload = () => { 
              try { 
                (window as any).instgrm?.Embeds?.process() 
              } catch {} 
            }
          } else {
            ;(window as any).instgrm?.Embeds?.process()
          }
        } catch {}
      }, 200) // Increased delay for better embed rendering
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4"
            >
              {/* Title hidden for now per request */}
              {embedStates[item.id] === 'loading' && (
                <div className="w-full h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading embed...</p>
                  </div>
                </div>
              )}
              
              {embedStates[item.id] === 'loaded' && item.embedHtml && (
                <div
                  className="w-full overflow-hidden rounded-md min-h-[400px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: item.embedHtml }}
                />
              )}
              
              {embedStates[item.id] === 'error' && (
                <div className="w-full h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">Failed to load embed</p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline text-sm"
                    >
                      View on {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}



