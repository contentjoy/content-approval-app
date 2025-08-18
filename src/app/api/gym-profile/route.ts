import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gymId')
    
    if (!gymId) {
      return NextResponse.json({ error: 'gymId is required' }, { status: 400 })
    }

    console.log('🔍 Getting profile for gym:', gymId)

    // Query the gyms table to get profile_key and ayrshare_profiles
    const { data: gym, error } = await supabase
      .from('gyms')
      .select('profile_key, ayrshare_profiles')
      .eq('id', gymId)
      .single()

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
      gym_id: gymId  // Return the gym_id so frontend can use it
    })

  } catch (error) {
    console.error('❌ gym-profile route error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 })
  }
}
