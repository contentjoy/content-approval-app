import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldSessions } from '@/lib/chunk-storage'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  try {
    await cleanupOldSessions()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'cleanup failed' }, { status: 500 })
  }
}


