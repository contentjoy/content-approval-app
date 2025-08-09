import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { platform, gymId } = await request.json()

    if (!platform || !gymId) {
      return NextResponse.json(
        { error: 'Platform and gymId are required' },
        { status: 400 }
      )
    }

    // Generate JWT for the platform
    const jwtResponse = await fetch('https://app.ayrshare.com/api/generateJWT', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AYRSHARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        privateKey: process.env.AYRSHARE_PRIVATE_KEY || 'default-key',
        profileKey: `${gymId}-${platform}`,
      })
    })

    if (!jwtResponse.ok) {
      throw new Error('Failed to generate JWT')
    }

    const { jwt } = await jwtResponse.json()

    // Generate authentication URL
    const baseUrl = 'https://app.ayrshare.com/auth/'
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ayrshare/callback`
    
    const authUrl = `${baseUrl}${platform}?jwt=${jwt}&redirect=${encodeURIComponent(redirectUri)}&state=${gymId}-${platform}`

    return NextResponse.json({
      authUrl,
      jwt,
      profileKey: `${gymId}-${platform}`
    })

  } catch (error: unknown) {
    console.error('Ayrshare JWT generation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate JWT' },
      { status: 500 }
    )
  }
}
