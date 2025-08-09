import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Ayrshare auth error:', error)
      return new NextResponse(`
        <html>
          <body>
            <script>
              window.close();
            </script>
            <p>Authentication failed. You can close this window.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (!code || !state) {
      throw new Error('Missing required parameters')
    }

    // Parse state to get gymId and platform
    const [gymId, platform] = state.split('-')

    if (!gymId || !platform) {
      throw new Error('Invalid state parameter')
    }

    // Exchange code for access token with Ayrshare
    const tokenResponse = await fetch('https://app.ayrshare.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AYRSHARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        profileKey: `${gymId}-${platform}`,
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    // Social accounts feature disabled - column does not exist in current schema
    // TODO: Implement when social accounts feature is added

    // Return success page that closes the popup
    return new NextResponse(`
      <html>
        <body>
          <script>
            // Send success message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'AYRSHARE_AUTH_SUCCESS',
                platform: '${platform}',
                gymId: '${gymId}'
              }, '*');
            }
            window.close();
          </script>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2 style="color: #10B981;">✓ Successfully Connected!</h2>
            <p>Your ${platform} account has been connected. You can close this window.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error: unknown) {
    console.error('Ayrshare callback error:', error)
    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'AYRSHARE_AUTH_ERROR',
                error: '${(error as Error).message || 'Authentication failed'}'
              }, '*');
            }
            window.close();
          </script>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2 style="color: #EF4444;">✗ Connection Failed</h2>
            <p>${(error as Error).message || 'Authentication failed'}. You can close this window.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
