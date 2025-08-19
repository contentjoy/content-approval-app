import { NextRequest, NextResponse } from 'next/server'
import ayrshareService from '@/lib/ayrshare'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { post, platforms, mediaUrls = [], scheduleDate, timezone } = await req.json()
    if (!post || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'post and platforms required' }, { status: 400 })
    }

    // Resolve gym via current session (assumes middleware/session available) or best-effort by header 'x-gym-id'
    const gymId = req.headers.get('x-gym-id') || undefined
    let gym: any = null
    if (gymId) {
      const { data } = await supabase.from('gyms').select('id, "Gym Name", profile_key').eq('id', gymId).single()
      gym = data
    }
    if (!gym) {
      // Fallback: Get the first gym row (for environments lacking auth); this should be replaced by proper auth context
      const { data } = await supabase.from('gyms').select('id, "Gym Name", profile_key').limit(1).single()
      gym = data
    }
    const profileKey = gym?.profile_key || undefined

    // Build Ayrshare payload
    const payload: any = { post, platforms, mediaUrls }
    if (scheduleDate) payload.scheduleDate = scheduleDate

    // Call Ayrshare
    const createRes = await ayrshareService.createPost(payload, profileKey)
    if (!createRes.success || !createRes.id) {
      return NextResponse.json({ error: 'Ayrshare create failed' }, { status: 502 })
    }

    // Insert social_media_posts record for visibility
    const insertData: Record<string, any> = {
      gym_id: gym?.id,
      'Gym Name': gym?.['Gym Name'] || '',
      'Asset URL': mediaUrls[0] || '',
      'Post Caption': post,
      'Approval Status': 'Pending',
      'Asset Type': mediaUrls[0]?.match(/\.mp4|video/i) ? 'Video' : 'Photo',
      'Content Type': 'post',
      'Scheduled': scheduleDate ? scheduleDate.replace('T', ' ').replace('Z', '') : null,
      ayrshare_postId: createRes.id,
      ayrshare_refId: createRes.refId || null,
    }
    await supabase.from('social_media_posts').insert(insertData as any)

    return NextResponse.json({ id: createRes.id, refId: createRes.refId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Create failed' }, { status: 500 })
  }
}


