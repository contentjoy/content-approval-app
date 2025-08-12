'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useBranding } from '@/contexts/branding-context'
import { getPostsForGymBySlug } from '@/lib/database'


import { PostCard, BulkActionsToolbar, EnhancedFilters } from '@/components/posts/index'
import { PostFilters, type FilterType } from '@/components/posts/post-filters'
//
import { useModalStore } from '@/hooks/use-modal-store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare } from 'lucide-react'
import type { SocialMediaPost } from '@/types'

// Simple in-memory cache per slug for instant back-navigation
const contentCache: Record<string, { posts: SocialMediaPost[]; ts: number }> = {}

export default function GymPage() {
  const { gymSlug } = useParams()
  const { gymName, agencyName, isLoading, error } = useBranding()
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<SocialMediaPost[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [gymError, setGymError] = useState<string | null>(null)
  
  // Enhanced UX State
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const { openModal, setApprovedPosts } = useModalStore()

  useEffect(() => {
    if (typeof gymSlug !== 'string') return

    setGymError(null)

    // 1) Serve from cache instantly if available
    const cached = contentCache[gymSlug]
    if (cached) {
      setPosts(cached.posts)
      setFilteredPosts(cached.posts)
      setIsLoadingPosts(false)
    } else {
      setIsLoadingPosts(true)
    }

    // 2) Always revalidate in background
    ;(async () => {
      try {
        const fresh = await getPostsForGymBySlug(gymSlug)
        setPosts(fresh)
        setFilteredPosts(fresh)
        contentCache[gymSlug] = { posts: fresh, ts: Date.now() }
      } catch (error) {
        console.error('❌ Error loading posts:', error)
        if (!cached) setGymError('Failed to load posts. Please try again.')
      } finally {
        setIsLoadingPosts(false)
      }
    })()
  }, [gymSlug])

  // Remove posts immediately when media deletion event fires
  useEffect(() => {
    const onDeleted = (e: Event) => {
      const id = (e as CustomEvent).detail?.id as string | undefined
      if (!id) return
      setPosts(prev => prev.filter(p => p.id !== id))
      setFilteredPosts(prev => prev.filter(p => p.id !== id))
      // Also evict cache entry for this slug to avoid stale items reappearing
      if (typeof gymSlug === 'string') {
        const cached = contentCache[gymSlug]
        if (cached) contentCache[gymSlug] = { posts: cached.posts.filter(p => p.id !== id), ts: cached.ts }
      }
    }
    window.addEventListener('post-deleted', onDeleted as EventListener)
    return () => window.removeEventListener('post-deleted', onDeleted as EventListener)
  }, [gymSlug])

  // Listen for optimistic updates from modals and update local state without reload
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as any
      if (!detail) return

      if (detail.type === 'approved' || detail.type === 'disapproved') {
        setPosts(prev => prev.map(p => (p.id === detail.id ? { ...p, 'Approval Status': detail.type === 'approved' ? 'Approved' : 'Disapproved', ...(detail.feedback ? { Reason: detail.feedback } : {}) } : p)))
      }

      if (detail.type === 'approved-group' || detail.type === 'disapproved-group') {
        setPosts(prev => prev.map(p => (p['Carousel Group'] === detail.group ? { ...p, 'Approval Status': detail.type === 'approved-group' ? 'Approved' : 'Disapproved', ...(detail.feedback ? { Reason: detail.feedback } : {}) } : p)))
      }
    }
    window.addEventListener('post-updated', handler as EventListener)
    return () => window.removeEventListener('post-updated', handler as EventListener)
  }, [])

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
  // Precomputed counts for header/metrics; kept as variables to enable future usage
  const approvedPosts = useMemo(
    () => posts.filter(post => post['Approval Status']?.toLowerCase() === 'approved'),
    [posts]
  )
  const pendingPosts = useMemo(
    () => displayPosts.filter(post => post['Approval Status']?.toLowerCase() === 'pending'),
    [displayPosts]
  )
  useEffect(() => {
    // Keep modal store in sync so header Schedule button can access approved items
    setApprovedPosts(approvedPosts)
  }, [approvedPosts, setApprovedPosts])
  void approvedPosts.length
  void pendingPosts.length

  // Progress metrics computed elsewhere if needed

  // Enhanced filtering logic with search, date range, and tags
  useEffect(() => {
    let filtered = displayPosts

    // 1. First apply status/type filter
    switch (activeFilter) {
      case 'photos':
        filtered = filtered.filter(post => 
          (post['Asset Type']?.toLowerCase() === 'photo' || !post['Asset Type']) && 
          !post['Carousel Group'] &&
          post['Approval Status']?.toLowerCase() === 'pending'
        )
        break
      case 'videos':
        filtered = filtered.filter(post => 
          post['Asset Type']?.toLowerCase() === 'video' &&
          !post['Carousel Group'] &&
          post['Approval Status']?.toLowerCase() === 'pending'
        )
        break
      case 'carousels':
        filtered = filtered.filter(post => 
          post['Carousel Group'] &&
          post['Approval Status']?.toLowerCase() === 'pending'
        )
        break
      case 'approved':
        filtered = filtered.filter(post => post['Approval Status']?.toLowerCase() === 'approved')
        break
      case 'disapproved':
        filtered = filtered.filter(post => 
          post['Approval Status']?.toLowerCase() === 'disapproved' || 
          post['Approval Status']?.toLowerCase() === 'rejected'
        )
        break
      default:
        filtered = filtered.filter(post => post['Approval Status']?.toLowerCase() === 'pending')
    }

    // 2. Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(post => {
        const caption = (post['Post Caption'] || '').toLowerCase()
        const assetType = (post['Asset Type'] || '').toLowerCase()
        const carouselGroup = (post['Carousel Group'] || '').toLowerCase()
        
        return caption.includes(query) || 
               assetType.includes(query) || 
               carouselGroup.includes(query)
      })
    }

    // 3. Apply date range filter
    if (dateRange) {
      filtered = filtered.filter(post => {
        const createdAt = post.created_at || post.updated_at
        if (!createdAt) return false
        
        const postDate = new Date(createdAt).toISOString().split('T')[0]
        return postDate >= dateRange.start && postDate <= dateRange.end
      })
    }

    // 4. Apply tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post => {
        const caption = post['Post Caption'] || ''
        return selectedTags.some(tag => caption.toLowerCase().includes(`#${tag.toLowerCase()}`))
      })
    }

    setFilteredPosts(filtered)
    
    // Reset selection when filters change
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1))
    }
  }, [activeFilter, displayPosts, searchQuery, dateRange, selectedTags, selectedIndex])

  // const handleSchedulePosts = () => {
  //   if (approvedPosts.length === 0) return
  //   openModal('schedule', undefined, undefined, approvedPosts)
  // }

  // Bulk operations handlers
  const handleBulkApprove = (posts: SocialMediaPost[]) => {
    if (posts.length === 1) {
      openModal('approve', posts[0])
    } else {
      // Open approve modal on the first post to select options; pass bulkPosts for batch update
      openModal('approve', posts[0], [], [], posts)
    }
  }

  const handleBulkDisapprove = (posts: SocialMediaPost[]) => {
    if (posts.length === 1) {
      openModal('disapprove', posts[0])
    } else {
      openModal('disapprove', posts[0], [], [], posts)
    }
  }

  const handleSelectionChange = (postId: string, selected: boolean) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(postId)
      } else {
        newSet.delete(postId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedPosts(new Set(filteredPosts.map(post => post.id || '')))
  }

  const handleDeselectAll = () => {
    setSelectedPosts(new Set())
  }

  const handleClearSelection = () => {
    setSelectedPosts(new Set())
    setIsBulkMode(false)
  }

  // Keyboard shortcuts handlers
  const handleNavigateUp = () => {
    setSelectedIndex(prev => Math.max(0, prev - 1))
  }

  const handleNavigateDown = () => {
    setSelectedIndex(prev => Math.min(filteredPosts.length - 1, prev + 1))
  }

  const handleApproveSelected = (post: SocialMediaPost) => {
    openModal('approve', post)
  }

  const handleDisapproveSelected = (post: SocialMediaPost) => {
    openModal('disapprove', post)
  }

  const handleToggleSelection = (post: SocialMediaPost) => {
    if (post.id) {
      handleSelectionChange(post.id, !selectedPosts.has(post.id))
    }
  }

  const handleToggleBulkMode = () => {
    setIsBulkMode(prev => !prev)
    if (isBulkMode) {
      setSelectedPosts(new Set())
    }
  }

  const handleEscape = () => {
    if (isBulkMode) {
      setIsBulkMode(false)
      setSelectedPosts(new Set())
    }
  }

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    posts: filteredPosts,
    selectedIndex,
    onNavigateUp: handleNavigateUp,
    onNavigateDown: handleNavigateDown,
    onApprove: handleApproveSelected,
    onDisapprove: handleDisapproveSelected,
    onToggleSelection: handleToggleSelection,
    onBulkMode: handleToggleBulkMode,
    onEscape: handleEscape,
    isEnabled: !isLoadingPosts,
    isBulkMode
  })

  // Convert selected posts set to array for components
  const selectedPostsArray = filteredPosts.filter(post => post.id && selectedPosts.has(post.id))

  if (isLoading || isLoadingPosts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error || gymError) {
    return (
      <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-destructive mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
            <h2 className="text-xl font-semibold text-text mb-2">Error Loading Content</h2>
            <p className="text-muted-text mb-4">{error || gymError}</p>
          <div className="text-sm text-muted-foreground">
            <p>Gym Slug: {gymSlug}</p>
            <p>Gym Name: {gymName || 'Not found'}</p>
            <p>Agency: {agencyName || 'Not found'}</p>
          </div>
        </div>
      </div>
    )
  }

    return (
    <div className="container mx-auto px-4 py-6">
            {/* Compact Header - Just the title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">
          Content
        </h1>
      </div>

      {/* Enhanced Filters */}
      <div className="mb-6 space-y-4">
        <EnhancedFilters
          posts={displayPosts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onSearchChange={setSearchQuery}
          onDateRangeChange={setDateRange}
          onTagsChange={setSelectedTags}
          searchQuery={searchQuery}
          dateRange={dateRange}
          selectedTags={selectedTags}
        />
        
        {/* Filter Tabs and Bulk Mode Toggle */}
        <div className="flex items-center justify-between">
          <PostFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            posts={displayPosts}
          />
          
          {/* Bulk Mode Toggle */}
          <div className="flex items-center space-x-3">
            {filteredPosts.length > 0 && (
              <>
                <span className="text-xs text-muted-text">
                  {filteredPosts.length} posts
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleBulkMode}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${isBulkMode
                      ? 'bg-accent text-background'
                      : 'bg-bg-elev-1 text-text hover:bg-bg'
                    }
                  `}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="text-xs">{isBulkMode ? 'Exit Bulk' : 'Bulk Select'}</span>
                  {selectedPosts.size > 0 && (
                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                      {selectedPosts.size}
                    </span>
                  )}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <AnimatePresence>
        {filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-bg-elev-1 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">No content found</h3>
            <p className="text-muted-text">
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
                  isBulkMode={isBulkMode}
                  isSelected={post.id ? selectedPosts.has(post.id) : false}
                  onSelectionChange={handleSelectionChange}
                   className={''}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedPosts={selectedPostsArray}
        onApprove={handleBulkApprove}
        onDisapprove={handleBulkDisapprove}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        totalPosts={filteredPosts.length}
      />
    </div>
  )
}
