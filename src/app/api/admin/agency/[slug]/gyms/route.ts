import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('🔍 API Route Hit: /api/admin/agency/[slug]/gyms')
  try {
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const slug = segments[segments.indexOf('agency') + 1]
    console.log('📝 Slug:', slug)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '25')
    const search = searchParams.get('search') || ''
    const platform = searchParams.get('platform') || 'all'
    const showMissingSocials = searchParams.get('showMissingSocials') === 'true'
    const showLowApproval = searchParams.get('showLowApproval') === 'true'
    const showZeroDelivered = searchParams.get('showZeroDelivered') === 'true'

    console.log('🔍 Search params:', { page, perPage, search, platform, showMissingSocials, showLowApproval, showZeroDelivered })

    // Get agency details
    console.log('🔍 Fetching agency details for slug:', slug)
    console.log('🔍 Supabase client:', !!supabase)
    
    // Get agency by slug
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, "Partner name", "Primary Color", logo')
      .ilike('slug', slug)
      .single()

    console.log('🔍 Agency query:', { slug, agency, agencyError })

    if (agencyError || !agency) {
      console.log('❌ Agency not found:', agencyError)
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    console.log('✅ Agency found:', agency.id)

    // Get current month for MTD calculations
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()
    
    console.log('📅 Current month/year for MTD:', { currentMonth, currentYear })

    // Build gyms query with custom monthly stats
    let query = supabase
      .from('gyms')
      .select(`
        id,
        "Gym Name",
        slug,
        created_at,
        ayrshare_profiles,
        social_accounts
      `)
      .eq('Agency', agency.id)
      .eq('Status', 'Active')

    // Apply search filter
    if (search) {
      query = query.ilike('"Gym Name"', `%${search}%`)
    }

    // Apply platform filter
    if (platform !== 'all') {
      // Filter by platform in social_accounts or ayrshare_profiles
      // This will be handled in the data transformation
    }

    // Get paginated results
    const { data: gyms, error: gymsError } = await query
      .range((page - 1) * perPage, page * perPage - 1)
      .order('created_at', { ascending: false })

    if (gymsError) {
      console.error('❌ Error fetching gyms:', gymsError)
      return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 })
    }

    console.log('✅ Gyms fetched:', gyms?.length || 0)

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true })
      .eq('Agency', agency.id)
      .eq('Status', 'Active')

    // Transform gyms data and calculate monthly stats
    const transformedGyms = await Promise.all(
      (gyms || []).map(async (gym) => {
        // Calculate monthly stats from social_media_posts
        const monthStart = new Date(currentYear, currentMonth - 1, 1)
        const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)
        
        const { data: posts, error: postsError } = await supabase
          .from('social_media_posts')
          .select('id, "Approval Status", "Posted", "Scheduled", created_at')
          .eq('gym_id', gym.id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())

        if (postsError) {
          console.error(`❌ Error fetching posts for gym ${gym.id}:`, postsError)
          return null
        }

        const postsData = posts || []
        
        // Calculate MTD stats
        const totalMTD = postsData.length
        const approvedMTD = postsData.filter(post => post['Approval Status'] === 'Approved').length
        const deliveredMTD = postsData.filter(post => post['Posted'] === 'Yes').length
        const scheduledMTD = postsData.filter(post => post['Scheduled'] !== null).length
        const approvalRate = totalMTD > 0 ? Math.round((approvedMTD / totalMTD) * 100) : 0

        // Parse social connections
        const socials = parseSocials(gym.ayrshare_profiles, gym.social_accounts)

        return {
          id: gym.id,
          gymName: gym['Gym Name'],
          gymSlug: gym.slug,
          createdAt: gym.created_at,
          socials,
          approvedMTD,
          deliveredMTD,
          approvalRate,
          uploadsMTD: totalMTD,
          scheduledMTD
        }
      })
    )

    // Filter out null results and apply additional filters
    let filteredGyms = transformedGyms.filter(Boolean)

    if (showMissingSocials) {
      filteredGyms = filteredGyms.filter(gym => gym && gym.socials.length === 0)
    }

    if (showLowApproval) {
      filteredGyms = filteredGyms.filter(gym => gym && gym.approvalRate < 50)
    }

    if (showZeroDelivered) {
      filteredGyms = filteredGyms.filter(gym => gym && gym.deliveredMTD === 0)
    }

    console.log('✅ Transformed gyms:', filteredGyms.length)

    return NextResponse.json({
      gyms: filteredGyms,
      pagination: {
        page,
        perPage,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / perPage)
      },
      agency: {
        name: agency['Partner name'],
        primaryColor: agency['Primary Color'],
        logo: agency.logo
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function parseSocials(ayrshareProfiles: any, socialAccounts: any): Array<{ platform: string; connected: boolean; profile?: string }> {
  const platforms = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter']
  const socials: Array<{ platform: string; connected: boolean; profile?: string }> = []

  platforms.forEach(platform => {
    let connected = false
    let profile = ''

    // Check ayrshare profiles
    if (ayrshareProfiles && typeof ayrshareProfiles === 'object') {
      const platformData = ayrshareProfiles[platform]
      if (platformData && platformData.profileId) {
        connected = true
        profile = platformData.profileId
      }
    }

    // Check social accounts
    if (socialAccounts && typeof socialAccounts === 'object') {
      const platformData = socialAccounts[platform]
      if (platformData && platformData.connected) {
        connected = true
        if (!profile) profile = platformData.username || platformData.profileId || ''
      }
    }

    socials.push({ platform, connected, profile })
  })

  return socials.filter(Boolean) as Array<{ platform: string; connected: boolean; profile?: string }>
}
