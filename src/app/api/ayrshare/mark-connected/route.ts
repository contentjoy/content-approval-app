import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Body {
  gymId?: string
  platform?: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'linkedin' | 'youtube'
  profileKey?: string
}

export async function POST(req: NextRequest) {
  try {
    const { gymId, platform, profileKey }: Body = await req.json()
    if (!gymId || !platform || !profileKey) {
      return NextResponse.json({ error: 'gymId, platform, and profileKey are required' }, { status: 400 })
    }

    const { data: gym, error: fetchError } = await supabase
      .from('gyms')
      .select('ayrshare_profiles')
      .eq('id', gymId)
      .single()

    if (fetchError) {
      console.error('mark-connected fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to load gym' }, { status: 500 })
    }

    const profiles: Record<string, any> = gym?.ayrshare_profiles || {}
    const prev = profiles[platform] || {}
    profiles[platform] = {
      ...prev,
      profile_key: profileKey,
      connected_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('gyms')
      .update({ ayrshare_profiles: profiles })
      .eq('id', gymId)

    if (updateError) {
      console.error('mark-connected update error:', updateError)
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profiles })
  } catch (e) {
    console.error('mark-connected route error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


