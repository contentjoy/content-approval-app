import { NextRequest, NextResponse } from 'next/server'

interface CreateProfileBody {
  gymName?: string
}

export async function POST(request: NextRequest) {
  try {
    const { gymName }: CreateProfileBody = await request.json()

    if (!gymName) {
      console.error('❌ Missing gymName in request body')
      return NextResponse.json({ error: 'gymName is required' }, { status: 400 })
    }

    console.log('🔑 Creating Ayrshare profile for gym:', gymName)

    if (!process.env.AYRSHARE_API_KEY) {
      console.error('❌ AYRSHARE_API_KEY environment variable is not configured')
      return NextResponse.json({ 
        error: 'AYRSHARE_API_KEY is not configured',
        details: 'Please add AYRSHARE_API_KEY to your environment variables'
      }, { status: 500 })
    }

    console.log('🔑 Ayrshare API key found, length:', process.env.AYRSHARE_API_KEY.length)
    console.log('🔑 Making request to Ayrshare API...')

    const requestBody = JSON.stringify({ title: gymName })
    console.log('🔑 Request body:', requestBody)

    const res = await fetch('https://api.ayrshare.com/api/profiles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
      // No-caching to ensure fresh profile creation
      cache: 'no-store',
    })

    console.log('🔑 Ayrshare API response status:', res.status)
    console.log('🔑 Ayrshare API response headers:', Object.fromEntries(res.headers.entries()))

    if (!res.ok) {
      const text = await res.text()
      console.error('❌ Ayrshare create profile error:', res.status, text)
      console.error('🔍 Request details:', { 
        gymName, 
        hasApiKey: !!process.env.AYRSHARE_API_KEY,
        apiKeyLength: process.env.AYRSHARE_API_KEY?.length,
        requestBody
      })
      return NextResponse.json({ 
        error: 'Failed to create profile',
        status: res.status,
        details: text
      }, { status: 500 })
    }

    const data = (await res.json()) as { profileKey?: string }
    console.log('🔑 Ayrshare API response data:', data)
    
    if (!data.profileKey) {
      console.error('❌ profileKey missing in Ayrshare response:', data)
      return NextResponse.json({ 
        error: 'profileKey missing in response',
        response: data
      }, { status: 500 })
    }

    console.log('✅ Ayrshare profile created successfully:', data.profileKey)
    return NextResponse.json({ profileKey: data.profileKey })
  } catch (err) {
    console.error('❌ create-profile route error:', err)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}


