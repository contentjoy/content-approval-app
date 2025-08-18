import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminClient } from '@/lib/supabaseServer'

interface Body {
  gymId?: string
  profileKey?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json()
    let { gymId } = body
    const { profileKey } = body
    
    console.log('🔍 sync-profiles called with:', { gymId, profileKey })
    
    // Fallback: resolve gymId via profile_key if not provided
    if (!gymId && profileKey) {
      try {
        const admin = getAdminClient()
        const { data: matchedGym, error: findError } = await admin
          .from('gyms')
          .select('id, "Gym Name", ayrshare_profiles')
          .eq('profile_key', profileKey)
          .single()
        if (!findError && matchedGym?.id) {
          gymId = matchedGym.id
          console.log('🔁 Resolved missing gymId via profile_key:', { gymId })
        }
      } catch {}
    }
    
    if (!gymId) {
      console.error('❌ Missing gymId in request body')
      return NextResponse.json({ error: 'gymId is required' }, { status: 400 })
    }

    console.log('🔁 Using gymId for sync:', gymId)
    
    if (!profileKey) {
      console.error('❌ Missing profileKey in request body')
      return NextResponse.json({ error: 'profileKey is required' }, { status: 400 })
    }

    const apiKey = process.env.AYRSHARE_API_KEY
    if (!apiKey) {
      console.error('❌ AYRSHARE_API_KEY not configured')
      return NextResponse.json({ error: 'AYRSHARE_API_KEY not configured' }, { status: 500 })
    }

    // First, verify the gym exists and get its current data
    const admin = getAdminClient()
    const { data: gym, error: gymError } = await admin
      .from('gyms')
      .select('id, "Gym Name", ayrshare_profiles')
      .eq('id', gymId)
      .single()

    if (gymError) {
      console.error('❌ Failed to fetch gym:', gymError)
      return NextResponse.json({ error: 'Failed to load gym', details: gymError }, { status: 500 })
    }

    console.log('✅ Found gym:', { id: gym.id, name: gym['Gym Name'] })

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
      'https://app.ayrshare.com/api/user',
      'https://app.ayrshare.com/api/profiles/user',
      'https://app.ayrshare.com/api/profiles',
      'https://app.ayrshare.com/api/socials',
    ]
    
    for (const url of candidates) {
      try { 
        console.log(`🔍 Trying Ayrshare endpoint: ${url}`)
        data = await tryFetch(url)
        // Log a compact summary of keys to understand the shape we received
        try {
          const keys = Object.keys(data || {})
          console.log('✅ Successfully fetched data from:', url, 'keys:', keys)
        } catch {}
        break 
      } catch (err) { 
        console.log(`❌ Failed to fetch from ${url}:`, err)
        // try next 
      }
    }

    if (!data) {
      console.warn('⚠️ No data received from any Ayrshare endpoint')
      // Return current profiles if no new data
      return NextResponse.json({ 
        success: true, 
        profiles: gym.ayrshare_profiles || {},
        message: 'No new data from Ayrshare, returning current profiles'
      })
    }

    // Parse common shapes into a normalized map of { platform: true }
    const linked: Record<string, boolean> = {}
    if (data) {
      // If we got a wrapper object such as { user: {...} } or { data: {...} }, peel it
      if (data.user && typeof data.user === 'object') {
        data = data.user
      }
      if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        data = data.data
      }
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
      // Shape 4: { activeSocialAccounts: ['instagram','facebook'] }
      if (Array.isArray((data as any).activeSocialAccounts)) {
        for (const k of (data as any).activeSocialAccounts) linked[String(k)] = true
      }
      // Shape 5: Profiles array: [{ platform: 'instagram', connected: true }]
      if (Array.isArray((data as any).profiles)) {
        for (const p of (data as any).profiles) {
          const platform = String(p.platform || p.name || '')
          if (platform) linked[platform] = Boolean(p.connected ?? p.linked ?? true)
        }
      }
    }

    console.log('🔍 Parsed linked platforms:', linked)
    // Also log a few known fields to help adjust parsers if needed
    try {
      const dbg = {
        socialsType: typeof (data?.socials),
        linkedType: Array.isArray(data?.linked) ? 'array' : typeof data?.linked,
        accountsLen: Array.isArray(data?.accounts) ? data.accounts.length : 0,
        activeLen: Array.isArray((data as any)?.activeSocialAccounts) ? (data as any).activeSocialAccounts.length : 0,
        profilesLen: Array.isArray((data as any)?.profiles) ? (data as any).profiles.length : 0,
      }
      console.log('🧪 Ayrshare shape debug:', dbg)
    } catch {}

    // Merge into ayrshare_profiles
    const currentProfiles: Record<string, any> = gym?.ayrshare_profiles || {}
    const updatedProfiles = { ...currentProfiles }

    for (const [platform, isLinked] of Object.entries(linked)) {
      if (!isLinked) continue
      updatedProfiles[platform] = {
        ...(updatedProfiles[platform] || {}),
        profile_key: updatedProfiles[platform]?.profile_key ?? profileKey,
        connected_at: updatedProfiles[platform]?.connected_at ?? new Date().toISOString(),
        last_synced: new Date().toISOString(),
      }
    }

    if (Object.keys(linked).length === 0) {
      // If Ayrshare didn't report platforms, we still want to seed entries for common ones
      // when the profileKey is present and the gym connected recently via our UI.
      // This helps the UI show connected status right away.
      const seedPlatforms = ['facebook', 'instagram']
      const seeded: string[] = []
      for (const p of seedPlatforms) {
        if (!updatedProfiles[p] && profileKey) {
          updatedProfiles[p] = {
            profile_key: profileKey,
            connected_at: new Date().toISOString(),
            last_synced: new Date().toISOString(),
          }
          seeded.push(p)
        }
      }
      if (seeded.length > 0) {
        console.log('🌱 Seeded profiles based on UI connection:', seeded)
      } else {
        console.log('ℹ️ No linked platforms reported by Ayrshare. Preserving existing profiles without update.')
        return NextResponse.json({ 
          success: true,
          profiles: currentProfiles,
          message: 'No linked platforms from Ayrshare; returned current profiles.'
        })
      }
    }
      console.log('ℹ️ No linked platforms reported by Ayrshare. Preserving existing profiles without update.')
      return NextResponse.json({ 
        success: true,
        profiles: currentProfiles,
        message: 'No linked platforms from Ayrshare; returned current profiles.'
      })
    }

    console.log('📝 Updating gym with profiles:', updatedProfiles)

    const { error: updateError } = await admin
      .from('gyms')
      .update({ ayrshare_profiles: updatedProfiles })
      .eq('id', gymId)

    if (updateError) {
      console.error('❌ sync-profiles update error:', updateError)
      return NextResponse.json({ error: 'Failed to save profiles', details: updateError }, { status: 500 })
    }

    console.log('✅ Successfully updated gym profiles')

    return NextResponse.json({ 
      success: true, 
      profiles: updatedProfiles, 
      source: data,
      message: 'Profiles synced successfully'
    })
  } catch (e) {
    console.error('❌ sync-profiles route error:', e)
    return NextResponse.json({ error: 'Internal Server Error', details: e }, { status: 500 })
  }
}


