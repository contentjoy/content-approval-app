import { supabase } from './supabase'
import type { Gym, SocialMediaPost, Agency } from '@/types'

/**
 * Debug function to show all unique gym names in social_media_posts table
 */
export async function debugGymNamesInPosts(): Promise<string[]> {
  console.log('🔍 Debugging gym names in social_media_posts table...')
  
  const { data: posts, error: postsError } = await supabase
    .from('social_media_posts')
    .select('"Gym Name"')
    .not('"Gym Name"', 'is', null)

  if (postsError) {
    console.error('❌ Error fetching gym names from posts:', postsError)
    return []
  }

  // Get unique gym names
  const uniqueGymNames = [...new Set(posts?.map(post => post['Gym Name']) || [])]
  
  console.log('✅ Unique gym names in social_media_posts table:')
  uniqueGymNames.forEach((gymName, index) => {
    console.log(`${index + 1}. "${gymName}"`)
  })
  
  return uniqueGymNames
}

/**
 * Debug function to show all gym names in gyms table
 */
export async function debugGymNamesInGyms(): Promise<string[]> {
  console.log('🔍 Debugging gym names in gyms table...')
  
  const { data: gyms, error: gymsError } = await supabase
    .from('gyms')
    .select('"Gym Name"')

  if (gymsError) {
    console.error('❌ Error fetching gym names from gyms:', gymsError)
    return []
  }

  const gymNames = gyms?.map(gym => gym['Gym Name']) || []
  
  console.log('✅ Gym names in gyms table:')
  gymNames.forEach((gymName, index) => {
    console.log(`${index + 1}. "${gymName}"`)
  })
  
  return gymNames
}

/**
 * Test function to debug database connection and see available gyms
 */
export async function debugGyms(): Promise<void> {
  console.log('🔍 Debugging gyms in database...')
  
  const { data: gyms, error: gymsError } = await supabase
    .from('gyms')
    .select('*')
    .limit(10)

  if (gymsError) {
    console.error('❌ Error fetching gyms:', gymsError)
    return
  }

  console.log('✅ Available gyms:', gyms)
  
  if (gyms && gyms.length > 0) {
    console.log('📋 Gym names in database:')
    gyms.forEach((gym, index) => {
      console.log(`${index + 1}. "${gym['Gym Name']}" (gym_id: ${gym.gym_id})`)
    })
  } else {
    console.log('⚠️ No gyms found in database')
  }
}

/**
 * Get posts for a specific gym by slug - CORRECT APPROACH
 * Query social_media_posts WHERE "Gym Name" = 'movement society'
 */
export async function getPostsForGymBySlug(slug: string, status?: string): Promise<SocialMediaPost[]> {
  // Convert slug format "gym-name" to lowercase "movement society"
  const gymName = slug.replace(/-/g, ' ').toLowerCase()
  
  console.log('🔍 Getting posts for gym name:', gymName)
  console.log('🔍 Raw slug:', slug)
  console.log('🔍 Converted gym name:', gymName)
  
  // FIRST: Try exact match with quotes (NO LIMIT - get ALL posts)
  console.log('🔍 TRYING EXACT MATCH with quotes...')
  const { data: exactData, error: exactError } = await supabase
    .from('social_media_posts')
    .select('*')
    .eq('"Gym Name"', gymName)
  
  if (exactError) {
    console.error('❌ Exact match error:', exactError)
  } else {
    console.log(`📊 Exact match found: ${exactData?.length || 0} posts`)
    if (exactData && exactData.length > 0) {
      console.log('📝 First post:', exactData[0]['Gym Name'])
      console.log('📝 Sample statuses:', exactData.slice(0, 5).map(p => p['Approval Status']))
    }
  }
  
  // SECOND: Try case-insensitive search (NO LIMIT - get ALL posts)
  console.log('🔍 TRYING CASE-INSENSITIVE SEARCH...')
  const { data: ilikeData, error: ilikeError } = await supabase
    .from('social_media_posts')
    .select('*')
    .ilike('"Gym Name"', gymName)
  
  if (ilikeError) {
    console.error('❌ ILIKE search error:', ilikeError)
  } else {
    console.log(`📊 ILIKE search found: ${ilikeData?.length || 0} posts`)
    if (ilikeData && ilikeData.length > 0) {
      console.log('📝 First post:', ilikeData[0]['Gym Name'])
    }
  }
  
  // THIRD: Try partial match with wildcards (NO LIMIT - get ALL posts)
  console.log('🔍 TRYING PARTIAL MATCH with wildcards...')
  const { data: wildcardData, error: wildcardError } = await supabase
    .from('social_media_posts')
    .select('*')
    .ilike('"Gym Name"', `%${gymName}%`)
  
  if (wildcardError) {
    console.error('❌ Wildcard search error:', wildcardError)
  } else {
    console.log(`📊 Wildcard search found: ${wildcardData?.length || 0} posts`)
    if (wildcardData && wildcardData.length > 0) {
      console.log('📝 First post:', wildcardData[0]['Gym Name'])
    }
  }
  
  // FOURTH: Try without quotes in column name (NO LIMIT - get ALL posts)
  console.log('🔍 TRYING WITHOUT QUOTES in column name...')
  const { data: noQuotesData, error: noQuotesError } = await supabase
    .from('social_media_posts')
    .select('*')
    .eq('Gym Name', gymName)
  
  if (noQuotesError) {
    console.error('❌ No quotes search error:', noQuotesError)
  } else {
    console.log(`📊 No quotes search found: ${noQuotesData?.length || 0} posts`)
    if (noQuotesData && noQuotesData.length > 0) {
      console.log('📝 First post:', noQuotesData[0]['Gym Name'])
    }
  }
  
  // FIFTH: Show sample of ALL gym names to see what's actually there
  console.log('🔍 SHOWING SAMPLE OF ALL GYM NAMES...')
  const { data: allGymNames, error: allGymError } = await supabase
    .from('social_media_posts')
    .select('"Gym Name"')
    .limit(10)
  
  if (allGymError) {
    console.error('❌ Error getting sample gym names:', allGymError)
  } else if (allGymNames) {
    console.log('📋 Sample gym names in database:')
    allGymNames.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post['Gym Name']}" (exact string)`)
    })
  }
  
  // Use the best result we found (should be the one with most posts)
  const bestData = exactData || ilikeData || wildcardData || noQuotesData
  const bestMethod = exactData ? 'exact' : ilikeData ? 'ilike' : wildcardData ? 'wildcard' : noQuotesData ? 'no-quotes' : 'none'
  
  console.log(`🔍 Using ${bestMethod} method with ${bestData?.length || 0} posts`)
  
  if (!bestData || bestData.length === 0) {
    console.error('❌ NO POSTS FOUND with any method!')
    return []
  }
  
  // FIXED STATUS FILTERING: Show posts by default, don't filter out everything
  let filteredData = bestData
  
  if (status) {
    if (status === 'all') {
      // Show ALL posts regardless of status
      filteredData = bestData
      console.log('📊 Status filter: "all" - showing all posts')
    } else if (status === 'approved') {
      filteredData = bestData.filter(post => post['Approval Status'] === 'Approved')
      console.log(`📊 Status filter: "approved" - showing ${filteredData.length} posts`)
    } else if (status === 'disapproved') {
      filteredData = bestData.filter(post => post['Approval Status'] === 'Disapproved')
      console.log(`📊 Status filter: "disapproved" - showing ${filteredData.length} posts`)
    } else if (status === 'pending') {
      filteredData = bestData.filter(post => post['Approval Status'] === 'Pending')
      console.log(`📊 Status filter: "pending" - showing ${filteredData.length} posts`)
    }
  } else {
    // DEFAULT: Show posts with ANY status (including null, empty, Pending, etc.)
    // This ensures we don't filter out everything
    filteredData = bestData
    console.log('📊 No status filter - showing all posts by default')
  }
  
  console.log(`✅ Final result: ${filteredData.length} posts after status filtering`)
  console.log(`📊 Status breakdown:`, {
    total: bestData.length,
    approved: bestData.filter(p => p['Approval Status'] === 'Approved').length,
    disapproved: bestData.filter(p => p['Approval Status'] === 'Disapproved').length,
    pending: bestData.filter(p => p['Approval Status'] === 'Pending').length,
    null: bestData.filter(p => p['Approval Status'] === null).length,
    empty: bestData.filter(p => p['Approval Status'] === '').length,
    other: bestData.filter(p => !['Approved', 'Disapproved', 'Pending', null, ''].includes(p['Approval Status'])).length
  })
  
  return filteredData
}

/**
 * Get gym by slug - DIRECT APPROACH
 * Query gyms table directly by slug name
 */
export async function getGymBySlug(slug: string): Promise<Gym | null> {
  console.log('🔍 Looking for gym with slug:', slug)
  
  try {
    // Query gyms table directly using the slug as the Gym Name
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('"Gym Name"', slug) // Use slug directly since we store it as the gym name
      .single()

    if (gymError) {
      console.error('❌ Error fetching gym by slug:', gymError)
      
      // Debug: Try to get all gyms to see what exists
      const { data: allGyms, error: allError } = await supabase
        .from('gyms')
        .select('id, "Gym Name"')
        .limit(10)
        
      if (allError) {
        console.error('❌ Error fetching all gyms:', allError)
      } else {
        console.log('🏋️ Available gyms in database:', allGyms?.map(g => ({ id: g.id, name: g['Gym Name'] })))
      }
      
      return null
    }

    if (!gym) {
      console.error('❌ No gym found with slug:', slug)
      return null
    }

    console.log('✅ Found gym by slug:', { id: gym.id, name: gym['Gym Name'] })
    return gym
  } catch (error) {
    console.error('❌ Exception in getGymBySlug:', error)
    return null
  }
}

/**
 * Get posts for a specific gym with optional status filter
 */
export async function getPostsForGym(gymId: string, status?: string): Promise<SocialMediaPost[]> {
  console.log('🔍 Getting posts for gym_id:', gymId)
  
  let query = supabase
    .from('social_media_posts')
    .select('*')
    .eq('gym_id', gymId)

  if (status) {
    if (status === 'all') {
      query = query.or('"Approval Status".is.null,"Approval Status".eq.')
    } else if (status === 'approved') {
      query = query.eq('"Approval Status"', 'Approved')
    } else if (status === 'disapproved') {
      query = query.eq('"Approval Status"', 'Disapproved')
    } else if (status === 'pending') {
      query = query.eq('"Approval Status"', 'Pending')
    }
  } else {
    // Default: show posts without approval status (null/empty)
    query = query.or('"Approval Status".is.null,"Approval Status".eq.')
  }

  const { data, error } = await query.order('id', { ascending: false })

  if (error) {
    console.error('❌ Error fetching posts:', error)
    console.error('🔍 Searched for gym_id:', gymId)
    return []
  }

  console.log('✅ Found posts:', data?.length || 0)
  return data || []
}

/**
 * Update post approval status
 */
export async function updatePostApproval(
  postId: string,
  status: 'Approved' | 'Disapproved' | 'Pending',
  options?: { feedback?: string; contentType?: string }
): Promise<{ success: boolean; error?: string }> {
  const updateData: Partial<SocialMediaPost> = {
    'Approval Status': status
  }

  if (options?.contentType) {
    // Update content type when provided
    ;(updateData as any)['Content Type'] = options.contentType
  }

  if (options?.feedback) {
    // Persist feedback to Reason if the column exists
    ;(updateData as any)['Reason'] = options.feedback
  }

  const { error } = await supabase
    .from('social_media_posts')
    .update(updateData)
    .eq('id', postId)

  if (error) {
    console.error('Error updating post approval:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateCarouselGroupApproval(
  carouselGroup: string,
  status: 'Approved' | 'Disapproved' | 'Pending',
  options?: { feedback?: string; contentType?: string }
): Promise<{ success: boolean; error?: string; updatedCount: number }> {
  const updateData: Partial<SocialMediaPost> = {
    'Approval Status': status
  }

  if (options?.contentType) {
    ;(updateData as any)['Content Type'] = options.contentType
  }

  if (options?.feedback) {
    ;(updateData as any)['Reason'] = options.feedback
  }

  const { error, data } = await supabase
    .from('social_media_posts')
    .update(updateData)
    .eq('Carousel Group', carouselGroup)
    .select('*')

  if (error) {
    console.error('Error updating carousel group approval:', error)
    return { success: false, error: error.message, updatedCount: 0 }
  }

  const updatedCount = Array.isArray(data) ? data.length : 0
  return { success: true, updatedCount }
}

/**
 * Get agency branding information - CORRECT APPROACH
 * Use exact column names: "Partner name", "Logo", "Primary Color"
 */
export async function getAgencyBranding(agencyId: string): Promise<Agency | null> {
  const { data, error } = await supabase
    .from('agencies')
    .select('id, "Partner name", "Logo", "Primary Color", "Passcode"')
    .eq('id', agencyId)
    .single()

  if (error) {
    console.error('Error fetching agency branding:', error)
    return null
  }

  return data
}

/**
 * Get all gyms for an agency
 */
export async function getGymsByAgency(agencyName: string): Promise<Gym[]> {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('Agency', agencyName)
    .order('"Gym Name"', { ascending: true })

  if (error) {
    console.error('Error fetching gyms by agency:', error)
    return []
  }

  return data || []
}

/**
 * Get all posts with optional filters
 */
export async function getAllPosts(filters?: {
  status?: string
  gymId?: string
  agency?: string
}): Promise<SocialMediaPost[]> {
  let query = supabase
    .from('social_media_posts')
    .select('*')

  if (filters?.status) {
    if (filters.status === 'all') {
      query = query.or('"Approval Status".is.null,"Approval Status".eq.')
    } else if (filters.status === 'approved') {
      query = query.eq('"Approval Status"', 'Approved')
    } else if (filters.status === 'disapproved') {
      query = query.eq('"Approval Status"', 'Disapproved')
    } else if (filters.status === 'pending') {
      query = query.eq('"Approval Status"', 'Pending')
    }
  } else {
    // Default: show posts without approval status (null/empty)
    query = query.or('"Approval Status".is.null,"Approval Status".eq.')
  }

  if (filters?.gymId) {
    query = query.eq('gym_id', filters.gymId)
  }

  if (filters?.agency) {
    query = query.eq('"Gym Name"', filters.agency)
  }

  const { data, error } = await query.order('id', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data || []
}

// Comments table helpers (to be created in Supabase)
export interface PostComment {
  id: string
  post_id: string
  gym_id: string
  author_first_name: string
  author_last_name: string
  comment: string
  created_at?: string
}

export async function getCommentsForPost(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }
  return data || []
}

export async function addCommentToPost(input: Omit<PostComment, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string; comment?: PostComment }> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert(input)
    .select('*')
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return { success: false, error: error.message }
  }
  return { success: true, comment: data as PostComment }
}

export async function sendRegenerateRequest(payload: { feedback: string; gymName: string; postId: string; templateId?: string | null }) {
  const webhook = 'https://contentjoy.app.n8n.cloud/webhook/f75b31eb-cf28-4ab5-8994-8d6ab6de12fc'
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export async function updateGymProfileKey(gymId: string, profileKey: string): Promise<{ success: boolean; error?: string }>{
  const { error } = await supabase
    .from('gyms')
    .update({ profile_key: profileKey } as any)
    .eq('id', gymId)

  if (error) {
    console.error('Error saving profile_key:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function updatePostReason(postId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('social_media_posts')
    .update({ 'Reason': reason } as any)
    .eq('id', postId)

  if (error) {
    console.error('Error updating reason:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function updateCarouselGroupReason(group: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('social_media_posts')
    .update({ 'Reason': reason } as any)
    .eq('Carousel Group', group)

  if (error) {
    console.error('Error updating group reason:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Get gym by email
 */
export async function getGymByEmail(email: string): Promise<Gym | null> {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('Email', email)
    .single()

  if (error) {
    console.error('Error fetching gym by email:', error)
    return null
  }

  return data
}

/**
 * Discovery helpers
 */
export interface DiscoveryItem {
  id: string
  title: string
  link: string
  platform: 'instagram' | 'tiktok'
  created_at: string
}

export async function getDiscoveryForCurrentMonth(): Promise<DiscoveryItem[]> {
  const now = new Date()
  // Compute month window in UTC to avoid timezone edge cases
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0))

  const { data, error } = await supabase
    .from('discovery')
    .select('id, title, link, platform, created_at')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching discovery items:', error)
    return []
  }
  // Normalize records to typesafe shape
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title ?? row.name ?? '',
    link: row.link,
    platform: (row.platform === 'instagram' || row.platform === 'tiktok') ? row.platform : 'instagram',
    created_at: row.created_at,
  })) as DiscoveryItem[]
}

export interface ScheduledPostSummary {
  id: string
  "Gym Name"?: string
  "Asset URL"?: string
  "Asset Type"?: string
  "Post Caption"?: string
  Scheduled?: string | null
  channel?: string | null
}

export async function getScheduledPosts(gymSlug: string, startDate: Date, endDate: Date): Promise<ScheduledPostSummary[]> {
  // Convert slug like "my-gym" to gym name format if needed, else assume slug is gym id string
  // We already store gym_id on rows, but the instruction says "gymSlug". We'll first try matching by gym_id.
  let query = supabase
    .from('social_media_posts')
    .select('id, "Gym Name", "Asset URL", "Asset Type", "Post Caption", Scheduled, gym_id')
    .gte('Scheduled', startDate.toISOString())
    .lt('Scheduled', endDate.toISOString())
    .order('Scheduled', { ascending: true })

  // Try filter by gym_id using provided slug (many of our routes use the actual id in localStorage)
  query = query.eq('gym_id', gymSlug)

  const { data, error } = await query
  if (error) {
    console.error('Error fetching scheduled posts:', error)
    return []
  }
  return (data || []) as ScheduledPostSummary[]
}
