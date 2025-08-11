import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getEmbedHtml(url: string, platform: 'instagram' | 'tiktok'): Promise<string | null> {
  let oEmbedUrl = ''
  let params = ''

  if (platform === 'instagram') {
    oEmbedUrl = 'https://graph.facebook.com/v20.0/instagram_oembed'
    params = `?url=${encodeURIComponent(url)}&omitscript=true`
  } else if (platform === 'tiktok') {
    oEmbedUrl = 'https://www.tiktok.com/oembed'
    params = `?url=${encodeURIComponent(url)}`
  } else {
    return null
  }

  const response = await fetch(oEmbedUrl + params)
  if (!response.ok) throw new Error('oEmbed fetch failed')
  const data = await response.json()
  return data.html as string
}
