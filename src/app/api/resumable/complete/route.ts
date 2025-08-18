import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { uploadId, slot, fileId, name, sizeBytes, mime } = await request.json()
    if (!uploadId || !slot || !fileId || !name) {
      return NextResponse.json({ error: 'uploadId, slot, fileId, name required' }, { status: 400 })
    }

    const supa = getAdminClient()
    const { error } = await supa
      .from('files')
      .insert({
        upload_id: uploadId,
        slot_name: slot,
        drive_file_id: fileId,
        name,
        size_bytes: sizeBytes || null,
        mime: mime || 'application/octet-stream'
      })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to persist resumable file' }, { status: 500 })
  }
}


