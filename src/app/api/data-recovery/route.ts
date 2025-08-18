import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 DATA RECOVERY ENDPOINT CALLED')
    
    // Get the request body for configuration
    const body = await request.text()
    let config: any = {}
    
    try {
      config = JSON.parse(body)
    } catch (parseError) {
      console.log('No config provided, using defaults')
    }
    
    const {
      webhookUrl = process.env.ONBOARDING_WEBHOOK_URL || 
                   process.env.ONBOARDING_TEST_WEBHOOK || 
                   'https://contentjoy.app.n8n.cloud/webhook-test/156ef9a5-0ae7-4e65-acc1-a27aa533d90a',
      dryRun = false,
      limit = 100,
      offset = 0,
      gymIds = [],
      gymId,
      gymName
    } = config
    
    console.log('🔧 Recovery Configuration:')
    console.log('🔧 - Webhook URL:', webhookUrl)
    console.log('🔧 - Dry Run:', dryRun)
    console.log('🔧 - Limit:', limit)
    console.log('🔧 - Offset:', offset)
    
    // Get Supabase client
    const supabase = getAdminClient()
    
    // Fetch all gym records with comprehensive data
    console.log('📥 Fetching gym records from database...')
    
    // Normalize filters
    let ids: string[] = []
    if (Array.isArray(gymIds)) ids = gymIds.filter(Boolean)
    if (typeof gymId === 'string' && gymId) ids.push(gymId)
    
    let gymsQuery = supabase.from('gyms').select('*')
    if (ids.length === 1) {
      console.log('🎯 Filtering by single gym id:', ids[0])
      gymsQuery = gymsQuery.eq('id', ids[0])
    } else if (ids.length > 1) {
      console.log('🎯 Filtering by multiple gym ids:', ids)
      // @ts-ignore
      gymsQuery = gymsQuery.in('id', ids)
    } else if (typeof gymName === 'string' && gymName.trim().length > 0) {
      const spaced = gymName.trim().toLowerCase()
      console.log('🎯 Filtering by gym name (ILIKE):', spaced)
      gymsQuery = gymsQuery.ilike('"Gym Name"', spaced)
    } else {
      gymsQuery = gymsQuery.range(offset, offset + limit - 1).order('created_at', { ascending: true })
    }
    const { data: gyms, error: fetchError } = await gymsQuery
    
    if (fetchError) {
      console.error('❌ Failed to fetch gyms:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch gyms', details: fetchError }, { status: 500 })
    }
    
    if (!gyms || gyms.length === 0) {
      console.log('ℹ️ No gyms found with provided filters', { ids, gymName })
      return NextResponse.json({ message: 'No gyms found', count: 0, filters: { ids, gymName } })
    }
    
    console.log(`✅ Fetched ${gyms.length} gym records`)
    
    // Process each gym and send to webhook
    const results = []
    let successCount = 0
    let errorCount = 0
    
    // Helper to safely read fields with multiple possible aliases
    const read = (row: any, ...aliases: string[]): any => {
      for (const key of aliases) {
        if (row?.[key] != null && String(row[key]).trim() !== '') return row[key]
      }
      return undefined
    }

    for (let i = 0; i < gyms.length; i++) {
      const gym = gyms[i]
      console.log(`\n🔄 Processing gym ${i + 1}/${gyms.length}: ${gym['Gym Name'] || 'Unknown'}`)
      
      try {
        // Resolve all fields with robust aliasing
        let gymName = read(gym, 'Gym Name', 'gym_name', 'name') || 'Unknown Gym'
        let email = read(gym, 'Email', 'email') || 'no-email@unknown.com'
        let firstName = read(gym, 'First name', 'First Name', 'first_name', 'FirstName') || 'Unknown'
        let lastName = read(gym, 'Last name', 'Last Name', 'last_name', 'LastName') || 'Unknown'
        let phone = read(gym, 'Phone', 'phone') || 'No phone'
        let website = read(gym, 'Website', 'website') || 'No website'
        let city = read(gym, 'City', 'city') || 'Unknown city'
        let address = read(gym, 'Address', 'City Address', 'address') || 'No address'
        let primaryColor = read(gym, 'Primary color', 'Primary Color', 'primaryColor') || '#000000'
        let brandStyle = read(gym, 'Brand Profile', 'Brand Style', 'Brand Choice') || 'Unknown'
        let targetDemo = read(gym, 'Target Demographic', 'Target demographic') || 'Unknown'
        let offerings = read(gym, 'Offerings', 'Services Offered') || 'Unknown'
        let desiredResults = read(gym, 'Clients Desired Result', 'Client Desired Result') || 'Unknown'
        let googleMapUrl = read(gym, 'Google Map URL', 'Google Maps URL') || 'No Google Maps URL'
        let instagramUrl = read(gym, 'Instagram URL', 'Instagram', 'IG URL') || 'No Instagram URL'
        let primaryCta = read(gym, 'Primary offer', 'Primary Offer', 'primaryOffer') || 'No CTA'
        let testimonial = read(gym, 'Testimonial', 'Client Info') || 'No testimonial'
        let whiteLogoUrl = read(gym, 'White Logo URL', 'White Logo') || 'No white logo'
        let blackLogoUrl = read(gym, 'Black Logo URL', 'Black Logo') || 'No black logo'
        const status = read(gym, 'Status', 'status') || 'unknown'

        // Fallback: attempt to load latest onboarding_data snapshot for this gym to backfill
        const { data: odLatest } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('gym_id', gym.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (odLatest) {
          console.log('📦 Using onboarding_data fallback for missing fields')
          const bd = odLatest.business_details || {}
          const bi = odLatest.brand_identity || {}
          const as = odLatest.audience_services || {}
          const ls = odLatest.links_socials || {}
          const mc = odLatest.marketing_content || {}
          const md = odLatest.media || {}
          // Only fill when we have no value
          if (!firstName || firstName === 'Unknown') firstName = bd.first_name
          if (!lastName || lastName === 'Unknown') lastName = bd.last_name
          if (!phone || phone.startsWith('No')) phone = bd.phone
          if (!website || website.startsWith('No')) website = bd.website
          if (!city || city.startsWith('Unknown')) city = bd.city
          if (!address || address.startsWith('No')) address = bd.address

          if (!primaryColor || primaryColor === '#000000') primaryColor = bi.brand_color
          if (!brandStyle || brandStyle === 'Unknown') brandStyle = bi.brand_style

          if (!targetDemo || targetDemo === 'Unknown') targetDemo = as.target_audience
          if (!offerings || offerings === 'Unknown') offerings = as.services
          if (!desiredResults || desiredResults === 'Unknown') desiredResults = as.desired_results

          if (!googleMapUrl || googleMapUrl.startsWith('No')) googleMapUrl = ls.google_map_url
          if (!instagramUrl || instagramUrl.startsWith('No')) instagramUrl = ls.instagram_url

          if (!primaryCta || primaryCta.startsWith('No')) primaryCta = mc.primary_cta
          if (!testimonial || testimonial.startsWith('No')) testimonial = mc.testimonial

          if (!whiteLogoUrl || whiteLogoUrl.startsWith('No')) whiteLogoUrl = md.white_logo_url
          if (!blackLogoUrl || blackLogoUrl.startsWith('No')) blackLogoUrl = md.black_logo_url
        }

        // Reconstruct onboarding data structure
        const onboardingData = {
          // Gym identification
          gym_id: gym.id,
          gym_name: gymName,
          gym_email: email,
          
          // Onboarding form data (reconstructed from database)
          business_details: {
            first_name: firstName,
            last_name: lastName,
            phone,
            website,
            city,
            address
          },
          
          brand_identity: {
            brand_color: primaryColor,
            brand_style: brandStyle
          },
          
          audience_services: {
            target_audience: targetDemo,
            services: offerings,
            desired_results: desiredResults
          },
          
          links_socials: {
            google_map_url: googleMapUrl,
            instagram_url: instagramUrl
          },
          
          marketing_content: {
            primary_cta: primaryCta,
            testimonial
          },
          
          media: {
            white_logo_url: whiteLogoUrl,
            black_logo_url: blackLogoUrl
          },
          
          // Metadata
          submitted_at: gym.created_at || odLatest?.submitted_at || new Date().toISOString(),
          gym_identifier: gym.id, // Use ID instead of slug
          
          // Recovery metadata
          recovery_metadata: {
            recovered_at: new Date().toISOString(),
            source: 'data-recovery-endpoint',
            original_status: status,
            data_completeness: calculateDataCompleteness(gym),
            recovery_note: 'Data recovered from existing gym records to reactivate N8N flows'
          }
        }
        
        console.log('📊 Reconstructed data structure:')
        console.log('📊 - Gym ID:', onboardingData.gym_id)
        console.log('📊 - Gym Name:', onboardingData.gym_name)
        console.log('📊 - Gym Email:', onboardingData.gym_email)
        console.log('📊 - Data Completeness:', onboardingData.recovery_metadata.data_completeness + '%')
        
        if (dryRun) {
          console.log('🔍 DRY RUN: Would send to webhook:', JSON.stringify(onboardingData, null, 2))
          results.push({
            gym_id: gym.id,
            gym_name: gym['Gym Name'],
            status: 'dry_run',
            data: onboardingData
          })
          continue
        }
        
        // Send to webhook
        console.log('📤 Sending to webhook...')
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ContentJoy-DataRecovery/1.0',
            'X-Data-Recovery': 'true',
            'X-Gym-ID': gym.id
          },
          body: JSON.stringify(onboardingData)
        })
        
        if (!webhookResponse.ok) {
          const responseText = await webhookResponse.text()
          console.error(`❌ Webhook failed for ${gym['Gym Name']}:`, webhookResponse.status, responseText)
          
          results.push({
            gym_id: gym.id,
            gym_name: gym['Gym Name'],
            status: 'webhook_failed',
            error: `${webhookResponse.status}: ${responseText}`,
            data: onboardingData
          })
          errorCount++
        } else {
          const responseText = await webhookResponse.text()
          console.log(`✅ Webhook succeeded for ${gym['Gym Name']}:`, webhookResponse.status, responseText)
          
          results.push({
            gym_id: gym.id,
            gym_name: gym['Gym Name'],
            status: 'success',
            webhook_response: responseText,
            data: onboardingData
          })
          successCount++
        }
        
        // Add delay between webhook calls to avoid overwhelming the system
        if (i < gyms.length - 1) {
          console.log('⏳ Waiting 1 second before next webhook...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (gymError) {
        console.error(`❌ Error processing gym ${gym['Gym Name']}:`, gymError)
        
        results.push({
          gym_id: gym.id,
          gym_name: gym['Gym Name'],
          status: 'processing_error',
          error: gymError instanceof Error ? gymError.message : 'Unknown error'
        })
        errorCount++
      }
    }
    
    // Summary
    console.log('\n🎉 DATA RECOVERY COMPLETED')
    console.log('📊 Summary:')
    console.log('📊 - Total gyms processed:', gyms.length)
    console.log('📊 - Successful webhooks:', successCount)
    console.log('📊 - Failed webhooks:', errorCount)
    console.log('📊 - Dry run:', dryRun)
    
    return NextResponse.json({
      success: true,
      message: 'Data recovery completed',
      summary: {
        total_gyms: gyms.length,
        successful_webhooks: successCount,
        failed_webhooks: errorCount,
        dry_run: dryRun
      },
      results: results,
      webhook_url: webhookUrl
    })
    
  } catch (error) {
    console.error('❌ Data recovery error:', error)
    return NextResponse.json({ 
      error: 'Data recovery failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateDataCompleteness(gym: any): number {
  const fields = [
    'Gym Name', 'Email', 'First name', 'Last name', 'Phone',
    'Website', 'City', 'Address', 'Primary color', 'Brand Profile',
    'Target Demographic', 'Offerings', 'Clients Desired Result',
    'Google Map URL', 'Instagram URL', 'Primary offer', 'Testimonial'
  ]
  
  let completedFields = 0
  for (const field of fields) {
    if (gym[field] && gym[field] !== 'Unknown' && gym[field] !== 'No phone' && 
        gym[field] !== 'No website' && gym[field] !== 'No address' &&
        gym[field] !== 'No Google Maps URL' && gym[field] !== 'No Instagram URL' &&
        gym[field] !== 'No CTA' && gym[field] !== 'No testimonial') {
      completedFields++
    }
  }
  
  return Math.round((completedFields / fields.length) * 100)
}
