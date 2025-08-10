'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { FileText, Image as ImageIcon, Video, Grid3X3, CheckCircle, XCircle } from 'lucide-react'
import type { SocialMediaPost } from '@/types'

export type FilterType = 'all' | 'photos' | 'videos' | 'carousels' | 'approved' | 'disapproved'

interface PostFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  posts: SocialMediaPost[]
  className?: string
}

export function PostFilters({ activeFilter, onFilterChange, posts, className = '' }: PostFiltersProps) {
  const [open, setOpen] = useState(false)
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
    { key: 'all', label: 'All', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'photos', label: 'Photos', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { key: 'videos', label: 'Videos', icon: <Video className="w-3.5 h-3.5" /> },
    { key: 'carousels', label: 'Carousels', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { key: 'disapproved', label: 'Disapproved', icon: <XCircle className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Desktop pills */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {filters.map((filter) => {
          const count = getFilterCount(filter.key)
          const isActive = activeFilter === filter.key
          return (
            <motion.button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive ? 'bg-accent text-background shadow-medium' : 'bg-bg-elev-1 text-text hover:bg-bg hover:shadow-soft border border-border'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-background/20' : 'bg-bg-elev-1'}`}>
                {count}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Mobile dropdown */}
      <div className="sm:hidden relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm bg-bg-elev-1 border border-border"
        >
          <span>Posts: {filters.find(f => f.key === activeFilter)?.label}</span>
        </button>
        {open && (
          <div className="absolute z-20 mt-2 w-56 bg-bg rounded-xl border border-border shadow-medium">
            {filters.map((filter) => {
              const count = getFilterCount(filter.key)
              return (
                <button
                  key={filter.key}
                  onClick={() => { onFilterChange(filter.key); setOpen(false) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-text hover:bg-bg-elev-1"
                >
                  <span className="flex items-center space-x-2">
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </span>
                  <span className="text-xs text-muted-text">{count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
