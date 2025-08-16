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
          fixed z-50 left-0 right-0 mx-auto w-fit
          bg-[var(--modal-surface)] border border-[var(--border)] rounded-[12px] shadow-xl
          px-3 sm:px-6 py-3 sm:py-4 flex items-center space-x-3 sm:space-x-4 whitespace-nowrap
          backdrop-blur-sm bg-[var(--modal-surface)]/95 max-w-[90vw] overflow-hidden
          ${className}
        `}
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        {/* Selection Info */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-[var(--text)] hover:text-[var(--text)] border border-[var(--border)] rounded-[999px] hover:bg-[var(--hover)] hover:border-[var(--border-strong)] transition-all duration-200 whitespace-nowrap"
            >
              <span>({selectedCount}) Selected</span>
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
                  className="absolute bottom-full mb-2 left-0 bg-[var(--modal-surface)] border border-[var(--border)] rounded-[12px] shadow-xl py-2 w-48 z-10"
                >
                  <button
                    onClick={() => {
                      onSelectAll()
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-200"
                    disabled={isAllSelected}
                  >
                    Select all ({totalPosts})
                  </button>
                  <button
                    onClick={() => {
                      onDeselectAll()
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-200"
                  >
                    Deselect all
                  </button>
                  <hr className="my-1 border-[var(--border)]" />
                  <button
                    onClick={() => {
                      onClearSelection()
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-200"
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
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] rounded-[999px] hover:bg-[var(--hover)] transition-all duration-200 font-medium text-xs sm:text-sm border border-[var(--border)]"
          >
            <Check className="w-4 h-4" />
            <span>({selectedCount}) Approve</span>
          </motion.button>

          {/* Disapprove Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDisapprove(selectedPosts)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-[var(--bg)] text-[var(--text)] rounded-[999px] hover:bg-[var(--hover)] transition-all duration-200 font-medium border border-[var(--border)] hover:border-[var(--border-strong)] text-xs sm:text-sm"
          >
            <X className="w-4 h-4" />
            <span>Disapprove</span>
          </motion.button>

          {/* Additional Actions */}
          <div className="h-6 w-px bg-[var(--border)]" />
          
          {/* Archive Action */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-[999px] transition-all duration-200"
            title="Archive selected"
          >
            <Archive className="w-4 h-4" />
          </motion.button>

          {/* Schedule Action */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-[999px] transition-all duration-200"
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
          className="p-2 text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--hover)] rounded-[999px] transition-all duration-200"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}
