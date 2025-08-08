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
 * Get gym by slug - CORRECT APPROACH
 * Get gym_id from posts, then query gyms table
 */
export async function getGymBySlug(slug: string): Promise<Gym | null> {
  // Convert slug format "gym-name" to lowercase "movement society"
  const gymName = slug.replace(/-/g, ' ').toLowerCase()
  
  console.log('🔍 Looking for gym with name:', gymName)
  
  // First, get a post to find the gym_id
  const { data: posts, error: postsError } = await supabase
    .from('social_media_posts')
    .select('"Gym Name", gym_id')
    .eq('"Gym Name"', gymName) // Exact match with lowercase name
    .limit(1)

  if (postsError) {
    console.error('❌ Error searching posts table:', postsError)
    return null
  }

  if (!posts || posts.length === 0) {
    console.error('❌ No posts found for gym name:', gymName)
    return null
  }
  
  console.log(`📊 Found ${posts.length} posts for gym:`, gymName)
  console.log('📝 Sample posts:', posts.map(p => ({ gymName: p['Gym Name'], gymId: p.gym_id })))

  const post = posts[0]
  const gymId = post.gym_id
  
  if (!gymId) {
    console.error('❌ No gym_id found in post for gym:', gymName)
    console.log('📝 Post data:', post)
    return null
  }
  
  console.log('🔑 Found gym_id:', gymId, 'for gym:', gymName)
  
  // Now get the full gym record using the gym_id from the post
  console.log('🔍 Querying gyms table for gym_id:', gymId)
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', gymId) // Use 'id' column, not 'gym_id'
    .single()

  if (gymError) {
    console.error('❌ Error fetching gym from gym_id:', gymError)
    console.log('🔍 Debug: Trying to find any gyms in the table...')
    
    // Debug: Let's see what's in the gyms table
    const { data: allGyms, error: debugError } = await supabase
      .from('gyms')
      .select('id, "Gym Name"')
      .limit(5)
    
    if (debugError) {
      console.error('❌ Cannot access gyms table:', debugError)
    } else if (allGyms) {
      console.log('📋 Sample gyms in table:', allGyms)
    }
    
    return null
  }

  console.log('✅ Found gym via posts table:', gym)
  return gym
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
  status: string, 
  feedback?: string
): Promise<{ success: boolean; error?: string }> {
  const updateData: Partial<SocialMediaPost> = {
    'Approval Status': status
  }

  // TODO: Add feedback field to database if needed
  if (feedback) {
    console.log('Feedback provided:', feedback)
    // You can add feedback to a separate table or extend the social_media_posts table
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
