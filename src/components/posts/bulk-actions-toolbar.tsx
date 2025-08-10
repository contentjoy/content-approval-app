'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Archive, Calendar, ChevronDown } from 'lucide-react'
import React, { useState } from 'react'
import type { SocialMediaPost } from '@/types'

interface BulkActionsToolbarProps {
  selectedPosts: SocialMediaPost[]
  onApprove: (posts: SocialMediaPost[]) => void
  onDisapprove: (posts: SocialMediaPost[]) => void
  onClearSelection: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  totalPosts: number
  className?: string
}

export function BulkActionsToolbar({
  selectedPosts,
  onApprove,
  onDisapprove,
  onClearSelection,
  onSelectAll,
  onDeselectAll,
  totalPosts,
  className = ''
}: BulkActionsToolbarProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const selectedCount = selectedPosts.length

  if (selectedCount === 0) {
    return null
  }

  const isAllSelected = selectedCount === totalPosts

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`
          fixed bottom-4 left-1/2 -translate-x-1/2 z-50
          bg-bg border border-border rounded-2xl shadow-large
          px-3 sm:px-6 py-3 sm:py-4 flex items-center space-x-3 sm:space-x-4
          backdrop-blur-sm bg-bg/95 max-w-[95vw]
          ${className}
        `}
      >
        {/* Selection Info */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-text hover:text-text border border-border rounded-lg hover:border-accent transition-colors"
            >
              <span>{selectedCount} selected</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Selection Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full mb-2 left-0 bg-bg border border-border rounded-lg shadow-large py-2 w-48 z-10"
                >
                  <button
                    onClick={() => {
                      onSelectAll()
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text hover:bg-bg-elev-1 transition-colors"
                    disabled={isAllSelected}
                  >
                    Select all ({totalPosts})
                  </button>
                  <button
                    onClick={() => {
                      onDeselectAll()
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text hover:bg-bg-elev-1 transition-colors"
                  >
                    Deselect all
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onClearSelection()
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text hover:bg-bg-elev-1 transition-colors"
                  >
                    Clear selection
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center space-x-2">
          {/* Approve Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onApprove(selectedPosts)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors font-medium text-xs sm:text-sm"
          >
            <Check className="w-4 h-4" />
            <span>Approve ({selectedCount})</span>
          </motion.button>

          {/* Disapprove Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDisapprove(selectedPosts)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-bg-elev-1 text-text rounded-lg hover:bg-bg transition-colors font-medium border border-border text-xs sm:text-sm"
          >
            <X className="w-4 h-4" />
            <span>Disapprove</span>
          </motion.button>

          {/* Additional Actions */}
          <div className="h-6 w-px bg-border" />
          
          {/* Archive Action */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-muted-text hover:text-text hover:bg-bg-elev-1 rounded-lg transition-colors"
            title="Archive selected"
          >
            <Archive className="w-4 h-4" />
          </motion.button>

          {/* Schedule Action */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-muted-text hover:text-text hover:bg-bg-elev-1 rounded-lg transition-colors"
            title="Schedule selected"
          >
            <Calendar className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClearSelection}
          className="p-2 text-muted-text hover:text-text hover:bg-bg-elev-1 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}
