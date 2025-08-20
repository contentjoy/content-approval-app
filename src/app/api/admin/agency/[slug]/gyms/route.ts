import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

import { AgencyBrand, GymRow } from '@/types/agency'
import { startOfMonth } from 'date-fns'

import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.pathname.match(/\/api\/admin\/agency\/([^\/]+)\/gyms/)?.[1]
  
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
        social_media_posts (
          *,
          "Approval Status",
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

    // Get start of current month for MTD calculations
    const startOfThisMonth = startOfMonth(new Date())

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

      const deliveredMTD = mtdPosts.filter((post: any) => 
        post['Approval Status'] === 'Approved' && post.published_at
      ).length

      const uploadsMTD = mtdPosts.length
      const scheduledMTD = mtdPosts.filter((post: any) => 
        post.scheduled_time && !post.published_at
      ).length

      // Calculate approval rate
      const approvalRatePct = uploadsMTD > 0 
        ? (approvedMTD / uploadsMTD) * 100 
        : 0

      // Format social connections
      const socials = [
        'facebook',
        'instagram',
        'tiktok',
        'youtube'
      ].map(platform => ({
        platform: platform as GymRow['socials'][0]['platform'],
        connected_at: gym[`${platform}_connected_at`] || undefined,
        profile_key: gym[`${platform}_profile_key`] || undefined,
        platform_username: gym[`${platform}_username`] || undefined
      }))

      return {
        gymId: gym.id,
        gymName: gym['Gym Name'],
        gymSlug: gym.slug || gym['Gym Name'].toLowerCase().replace(/\s+/g, '-'),
        createdAt: gym.created_at || new Date().toISOString(),
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