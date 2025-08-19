import { NextRequest, NextResponse } from 'next/server'
import { getDrive } from '@/lib/googleDrive'
import { getAdminClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { uploadId, folderStructure } = await request.json()
    if (!uploadId || !folderStructure?.timestampFolderId) {
      return NextResponse.json({ error: 'uploadId and folderStructure required' }, { status: 400 })
    }

    const supa = getAdminClient()
    const { data: files, error } = await supa
      .from('files')
      .select('*')
      .eq('upload_id', uploadId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const manifest = {
      uploadId,
      createdAt: new Date().toISOString(),
      folderStructure,
      totalFiles: files?.length || 0,
      files: (files || []).map(f => ({
        slot: f.slot_name,
        name: f.name,
        sizeBytes: f.size_bytes,
        mime: f.mime,
        driveFileId: f.drive_file_id
      }))
    }

    const drive = getDrive()
    await drive.files.create({
      requestBody: {
        name: 'upload.json',
        parents: [folderStructure.timestampFolderId],
        mimeType: 'application/json'
      },
      media: { mimeType: 'application/json', body: JSON.stringify(manifest, null, 2) },
      supportsAllDrives: true,
      fields: 'id'
    } as any)

    return NextResponse.json({ ok: true, manifest: { total: manifest.totalFiles } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'finalize failed' }, { status: 500 })
  }
}


