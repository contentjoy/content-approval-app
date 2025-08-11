import { NextRequest, NextResponse } from 'next/server'

interface CreateProfileBody {
  gymName?: string
}

export async function POST(request: NextRequest) {
  try {
    const { gymName }: CreateProfileBody = await request.json()

    if (!gymName) {
      return NextResponse.json({ error: 'gymName is required' }, { status: 400 })
    }

    if (!process.env.AYRSHARE_API_KEY) {
      return NextResponse.json({ error: 'AYRSHARE_API_KEY is not configured' }, { status: 500 })
    }

    const res = await fetch('https://api.ayrshare.com/api/profiles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: gymName }),
      // No-caching to ensure fresh profile creation
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Ayrshare create profile error:', res.status, text)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    const data = (await res.json()) as { profileKey?: string }
    if (!data.profileKey) {
      return NextResponse.json({ error: 'profileKey missing in response' }, { status: 500 })
    }

    return NextResponse.json({ profileKey: data.profileKey })
  } catch (err) {
    console.error('create-profile route error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


