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

    // Get current gym data
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('social_accounts, ayrshare_profiles, profile_key')
      .eq('id', gymId)
      .single()

    if (gymError) {
      throw gymError
    }

    // Prefer the profileKey from our DB or token response if provided by Ayrshare
    const gymProfiles: any = (gym as any)?.ayrshare_profiles || {}
    const pkFromGym: string | undefined = (gym as any)?.profile_key
    const profileKey = tokenData?.profileKey || gymProfiles?.[platform]?.profile_key || pkFromGym

    // Update social accounts and ayrshare profiles in database
    const socialAccounts = gym?.social_accounts || {}
    const ayrshareProfiles = gym?.ayrshare_profiles || {}

    socialAccounts[platform as keyof typeof socialAccounts] = {
      access_token: tokenData.access_token,
      connected_at: new Date().toISOString(),
      platform_id: tokenData.platform_id || tokenData.user_id,
      ...tokenData.profile_data
    }

    ayrshareProfiles[platform as keyof typeof ayrshareProfiles] = {
      profile_key: profileKey || `${gymId}-${platform}`,
      platform_id: tokenData.platform_id || tokenData.user_id,
      platform_username: tokenData.username || tokenData.name
    }

    const { error: updateError } = await supabase
      .from('gyms')
      .update({ 
        social_accounts: socialAccounts,
        ayrshare_profiles: ayrshareProfiles
      })
      .eq('id', gymId)

    if (updateError) {
      throw updateError
    }

    // Return success page that closes the popup and redirects opener
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
              try { window.opener.location = '/${gymId}'; } catch (e) {}
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
