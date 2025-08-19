import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { group } = await req.json()
    if (!group) return NextResponse.json({ error: 'group required' }, { status: 400 })

    const { error } = await supabase
      .from('social_media_posts')
      .update({ 'Approval Status': 'Approved' })
      .eq('Carousel Group', group)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'approve failed' }, { status: 500 })
  }
}


