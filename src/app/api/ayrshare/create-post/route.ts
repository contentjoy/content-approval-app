export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import ayrshareService from '@/lib/ayrshare'
import { supabase } from '@/lib/supabase'
import { getAdminClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { post, platforms, mediaUrls = [], scheduleDate, timezone, title } = await req.json()
    if (!post || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'post and platforms required' }, { status: 400 })
    }

    // Resolve gym via headers: prefer x-gym-id, else x-gym-slug; do NOT fallback to arbitrary gym
    const gymId = req.headers.get('x-gym-id') || undefined
    const gymSlug = req.headers.get('x-gym-slug') || undefined
    console.log('🧩 STEP 1: Resolve gym context')
    let gym: any = null
    if (gymId) {
      const { data } = await supabase.from('gyms').select('id, "Gym Name", profile_key').eq('id', gymId).single()
      gym = data
    } else if (gymSlug) {
      const name = gymSlug.replace(/-/g, ' ').toLowerCase()
      const { data } = await supabase.from('gyms').select('id, "Gym Name", profile_key').eq('Gym Name', name).single()
      gym = data
    }
    if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 400 })
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
    console.log('🧩 STEP 2: Build Ayrshare payload')
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
    console.log('🧩 STEP 3: Call Ayrshare')
    let createRes
    try {
      createRes = await ayrshareService.createPost(payload, profileKey)
    } catch (err: any) {
      console.error('❌ Ayrshare create failed:', err?.message || err)
      return NextResponse.json({ error: 'Ayrshare create failed', detail: err?.message || String(err) }, { status: 502 })
    }
    console.log('✅ Ayrshare create success:', createRes)
    if (!createRes.success || !createRes.id) {
      return NextResponse.json({ error: 'Ayrshare create failed (missing id)' }, { status: 502 })
    }

    // Insert social_media_posts record for visibility
    console.log('🧩 STEP 4: Insert social_media_posts row')
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
    const admin = getAdminClient()
    const { error: insErr } = await admin.from('social_media_posts').insert(insertData as any)
    if (insErr) {
      console.error('❌ Failed to insert social_media_posts:', insErr)
    } else {
      console.log('✅ Inserted social_media_posts row')
    }

    console.log('🧩 STEP 5: Respond success')
    return NextResponse.json({ ok: true, id: createRes.id, refId: createRes.refId })
  } catch (e: any) {
    console.error('❌ create-post API error:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Create failed' }, { status: 500 })
  }
}


