import { NextRequest, NextResponse } from 'next/server'
import { getAuth, findFileInFolder } from '@/lib/googleDrive'

export async function POST(request: NextRequest) {
  try {
    const { filename, mime, sizeBytes, parentId } = await request.json()

    if (!filename || !mime || typeof sizeBytes !== 'number' || !parentId) {
      return NextResponse.json({ error: 'filename, mime, sizeBytes, parentId are required' }, { status: 400 })
    }

    // Dedupe before starting a session
    try {
      const driveFile = await findFileInFolder((await import('@/lib/googleDrive')).getDrive(), parentId, filename)
      const sizeMatches = driveFile?.size ? Number(driveFile.size) === sizeBytes : false
      if (driveFile && sizeMatches) {
        return NextResponse.json({ deduped: true, fileId: driveFile.id })
      }
    } catch (e) {
      // Non-blocking
    }

    const auth = getAuth()
    const token = await auth.getAccessToken()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Failed to obtain Google access token' }, { status: 500 })
    }

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mime,
        'X-Upload-Content-Length': String(sizeBytes)
      },
      body: JSON.stringify({
        name: filename,
        parents: [parentId]
      })
    })

    if (!initRes.ok) {
      const txt = await initRes.text()
      return NextResponse.json({ error: `Failed to start resumable session: ${initRes.status} ${txt}` }, { status: 500 })
    }

    const location = initRes.headers.get('location') || initRes.headers.get('Location')
    if (!location) {
      return NextResponse.json({ error: 'No resumable upload URL returned' }, { status: 500 })
    }

    return NextResponse.json({ uploadUrl: location })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to start resumable session' }, { status: 500 })
  }
}


