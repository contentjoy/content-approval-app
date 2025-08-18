import { NextRequest, NextResponse } from 'next/server'
import { getAuth, findFileInFolder, getDrive } from '@/lib/googleDrive'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { filename, mime, sizeBytes, parentId } = await request.json()
    console.log('🟢 Resumable start:', { filename, mime, sizeBytes, parentId: parentId?.slice(0, 6) })

    if (!filename || !mime || typeof sizeBytes !== 'number' || !parentId) {
      return NextResponse.json({ error: 'filename, mime, sizeBytes, parentId are required' }, { status: 400 })
    }

    // Dedupe before starting a session
    try {
      const driveFile = await findFileInFolder(getDrive(), parentId, filename)
      const sizeMatches = driveFile?.size ? Number(driveFile.size) === sizeBytes : false
      if (driveFile && sizeMatches) {
        return NextResponse.json({ deduped: true, fileId: driveFile.id })
      }
    } catch (e) {
      console.warn('⚠️ Dedupe precheck failed (non-blocking):', e)
    }

    const auth = getAuth()
    // Get bearer token via multiple strategies for robustness
    let authHeader: string | undefined
    try {
      const reqHeaders = await (auth as any).getRequestHeaders?.()
      authHeader = reqHeaders?.Authorization || reqHeaders?.authorization
    } catch {}
    if (!authHeader) {
      try {
        const token = await (auth as any).getAccessToken?.()
        if (typeof token === 'string' && token) {
          authHeader = `Bearer ${token}`
        }
      } catch {}
    }
    if (!authHeader) {
      try {
        const creds = await (auth as any).authorize?.()
        if (creds?.access_token) {
          authHeader = `Bearer ${creds.access_token}`
        }
      } catch {}
    }
    if (!authHeader) {
      console.error('❌ Missing Authorization header from Google auth')
      return NextResponse.json({ error: 'Failed to obtain Google access token' }, { status: 500 })
    }

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
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
      const txt = await initRes.text().catch(() => '')
      console.error('❌ Resumable init failed:', initRes.status, txt)
      return NextResponse.json({ error: `Failed to start resumable session: ${initRes.status}`, details: txt }, { status: 500 })
    }

    const location = initRes.headers.get('location') || initRes.headers.get('Location')
    if (!location) {
      return NextResponse.json({ error: 'No resumable upload URL returned' }, { status: 500 })
    }

    return NextResponse.json({ uploadUrl: location })
  } catch (error) {
    console.error('❌ Resumable start route error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to start resumable session' }, { status: 500 })
  }
}


