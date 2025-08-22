import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

import { AgencyBrand, GymRow } from '@/types/agency'
import { startOfMonth } from 'date-fns'

import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.pathname.match(/\/api\/admin\/agency\/([^\/]+)\/gyms/)?.[1]
  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month') || startOfMonth(new Date()).toISOString()
  
  if (!slug) {
    return NextResponse.json({ error: 'Invalid agency slug' }, { status: 400 })
  }

  try {
    // First, get the agency by slug
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('*')
      .eq('slug', slug)
      .single()

    if (agencyError) {
      console.error('Error fetching agency:', agencyError)
      return NextResponse.json({ 
        error: 'Failed to fetch agency data',
        details: agencyError.message
      }, { status: 500 })
    }

    if (!agency) {
      return NextResponse.json({ 
        error: 'Agency not found',
        details: `No agency found with slug: ${slug}`
      }, { status: 404 })
    }

    // Get all gyms associated with this agency
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select(`
        *,
        last_upload_date,
        last_delivery_date,
        last_schedule_date,
        social_media_posts (
          *,
          "Approval Status",
          "Scheduled",
          created_at
        )
      `)
      .eq('Agency', agency.id)

    if (gymsError) {
      console.error('Error fetching gyms:', gymsError)
      return NextResponse.json({
        error: 'Failed to fetch gyms data',
        details: gymsError.message
      }, { status: 500 })
    }

    if (!gyms || gyms.length === 0) {
      return NextResponse.json({
        branding: {
          agencyName: agency.name || agency.slug,
          primaryColor: agency.primary_color || '#000000',
          logoUrl: agency.logo_url || ''
        },
        gyms: [],
        pagination: {
          total: 0,
          page: 1,
          perPage: 0
        }
      })
    }

    // Format agency branding data
    const branding: AgencyBrand = {
      agencyName: agency.name || agency.slug,
      primaryColor: agency.primary_color || '#000000',
      logoUrl: agency.logo_url || ''
    }

    // Use the provided month for calculations
    const startOfThisMonth = new Date(month)

    // Process the data to match GymRow type
    const formattedGyms: GymRow[] = gyms.map((gym: any) => {
      const posts = gym.social_media_posts || []
      const mtdPosts = posts.filter((post: any) => 
        new Date(post.created_at) >= startOfThisMonth
      )

      // Calculate MTD statistics
      const approvedMTD = mtdPosts.filter((post: any) => 
        post['Approval Status'] === 'Approved'
      ).length

      // Delivered = total posts created this month
      const deliveredMTD = mtdPosts.length

      // Posts that have a scheduled publish time
      const scheduledMTD = mtdPosts.filter((post: any) => 
        post.scheduled_time && !post.published_at
      ).length

      // Posts that have been published
      const uploadsMTD = mtdPosts.filter((post: any) => 
        post.published_at
      ).length

      // Calculate approval rate based on total delivered posts
      const approvalRatePct = deliveredMTD > 0 
        ? (approvedMTD / deliveredMTD) * 100 
        : 0

      // Parse ayrshare_profiles data
      let ayrshareProfiles: Record<string, { profile_key?: string; connected_at?: string }> = {}
      try {
        if (gym.ayrshare_profiles) {
          ayrshareProfiles = typeof gym.ayrshare_profiles === 'string' 
            ? JSON.parse(gym.ayrshare_profiles)
            : gym.ayrshare_profiles
        }
      } catch (e) {
        console.error('Error parsing ayrshare_profiles:', e)
      }

      // Format social connections
      const socials = [
        'facebook',
        'instagram',
        'tiktok',
        'youtube'
      ].map(platform => ({
        platform: platform as GymRow['socials'][0]['platform'],
        ayrshare_profiles: gym.ayrshare_profiles
      }))

      // Find the latest scheduled post date
      const lastPostScheduled = posts.length > 0
        ? posts.reduce((latest: string | null, post: any) => {
            const scheduled = post['Scheduled']
            if (!scheduled) return latest
            if (!latest || new Date(scheduled) > new Date(latest)) {
              return scheduled
            }
            return latest
          }, null)
        : null

      return {
        gymId: gym.id,
        gymName: gym['Gym Name'],
        gymSlug: gym.slug || gym['Gym Name'].toLowerCase().replace(/\s+/g, '-'),
        createdAt: gym.created_at || new Date().toISOString(),
        lastUploadDate: gym.last_upload_date,
        lastDeliveryDate: gym.last_delivery_date,
        lastScheduleDate: gym.last_schedule_date,
        lastPostScheduled,
        socials,
        deliveredMTD,
        approvedMTD,
        approvalRatePct,
        uploadsMTD,
        scheduledMTD
      }
    })

    return NextResponse.json({ 
      branding,
      gyms: formattedGyms,
      pagination: {
        total: formattedGyms.length,
        page: 1,
        perPage: formattedGyms.length
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}