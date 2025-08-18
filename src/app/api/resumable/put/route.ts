import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { uploadUrl, start, end, total, chunkBase64, mime } = await request.json()
    if (!uploadUrl || typeof start !== 'number' || typeof end !== 'number' || typeof total !== 'number' || !chunkBase64 || !mime) {
      return NextResponse.json({ error: 'uploadUrl, start, end, total, chunkBase64, mime required' }, { status: 400 })
    }

    const buffer = Buffer.from(chunkBase64, 'base64')
    const contentRange = `bytes ${start}-${end}/${total}`

    // Exponential backoff for transient failures
    const maxAttempts = 5
    let attempt = 0
    let res: Response | null = null
    let lastError: any
    while (attempt < maxAttempts) {
      attempt++
      try {
        res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mime,
            'Content-Range': contentRange
          },
          body: buffer
        })
        if (res.ok || res.status === 308) break
        const transient = res.status >= 500 || res.status === 429
        if (!transient) break
      } catch (e) {
        lastError = e
      }
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000)
      await new Promise(r => setTimeout(r, delay))
    }
    if (!res) throw lastError || new Error('No response from resumable PUT')

    // 308 means resume incomplete; 200/201 indicate success
    const status = res.status
    const text = await res.text().catch(() => '')

    if (status === 308) {
      const range = res.headers.get('Range')
      return NextResponse.json({ ok: true, continued: true, range })
    }

    if (status === 200 || status === 201) {
      // Completed. Response JSON contains file metadata
      let data: any = {}
      try { data = text ? JSON.parse(text) : {} } catch {}
      return NextResponse.json({ ok: true, completed: true, fileId: data.id })
    }

    return NextResponse.json({ error: `Resumable PUT failed: ${status} ${text}` }, { status: 500 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Resumable PUT failed' }, { status: 500 })
  }
}


