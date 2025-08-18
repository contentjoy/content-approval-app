import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Body {
  gymId?: string
  profileKey?: string
}

export async function POST(req: NextRequest) {
  try {
    let { gymId, profileKey }: Body = await req.json()
    
    console.log('🔍 sync-profiles called with:', { gymId, profileKey })
    
    // Fallback: resolve gymId via profile_key if not provided
    if (!gymId && profileKey) {
      try {
        const { data: matchedGym, error: findError } = await supabase
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
    const { data: gym, error: gymError } = await supabase
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
    ]
    
    for (const url of candidates) {
      try { 
        console.log(`🔍 Trying Ayrshare endpoint: ${url}`)
        data = await tryFetch(url)
        console.log('✅ Successfully fetched data from:', url)
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

    console.log('🔍 Parsed linked platforms:', linked)

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

    console.log('📝 Updating gym with profiles:', updatedProfiles)

    const { error: updateError } = await supabase
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


