import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const platform = (searchParams.get('platform') || '').toLowerCase() as 'instagram' | 'tiktok'
    const url = searchParams.get('url') || ''

    if (!platform || !url) {
      return NextResponse.json({ error: 'platform and url are required' }, { status: 400 })
    }

    if (platform === 'instagram') {
      const clean = url.split('?')[0]
      // Prefer using an access token if available
      const appId = process.env.FB_APP_ID
      const clientToken = process.env.FB_CLIENT_TOKEN
      const userToken = process.env.FB_ACCESS_TOKEN

      const token = userToken || (appId && clientToken ? `${appId}|${clientToken}` : '')
      if (token) {
        const graph = `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(clean)}&omitscript=true&access_token=${encodeURIComponent(token)}`
        const r = await fetch(graph, { cache: 'no-store' })
        if (r.ok) {
          const data = await r.json()
          return NextResponse.json({ html: data?.html || null })
        }
      }
      // Fallback to iframe embed without token
      const match = clean.match(/instagram\.com\/p\/([^/]+)/)
      const id = match?.[1]
      if (id) {
        const html = `<iframe src="https://www.instagram.com/p/${id}/embed" width="100%" height="100%" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`
        return NextResponse.json({ html })
      }
      return NextResponse.json({ html: null })
    }

    if (platform === 'tiktok') {
      const api = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      const r = await fetch(api, { cache: 'no-store' })
      if (r.ok) {
        const data = await r.json()
        return NextResponse.json({ html: data?.html || null })
      }
      // Fallback basic iframe if needed (not always supported)
      const match = url.match(/tiktok\.com\/.+\/(video|v)\/([0-9]+)/)
      const id = match?.[2]
      if (id) {
        const html = `<iframe src="https://www.tiktok.com/embed/v2/${id}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen></iframe>`
        return NextResponse.json({ html })
      }
      return NextResponse.json({ html: null })
    }

    return NextResponse.json({ html: null })
  } catch (e) {
    console.error('oembed api error:', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}


