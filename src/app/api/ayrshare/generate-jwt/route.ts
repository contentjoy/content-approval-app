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

    // Debug environment variables
    console.log('🔧 Environment check:', {
      hasApiKey: !!process.env.AYRSHARE_API_KEY,
      hasPrivateKey: !!process.env.AYRSHARE_PRIVATE_KEY,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      apiKeyLength: process.env.AYRSHARE_API_KEY?.length || 0,
      privateKeyLength: process.env.AYRSHARE_PRIVATE_KEY?.length || 0
    })

    if (!process.env.AYRSHARE_API_KEY || !process.env.AYRSHARE_PRIVATE_KEY) {
      console.log('⚠️ Ayrshare credentials not configured - using demo mode')
      
      // Demo mode for testing without Ayrshare credentials
      const demoAuthUrl = `https://app.ayrshare.com/auth/${platform}?demo=true&redirect=${encodeURIComponent(process.env.NEXTAUTH_URL || 'http://localhost:3000')}/api/ayrshare/callback&state=${gymId}-${platform}`
      
      return NextResponse.json({
        authUrl: demoAuthUrl,
        jwt: 'demo-jwt-token',
        profileKey: `${gymId}-${platform}`,
        demo: true
      })
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
        privateKey: process.env.AYRSHARE_PRIVATE_KEY,
        profileKey: `${gymId}-${platform}`,
      })
    })

    console.log('📡 Ayrshare API response status:', jwtResponse.status)
    
    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text()
      console.error('❌ Ayrshare API error:', errorText)
      throw new Error(`Ayrshare API error: ${jwtResponse.status} - ${errorText}`)
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
