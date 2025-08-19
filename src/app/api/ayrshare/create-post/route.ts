export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import ayrshareService from '@/lib/ayrshare'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { post, platforms, mediaUrls = [], scheduleDate, timezone, title } = await req.json()
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
    console.log('🔐 Ayrshare env check:', {
      hasApiKey: !!process.env.AYRSHARE_API_KEY,
      apiKeyLen: process.env.AYRSHARE_API_KEY ? String(process.env.AYRSHARE_API_KEY).length : 0,
      hasProfileKey: !!profileKey,
      gymId: gym?.id,
      gymName: gym?.['Gym Name']
    })
    if (!process.env.AYRSHARE_API_KEY) {
      return NextResponse.json({ error: 'AYRSHARE_API_KEY missing in env' }, { status: 500 })
    }

    // Build Ayrshare payload
    // Use client-provided URLs directly (Supabase public URLs). Ayrshare just needs public https links.
    const payload: any = { post, platforms, mediaUrls }
    if (scheduleDate) payload.scheduleDate = scheduleDate
    if (title) payload.title = title
    // Include idempotency for safety
    payload.idempotencyKey = `${gym?.id || 'unknown'}:${Date.now()}:${Math.random().toString(36).slice(2)}`

    // Call Ayrshare
    console.log('🟢 Ayrshare create payload preview:', {
      hasProfileKey: !!profileKey,
      postLen: String(post || '').length,
      platforms,
      mediaCount: mediaUrls.length,
      mediaUrls,
      scheduleDate,
      title: title ? true : false
    })
    let createRes
    try {
      createRes = await ayrshareService.createPost(payload, profileKey)
    } catch (err: any) {
      console.error('❌ Ayrshare create failed:', err?.message || err)
      return NextResponse.json({ error: 'Ayrshare create failed', detail: err?.message || String(err) }, { status: 502 })
    }
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
    const { error: insErr } = await supabase.from('social_media_posts').insert(insertData as any)
    if (insErr) {
      console.error('❌ Failed to insert social_media_posts:', insErr)
    }

    return NextResponse.json({ id: createRes.id, refId: createRes.refId })
  } catch (e: any) {
    console.error('❌ create-post API error:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Create failed' }, { status: 500 })
  }
}


