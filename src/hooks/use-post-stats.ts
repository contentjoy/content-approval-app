'use client'

import { useState, useEffect } from 'react'
import { getPostsForGymBySlug } from '@/lib/database'
// import { SocialMediaPost } from '@/types'

interface PostStats {
  total: number
  pending: number
  approved: number
  rejected: number
  isLoading: boolean
  error: string | null
}

export function usePostStats(gymSlug: string | null): PostStats {
  const [stats, setStats] = useState<PostStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    isLoading: false,
    error: null
  })

  useEffect(() => {
    if (!gymSlug) return

    const fetchStats = async () => {
      setStats(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        const posts = await getPostsForGymBySlug(gymSlug)
        
        // Get current month boundaries
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        
        // Filter posts by current month
        const currentMonthPosts = posts.filter(post => {
          if (!post.updated_at) return false
          const postDate = new Date(post.updated_at)
          return postDate >= startOfMonth && postDate <= endOfMonth
        })
        
        const total = currentMonthPosts.length
        const pending = currentMonthPosts.filter(p => p['Approval Status']?.toLowerCase() === 'pending').length
        const approved = currentMonthPosts.filter(p => p['Approval Status']?.toLowerCase() === 'approved').length
        const rejected = currentMonthPosts.filter(p => 
          p['Approval Status']?.toLowerCase() === 'disapproved' || 
          p['Approval Status']?.toLowerCase() === 'rejected'
        ).length

        setStats({
          total,
          pending,
          approved,
          rejected,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching post stats:', error)
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats'
        }))
      }
    }

    fetchStats()
  }, [gymSlug])

  return stats
}
