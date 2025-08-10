'use client'

import { useState } from 'react'

function inferFileName(url: string, fallback: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').pop() || ''
    const hasExt = /\.[a-z0-9]{2,5}$/i.test(last)
    if (hasExt) return last
  } catch {}
  return fallback
}

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadMedia = async (url: string, fileName: string) => {
    if (!url) return
    setIsDownloading(true)
    try {
      const response = await fetch(url, { mode: 'cors' })
      if (!response.ok) throw new Error('Failed to fetch media')

      const blob = await response.blob()
      const finalName = inferFileName(url, fileName || 'media')

      // If Web Share API supports files (mobile), prefer that UX
      // @ts-ignore - canShare is not in all TS lib versions
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], finalName, { type: blob.type })] })) {
        // @ts-ignore
        await navigator.share({ files: [new File([blob], finalName, { type: blob.type })], title: finalName })
        setIsDownloading(false)
        return
      }

      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = finalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download error:', error)
      try {
        // Last resort fallback
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch {}
    } finally {
      setIsDownloading(false)
    }
  }

  return { downloadMedia, isDownloading }
}


