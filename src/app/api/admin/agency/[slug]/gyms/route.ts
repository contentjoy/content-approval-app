import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AgencyAdminResponse, GymRow, Platform } from '@/types/agency'

const PLATFORMS: Platform[] = ['facebook', 'instagram', 'tiktok', 'youtube']

function parseSocials(ayrshareProfiles: any) {
  if (!ayrshareProfiles) return []

  return PLATFORMS.map(platform => {
    const profile = ayrshareProfiles[platform]
    if (!profile?.profile_key) return null

    return {
      platform,
      connected_at: profile.connected_at,
      profile_key: profile.profile_key,
      platform_username: profile.platform_username
    }
  }).filter(Boolean)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '25')
    const search = searchParams.get('search') || ''
    const platform = searchParams.get('platform') || 'all'
    const showMissingSocials = searchParams.get('showMissingSocials') === 'true'
    const showLowApproval = searchParams.get('showLowApproval') === 'true'
    const showZeroDelivered = searchParams.get('showZeroDelivered') === 'true'

    // Get agency details
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, "Partner name", "Primary Color", logo')
      .eq('slug', slug)
      .single()

    if (agencyError || !agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    // Build gyms query
    let query = supabase
      .from('gyms')
      .select(`
        id,
        "Gym Name",
        slug,
        created_at,
        ayrshare_profiles,
        v_gym_monthly_stats (
          delivered_mtd,
          approved_mtd,
          approval_rate_pct,
          uploads_mtd,
          scheduled_mtd
        )
      `)
      .eq('Agency', agency.id)
      .eq('Status', 'Active')

    // Apply filters
    if (search) {
      query = query.ilike('Gym Name', `%${search}%`)
    }

    // Get total count before pagination
    const { count: totalCount } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true })
      .eq('Agency', agency.id)
      .eq('Status', 'Active')

    // Apply pagination
    query = query
      .range((page - 1) * perPage, page * perPage - 1)
      .order('created_at', { ascending: false })

    const { data: gyms, error: gymsError } = await query

    if (gymsError) {
      return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 })
    }

    // Transform data
    let transformedGyms: GymRow[] = gyms.map(gym => ({
      gymId: gym.id,
      gymName: gym['Gym Name'],
      gymSlug: gym.slug,
      createdAt: gym.created_at,
      socials: parseSocials(gym.ayrshare_profiles).filter(Boolean) as {
        platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
        connected_at?: string
        profile_key?: string
        platform_username?: string
      }[],
      deliveredMTD: gym.v_gym_monthly_stats?.[0]?.delivered_mtd || 0,
      approvedMTD: gym.v_gym_monthly_stats?.[0]?.approved_mtd || 0,
      approvalRatePct: gym.v_gym_monthly_stats?.[0]?.approval_rate_pct || 0,
      uploadsMTD: gym.v_gym_monthly_stats?.[0]?.uploads_mtd || 0,
      scheduledMTD: gym.v_gym_monthly_stats?.[0]?.scheduled_mtd || 0
    }))

    // Apply client-side filters
    if (platform !== 'all') {
      transformedGyms = transformedGyms.filter(gym => 
        gym.socials.some(s => s.platform === platform)
      )
    }

    if (showMissingSocials) {
      transformedGyms = transformedGyms.filter(gym => gym.socials.length === 0)
    }

    if (showLowApproval) {
      transformedGyms = transformedGyms.filter(gym => gym.approvalRatePct < 50)
    }

    if (showZeroDelivered) {
      transformedGyms = transformedGyms.filter(gym => gym.deliveredMTD === 0)
    }

    const response: AgencyAdminResponse = {
      branding: {
        agencyName: agency['Partner name'],
        primaryColor: agency['Primary Color'],
        logoUrl: agency.logo
      },
      gyms: transformedGyms,
      pagination: {
        total: totalCount || 0,
        page,
        perPage
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in agency gyms route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
