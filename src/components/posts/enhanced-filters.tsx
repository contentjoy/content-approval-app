'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Calendar, 
  Filter, 
  X, 
  Tag,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react'
import type { SocialMediaPost } from '@/types'
import type { FilterType } from './post-filters'

interface DateRange {
  start: string
  end: string
}

interface EnhancedFiltersProps {
  posts: SocialMediaPost[]
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  onSearchChange: (query: string) => void
  onDateRangeChange: (range: DateRange | null) => void
  onTagsChange: (tags: string[]) => void
  searchQuery: string
  dateRange: DateRange | null
  selectedTags: string[]
  className?: string
}

export function EnhancedFilters({
  posts,
  activeFilter,
  onFilterChange,
  onSearchChange,
  onDateRangeChange,
  onTagsChange,
  searchQuery,
  dateRange,
  selectedTags,
  className = ''
}: EnhancedFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customTags, setCustomTags] = useState<string[]>([])

  // Extract unique custom tags from posts (if they have a tags field)
  useEffect(() => {
    const tags = new Set<string>()
    posts.forEach(post => {
      // You can extend this to extract tags from post captions or add a tags field
      const caption = post['Post Caption'] || ''
      const hashtagMatches = caption.match(/#\w+/g)
      if (hashtagMatches) {
        hashtagMatches.forEach(tag => tags.add(tag.slice(1))) // Remove # symbol
      }
    })
    setCustomTags(Array.from(tags).slice(0, 20)) // Limit to 20 most common tags
  }, [posts])

  const handleReset = () => {
    onSearchChange('')
    onDateRangeChange(null)
    onTagsChange([])
    onFilterChange('all')
  }

  const hasActiveFilters = searchQuery || dateRange || selectedTags.length > 0 || activeFilter !== 'all'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 w-14 flex items-center justify-center pointer-events-none select-none">
            <Search className="h-4 w-4 text-muted-text" />
          </div>
          <input
            type="text"
            placeholder="Search captions, content, or hashtags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-16 pr-4 py-2.5 border border-border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-sm placeholder:text-muted-text bg-[var(--navbar)] h-11 leading-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-muted-text hover:text-text" />
            </button>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`
            flex items-center space-x-2 px-4 py-2.5 rounded-md border font-medium transition-all duration-200 h-11 text-sm
            ${showAdvanced || hasActiveFilters
              ? 'bg-accent text-white border-accent'
              : 'bg-[var(--navbar)] text-text border-border hover:border-accent'
            }
          `}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm">Filters</span>
          {hasActiveFilters && (
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {[searchQuery, dateRange, selectedTags.length > 0, activeFilter !== 'all'].filter(Boolean).length}
            </span>
          )}
        </motion.button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center space-x-2 px-3 py-3 text-muted-text hover:text-text hover:bg-bg-elev-1 rounded-md transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-bg-elev-1 border border-border rounded-xl p-6 space-y-6"
          >
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date Range
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-text mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange?.start || ''}
                    onChange={(e) => onDateRangeChange({ 
                      start: e.target.value, 
                      end: dateRange?.end || e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm bg-bg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-text mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange?.end || ''}
                    onChange={(e) => onDateRangeChange({ 
                      start: dateRange?.start || e.target.value, 
                      end: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm bg-bg"
                  />
                </div>
              </div>
              {dateRange && (
                <button
                  onClick={() => onDateRangeChange(null)}
                  className="mt-2 text-xs text-muted-text hover:text-text flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Clear date range</span>
                </button>
              )}
            </div>

            {/* Tags Filter */}
            {customTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text mb-3">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Popular Hashtags
                </label>
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag) => (
                    <motion.button
                      key={tag}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const newTags = selectedTags.includes(tag)
                          ? selectedTags.filter(t => t !== tag)
                          : [...selectedTags, tag]
                        onTagsChange(newTags)
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                        ${selectedTags.includes(tag)
                          ? 'bg-accent text-white'
                          : 'bg-bg text-text border border-border hover:border-accent'
                        }
                      `}
                    >
                      #{tag}
                    </motion.button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => onTagsChange([])}
                    className="mt-3 text-xs text-muted-text hover:text-text flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear tags ({selectedTags.length})</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                <Filter className="w-4 h-4 inline mr-2" />
                Quick Filters
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => onDateRangeChange({
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  })}
                  className="px-3 py-2 text-xs bg-bg border border-border rounded-lg hover:border-accent transition-colors"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => onDateRangeChange({
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  })}
                  className="px-3 py-2 text-xs bg-bg border border-border rounded-lg hover:border-accent transition-colors"
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => onDateRangeChange({
                    start: new Date().toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0]
                  })}
                  className="px-3 py-2 text-xs bg-bg border border-border rounded-lg hover:border-accent transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => onDateRangeChange({
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  })}
                  className="px-3 py-2 text-xs bg-bg border border-border rounded-lg hover:border-accent transition-colors"
                >
                  Yesterday
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
