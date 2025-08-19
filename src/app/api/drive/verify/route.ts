import { NextRequest, NextResponse } from 'next/server'
import { getDrive, findFileInFolder } from '@/lib/googleDrive'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const name = searchParams.get('name')
    const sizeStr = searchParams.get('sizeBytes')

    if (!parentId) {
      return NextResponse.json({ error: 'parentId required' }, { status: 400 })
    }

    const drive = getDrive()
    if (name && sizeStr) {
      const sizeBytes = Number(sizeStr)
      const f = await findFileInFolder(drive, parentId, name)
      const present = !!(f && f.size && Number(f.size) === sizeBytes)
      return NextResponse.json({ ok: true, present, id: f?.id || null })
    }

    // Permission preflight: try listing one item in folder
    const { data } = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: 'files(id,name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1
    })
    return NextResponse.json({ ok: true, canList: true, sample: data.files?.[0] || null })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'verify failed' }, { status: 500 })
  }
}


