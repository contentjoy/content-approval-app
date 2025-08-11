import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Body {
  gymId?: string
  profileKey?: string
}

export async function POST(req: NextRequest) {
  try {
    const { gymId, profileKey }: Body = await req.json()
    if (!gymId || !profileKey) {
      return NextResponse.json({ error: 'gymId and profileKey are required' }, { status: 400 })
    }

    const apiKey = process.env.AYRSHARE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AYRSHARE_API_KEY not configured' }, { status: 500 })
    }

    // Try to get a summary of connected social accounts for this profile.
    // Ayrshare typically uses the X-Profile-Key header to scope requests.
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'X-Profile-Key': profileKey,
    }

    // Attempt multiple potential endpoints for resiliency.
    async function tryFetch(url: string) {
      const r = await fetch(url, { headers, cache: 'no-store' })
      if (!r.ok) throw new Error(`${url} -> ${r.status}`)
      return r.json() as Promise<any>
    }

    let data: any | null = null
    const candidates = [
      'https://api.ayrshare.com/api/user',
      'https://api.ayrshare.com/api/profiles/user',
    ]
    for (const url of candidates) {
      try { data = await tryFetch(url); break } catch { /* try next */ }
    }

    // Parse common shapes into a normalized map of { platform: true }
    const linked: Record<string, boolean> = {}
    if (data) {
      // Shape 1: { socials: { instagram: true, facebook: false, ... } }
      if (data.socials && typeof data.socials === 'object') {
        for (const [k, v] of Object.entries<any>(data.socials)) linked[k] = Boolean(v)
      }
      // Shape 2: { linked: ['instagram', 'facebook'] }
      if (Array.isArray(data.linked)) {
        for (const k of data.linked) linked[String(k)] = true
      }
      // Shape 3: { accounts: [{ platform: 'instagram', linked: true }] }
      if (Array.isArray(data.accounts)) {
        for (const acc of data.accounts) linked[String(acc.platform)] = Boolean(acc.linked ?? true)
      }
    }

    // Merge into ayrshare_profiles
    const { data: gym, error: fetchError } = await supabase
      .from('gyms')
      .select('ayrshare_profiles')
      .eq('id', gymId)
      .single()

    if (fetchError) {
      console.error('sync-profiles fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to load gym' }, { status: 500 })
    }

    const profiles: Record<string, any> = gym?.ayrshare_profiles || {}
    for (const [platform, isLinked] of Object.entries(linked)) {
      if (!isLinked) continue
      profiles[platform] = {
        ...(profiles[platform] || {}),
        profile_key: profiles[platform]?.profile_key ?? profileKey,
        connected_at: profiles[platform]?.connected_at ?? new Date().toISOString(),
      }
    }

    const { error: updateError } = await supabase
      .from('gyms')
      .update({ ayrshare_profiles: profiles })
      .eq('id', gymId)

    if (updateError) {
      console.error('sync-profiles update error:', updateError)
      return NextResponse.json({ error: 'Failed to save profiles' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profiles, source: data })
  } catch (e) {
    console.error('sync-profiles route error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


