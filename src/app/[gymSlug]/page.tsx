'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useBranding } from '@/contexts/branding-context'
import { getPostsForGymBySlug } from '@/lib/database'
import { BrandedButton } from '@/components/ui/branded-button'


import { PostCard } from '@/components/posts/post-card'
import { PostFilters, type FilterType } from '@/components/posts/post-filters'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useModalStore } from '@/hooks/use-modal-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BarChart3 } from 'lucide-react'
import type { SocialMediaPost } from '@/types'

export default function GymPage() {
  const { gymSlug } = useParams()
  const { gymName, agencyName, isLoading, error } = useBranding()
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<SocialMediaPost[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [gymError, setGymError] = useState<string | null>(null)
  const { openModal } = useModalStore()

  useEffect(() => {
    const loadPosts = async () => {
      if (typeof gymSlug === 'string') {
        setIsLoadingPosts(true)
        setGymError(null)
        try {
          console.log('🔍 Loading posts for gym slug:', gymSlug)
          const gymPosts = await getPostsForGymBySlug(gymSlug)
          console.log('✅ Loaded posts:', gymPosts.length)
          
          // Debug: Show first few posts if any found
          if (gymPosts.length > 0) {
            console.log('📊 Sample posts:', gymPosts.slice(0, 3).map(p => ({
              id: p.id,
              gymName: p['Gym Name'],
              caption: p['Post Caption']?.substring(0, 50),
              assetType: p['Asset Type'],
              carouselGroup: p['Carousel Group']
            })))
          } else {
            console.log('❌ No posts found for gym slug:', gymSlug)
          }
          setPosts(gymPosts)
          setFilteredPosts(gymPosts)
        } catch (error) {
          console.error('❌ Error loading posts:', error)
          setGymError('Failed to load posts. Please try again.')
        } finally {
          setIsLoadingPosts(false)
        }
      }
    }

    loadPosts()
  }, [gymSlug])

  // Group posts by carousel group and create display posts
  const { carouselGroups, displayPosts } = useMemo(() => {
    const groups: Record<string, SocialMediaPost[]> = {}
    const display: SocialMediaPost[] = []
    const seenCarouselGroups = new Set<string>()
    
    // First, group all carousel posts
    posts.forEach(post => {
      if (post['Carousel Group']) {
        const groupId = post['Carousel Group']
        if (!groups[groupId]) {
          groups[groupId] = []
        }
        groups[groupId].push(post)
      }
    })
    
    // Sort carousel groups by carousel order
    Object.keys(groups).forEach(groupId => {
      groups[groupId].sort((a, b) => {
        const orderA = parseInt(a['Carousel Order']?.toString() || '0')
        const orderB = parseInt(b['Carousel Order']?.toString() || '0')
        return orderA - orderB
      })
    })
    
    // Create display posts - one per carousel group + individual posts
    posts.forEach(post => {
      if (post['Carousel Group']) {
        const groupId = post['Carousel Group']
        if (!seenCarouselGroups.has(groupId)) {
          // Add the first post from this carousel group
          display.push(groups[groupId][0])
          seenCarouselGroups.add(groupId)
        }
      } else {
        // Add individual posts
        display.push(post)
      }
    })
    
    return { carouselGroups: groups, displayPosts: display }
  }, [posts])

  // Calculate progress
  const approvedPosts = useMemo(() => {
    return displayPosts.filter(post => post['Approval Status']?.toLowerCase() === 'approved')
  }, [displayPosts])

  const pendingPosts = useMemo(() => {
    return displayPosts.filter(post => post['Approval Status']?.toLowerCase() === 'pending')
  }, [displayPosts])

  const totalPosts = pendingPosts.length  // Use pending posts for progress calculation
  const approvedCount = approvedPosts.length
  const goal = 30 // Goal is 30 approved posts

  // Filter posts based on active filter
  useEffect(() => {
    let filtered = displayPosts

    switch (activeFilter) {
      case 'photos':
        // Only show pending photos (no carousel posts)
        filtered = displayPosts.filter(post => 
          (post['Asset Type']?.toLowerCase() === 'photo' || !post['Asset Type']) && 
          !post['Carousel Group'] &&
          post['Approval Status']?.toLowerCase() === 'pending'
        )
        break
      case 'videos':
        // Only show pending videos (exclude carousel posts)
        filtered = displayPosts.filter(post => 
          post['Asset Type']?.toLowerCase() === 'video' &&
          !post['Carousel Group'] &&
          post['Approval Status']?.toLowerCase() === 'pending'
        )
        break
      case 'carousels':
        // Only show pending carousels
        filtered = displayPosts.filter(post => 
          post['Carousel Group'] &&
          post['Approval Status']?.toLowerCase() === 'pending'
        )
        break
      case 'approved':
        // Only show approved posts
        filtered = displayPosts.filter(post => post['Approval Status']?.toLowerCase() === 'approved')
        break
      case 'disapproved':
        // Only show disapproved posts
        filtered = displayPosts.filter(post => 
          post['Approval Status']?.toLowerCase() === 'disapproved' || 
          post['Approval Status']?.toLowerCase() === 'rejected'
        )
        break
      case 'pending':
        filtered = displayPosts.filter(post => post['Approval Status']?.toLowerCase() === 'pending')
        break
      default:
        // All filter - only show pending posts
        filtered = displayPosts.filter(post => post['Approval Status']?.toLowerCase() === 'pending')
    }

    setFilteredPosts(filtered)
  }, [activeFilter, displayPosts])

  const handleSchedulePosts = () => {
    if (approvedPosts.length === 0) {
      // Show toast or alert that no posts are approved
      return
    }
    openModal('schedule', undefined, undefined, approvedPosts)
  }

  if (isLoading || isLoadingPosts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error || gymError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Content</h2>
          <p className="text-gray-600 mb-4">{error || gymError}</p>
          <div className="text-sm text-gray-500">
            <p>Gym Slug: {gymSlug}</p>
            <p>Gym Name: {gymName || 'Not found'}</p>
            <p>Agency: {agencyName || 'Not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {gymName || 'Content Approval'}
              </h1>
              <p className="text-gray-600">
                {agencyName ? `${agencyName} • ` : ''}Content Management Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <BrandedButton
              onClick={handleSchedulePosts}
              disabled={approvedPosts.length === 0}
              className="bg-black hover:bg-gray-800 text-white rounded-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Posts ({approvedPosts.length})
            </BrandedButton>
            <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar
            current={approvedCount}
            total={totalPosts}
            goal={goal}
            className="bg-white p-6 rounded-lg shadow-sm border"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{displayPosts.length}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayPosts.filter(p => p['Approval Status']?.toLowerCase() === 'pending').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayPosts.filter(p => p['Approval Status']?.toLowerCase() === 'approved').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayPosts.filter(p => p['Approval Status']?.toLowerCase() === 'disapproved' || p['Approval Status']?.toLowerCase() === 'rejected').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <PostFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          posts={displayPosts}
        />
      </div>

      {/* Content Grid */}
      <AnimatePresence>
        {filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600">
              {activeFilter === 'all' 
                ? 'No posts have been uploaded yet.' 
                : `No ${activeFilter} posts found.`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPosts.map((post, index) => {
              // Get carousel posts for this post if it's part of a carousel
              const carouselPosts = post['Carousel Group'] 
                ? carouselGroups[post['Carousel Group']] || []
                : []

              // Add priority to first 6 images for LCP optimization
              const priority = index < 6

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  carouselPosts={carouselPosts}
                  priority={priority}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
