import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 ONBOARDING WEBHOOK ENDPOINT CALLED')
    
    // Get the request body
    const body = await request.text()
    console.log('📥 Raw request body:', body)
    
    let webhookData
    try {
      webhookData = JSON.parse(body)
      console.log('✅ Parsed webhook data successfully')
    } catch (parseError) {
      console.error('❌ Failed to parse webhook data:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    // Validate required fields
    if (!webhookData.gym_id || !webhookData.gym_name) {
      console.error('❌ Missing required fields:', { gym_id: !!webhookData.gym_id, gym_name: !!webhookData.gym_name })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    console.log('🔍 Webhook data validation passed')
    console.log('📊 Webhook payload structure:', {
      hasBusinessDetails: !!webhookData.business_details,
      hasBrandIdentity: !!webhookData.brand_identity,
      hasAudienceServices: !!webhookData.audience_services,
      hasLinksSocials: !!webhookData.links_socials,
      hasMarketingContent: !!webhookData.marketing_content,
      hasMedia: !!webhookData.media,
      totalKeys: Object.keys(webhookData).length
    })
    
    // Store onboarding data in database for backup
    const supabase = getAdminClient()
    const { error: dbError } = await supabase
      .from('onboarding_data')
      .insert([{
        gym_id: webhookData.gym_id,
        gym_name: webhookData.gym_name,
        gym_email: webhookData.gym_email,
        business_details: webhookData.business_details,
        brand_identity: webhookData.brand_identity,
        audience_services: webhookData.audience_services,
        links_socials: webhookData.links_socials,
        marketing_content: webhookData.marketing_content,
        media: webhookData.media,
        submitted_at: webhookData.submitted_at,
        gym_slug: webhookData.gym_slug,
        webhook_received_at: new Date().toISOString()
      }])
    
    if (dbError) {
      console.error('⚠️ Failed to store onboarding data in database:', dbError)
      // Don't fail the webhook if DB storage fails
    } else {
      console.log('✅ Onboarding data stored in database successfully')
    }
    
    // Forward to N8N webhook with enhanced payload
    const n8nWebhookUrl = process.env.ONBOARDING_WEBHOOK_URL || 
                          process.env.ONBOARDING_TEST_WEBHOOK || 
                          'https://contentjoy.app.n8n.cloud/webhook-test/156ef9a5-0ae7-4e65-acc1-a27aa533d90a'
    
    console.log('🌐 Forwarding to N8N webhook:', n8nWebhookUrl)
    
    // Enhanced payload with metadata
    const enhancedPayload = {
      ...webhookData,
      // Add webhook metadata
      webhook_metadata: {
        received_at: new Date().toISOString(),
        source: 'content-approval-app',
        version: '2.0',
        endpoint: '/api/onboarding-webhook'
      },
      // Ensure all data is present
      validation: {
        has_complete_data: !!(
          webhookData.business_details &&
          webhookData.brand_identity &&
          webhookData.audience_services &&
          webhookData.links_socials &&
          webhookData.marketing_content &&
          webhookData.media
        ),
        data_completeness_percentage: calculateCompleteness(webhookData)
      }
    }
    
    console.log('📤 Sending enhanced payload to N8N:', JSON.stringify(enhancedPayload, null, 2))
    
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ContentJoy-Onboarding-Webhook/2.0',
        'X-Webhook-Source': 'content-approval-app',
        'X-Webhook-Version': '2.0'
      },
      body: JSON.stringify(enhancedPayload)
    })
    
    if (!n8nResponse.ok) {
      const responseText = await n8nResponse.text()
      console.error('❌ N8N webhook failed:', n8nResponse.status, responseText)
      
      // Try fallback webhook if configured
      const fallbackUrl = process.env.ONBOARDING_FALLBACK_WEBHOOK
      if (fallbackUrl) {
        console.log('🔄 Trying fallback webhook:', fallbackUrl)
        try {
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enhancedPayload)
          })
          if (fallbackResponse.ok) {
            console.log('✅ Fallback webhook succeeded')
          } else {
            console.error('❌ Fallback webhook also failed:', fallbackResponse.status)
          }
        } catch (fallbackError) {
          console.error('❌ Fallback webhook error:', fallbackError)
        }
      }
      
      return NextResponse.json({ 
        error: 'N8N webhook failed',
        status: n8nResponse.status,
        details: responseText
      }, { status: 500 })
    }
    
    const n8nResponseText = await n8nResponse.text()
    console.log('✅ N8N webhook succeeded:', n8nResponse.status, n8nResponseText)
    
    return NextResponse.json({ 
      success: true,
      message: 'Onboarding data processed and forwarded successfully',
      n8n_status: n8nResponse.status,
      data_completeness: enhancedPayload.validation.data_completeness_percentage
    })
    
  } catch (error) {
    console.error('❌ Onboarding webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateCompleteness(data: any): number {
  const requiredSections = [
    'business_details',
    'brand_identity', 
    'audience_services',
    'links_socials',
    'marketing_content',
    'media'
  ]
  
  let completedSections = 0
  for (const section of requiredSections) {
    if (data[section] && Object.keys(data[section]).length > 0) {
      completedSections++
    }
  }
  
  return Math.round((completedSections / requiredSections.length) * 100)
}
