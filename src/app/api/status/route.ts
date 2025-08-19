import { NextRequest, NextResponse } from 'next/server'
import { getDrive } from '@/lib/googleDrive'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    // Minimal health check for Drive auth
    try {
      const drive = getDrive()
      await drive.about.get({ fields: 'user' })
    } catch (e) {
      return NextResponse.json({ ok: false, drive: false, error: e instanceof Error ? e.message : 'drive error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, drive: true, ts: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'status failed' }, { status: 500 })
  }
}


