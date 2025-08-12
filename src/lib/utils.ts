import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getEmbedHtml(url: string, platform: 'instagram' | 'tiktok'): Promise<string | null> {
  const cleanUrl = platform === 'instagram' ? url.split('?')[0] : url
  const res = await fetch(`/api/oembed?platform=${platform}&url=${encodeURIComponent(cleanUrl)}`)
  if (!res.ok) return null
  const data = await res.json()
  return data?.html || null
}

// Calendar color helpers using CSS variables only (no hex literals)
export type ContentType = 'Reels' | 'Photo' | 'Carousel' | 'Story' | 'Other' | string
export type AssetType = 'Video' | 'Photo' | string

export function getContentTypeFillVar(contentType?: ContentType): string {
  const key = (contentType || 'Other').toString().toLowerCase()
  switch (true) {
    case /reel|short|video/.test(key):
      return 'var(--accent)'
    case /photo|image|pic/.test(key):
      return 'var(--surface)'
    case /carousel|album|multi/.test(key):
      return 'var(--accents-2)'
    default:
      return 'var(--card-bg)'
  }
}

export function getAssetTypeStripeVar(assetType?: AssetType): string {
  const key = (assetType || '').toString().toLowerCase()
  if (/video|mp4|mov/.test(key)) return 'var(--accent)'
  return 'var(--border)'
}
