import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gymId')
    const gymSlug = searchParams.get('gymSlug')
    
    if (!gymId && !gymSlug) {
      return NextResponse.json({ error: 'gymId or gymSlug is required' }, { status: 400 })
    }

    console.log('🔍 Getting profile for gym:', gymId || gymSlug)

    // Query the gyms table to get profile_key and ayrshare_profiles
    let gym: any = null
    let error: any = null
    if (gymId) {
      const r = await supabase
        .from('gyms')
        .select('id, "Gym Name", profile_key, ayrshare_profiles')
        .eq('id', gymId)
        .single()
      gym = r.data
      error = r.error
    } else if (gymSlug) {
      // Convert slug to name: kokoro-demo -> kokoro demo (lowercase to match stored format)
      const gymName = gymSlug.replace(/-/g, ' ').toLowerCase()
      const r = await supabase
        .from('gyms')
        .select('id, "Gym Name", profile_key, ayrshare_profiles')
        .eq('Gym Name', gymName)
        .single()
      gym = r.data
      error = r.error
    }

    if (error) {
      console.error('❌ Failed to fetch gym profile:', error)
      return NextResponse.json({ error: 'Failed to fetch gym profile', details: error }, { status: 500 })
    }

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    console.log('✅ Found gym profile:', { profile_key: gym.profile_key, has_ayrshare_profiles: !!gym.ayrshare_profiles })

    return NextResponse.json({ 
      success: true, 
      profile_key: gym.profile_key,
      ayrshare_profiles: gym.ayrshare_profiles,
      gym_id: gym?.id || gymId
    })

  } catch (error) {
    console.error('❌ gym-profile route error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 })
  }
}
