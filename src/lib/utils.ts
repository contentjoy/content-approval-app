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
