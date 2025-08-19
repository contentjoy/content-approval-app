import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import ayrshareService from '@/lib/ayrshare'

export async function POST(req: NextRequest) {
  try {
    const { postId, caption, scheduledDate, timezone, action } = await req.json()
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    // Fetch post to get gym and Ayrshare ids
    const { data: postRow, error: fetchErr } = await supabase
      .from('social_media_posts')
      .select('id, gym_id, "Gym Name", ayrshare_postId, ayrshare_refId')
      .eq('id', postId)
      .single()
    if (fetchErr || !postRow) return NextResponse.json({ error: fetchErr?.message || 'Post not found' }, { status: 404 })

    // Delete from Ayrshare if requested
    // Resolve gym profile_key for Ayrshare scoping
    let profileKey: string | undefined
    if (postRow.gym_id) {
      const { data: gym, error: gymErr } = await supabase
        .from('gyms')
        .select('profile_key')
        .eq('id', postRow.gym_id)
        .single()
      if (!gymErr) profileKey = (gym as any)?.profile_key || undefined
    }

    if (action === 'delete') {
      if (postRow.ayrshare_postId) {
        await ayrshareService.deletePost(postRow.ayrshare_postId, profileKey)
      }
      // Clear scheduled timestamp locally
      await supabase.from('social_media_posts').update({ Scheduled: null }).eq('id', postId)
      return NextResponse.json({ ok: true, deleted: true })
    }

    // Update Supabase scheduled timestamp and caption
    const updates: Record<string, any> = {}
    if (caption !== undefined) updates['Post Caption'] = caption
    if (scheduledDate) updates['Scheduled'] = scheduledDate // expects YYYY-MM-DD HH:mm:ss
    if (Object.keys(updates).length > 0) {
      const { error: upErr } = await supabase
        .from('social_media_posts')
        .update(updates as any)
        .eq('id', postId)
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    // Push update to Ayrshare if we have the id
    if (postRow.ayrshare_postId) {
      const payload: any = {}
      if (caption !== undefined) payload.post = caption
      if (scheduledDate) payload.scheduleDate = scheduledDate
      // Some integrations may need timezone; include if provided
      if (timezone) payload.timezone = timezone
      await ayrshareService.updatePost(postRow.ayrshare_postId, payload, profileKey)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 500 })
  }
}


