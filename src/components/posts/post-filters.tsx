'use client'

import { motion } from 'framer-motion'
import { FileText, Image, Video, Grid3X3, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { SocialMediaPost } from '@/types'

export type FilterType = 'all' | 'photos' | 'videos' | 'carousels' | 'approved' | 'disapproved'

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
      default:
        return posts.filter(p => p['Approval Status']?.toLowerCase() === 'pending').length
    }
  }

  const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <FileText className="w-4 h-4" /> },
    { key: 'photos', label: 'Photos', icon: <Image className="w-4 h-4" /> },
    { key: 'videos', label: 'Videos', icon: <Video className="w-4 h-4" /> },
    { key: 'carousels', label: 'Carousels', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'disapproved', label: 'Disapproved', icon: <XCircle className="w-4 h-4" /> },
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
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[var(--brand-primary)] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
          >
            <span>{filter.icon}</span>
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
