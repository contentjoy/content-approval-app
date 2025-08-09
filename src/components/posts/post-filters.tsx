'use client'

import { motion } from 'framer-motion'
import type { SocialMediaPost } from '@/types'

export type FilterType = 'all' | 'photos' | 'videos' | 'carousels' | 'approved' | 'disapproved' | 'pending'

interface PostFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  posts: SocialMediaPost[]
  className?: string
}

export function PostFilters({ activeFilter, onFilterChange, posts, className = '' }: PostFiltersProps) {
  const getFilterCount = (filter: FilterType) => {
    switch (filter) {
      case 'photos':
        return posts.filter(p => 
          (p['Asset Type']?.toLowerCase() === 'photo' || !p['Asset Type']) && 
          !p['Carousel Group'] &&
          p['Approval Status']?.toLowerCase() === 'pending'
        ).length
      case 'videos':
        return posts.filter(p => 
          p['Asset Type']?.toLowerCase() === 'video' &&
          !p['Carousel Group'] &&
          p['Approval Status']?.toLowerCase() === 'pending'
        ).length
      case 'carousels':
        return posts.filter(p => 
          p['Carousel Group'] &&
          p['Approval Status']?.toLowerCase() === 'pending'
        ).length
      case 'approved':
        return posts.filter(p => p['Approval Status']?.toLowerCase() === 'approved').length
      case 'disapproved':
        return posts.filter(p => p['Approval Status']?.toLowerCase() === 'disapproved' || p['Approval Status']?.toLowerCase() === 'rejected').length
      case 'pending':
        return posts.filter(p => p['Approval Status']?.toLowerCase() === 'pending').length
      default:
        return posts.filter(p => p['Approval Status']?.toLowerCase() === 'pending').length
    }
  }

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📄' },
    { key: 'photos', label: 'Photos', icon: '📷' },
    { key: 'videos', label: 'Videos', icon: '🎥' },
    { key: 'carousels', label: 'Carousels', icon: '🖼️' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'approved', label: 'Approved', icon: '✅' },
    { key: 'disapproved', label: 'Disapproved', icon: '❌' },
  ]

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map((filter) => {
        const count = getFilterCount(filter.key)
        const isActive = activeFilter === filter.key
        
        return (
          <motion.button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[var(--brand-primary)] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
          >
            <span className="text-base">{filter.icon}</span>
            <span>{filter.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              isActive 
                ? 'bg-white bg-opacity-20' 
                : 'bg-gray-200'
            }`}>
              {count}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
