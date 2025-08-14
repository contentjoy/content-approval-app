'use client'

import { useEffect, useCallback, useRef } from 'react'
import type { SocialMediaPost } from '@/types'

interface KeyboardShortcutsConfig {
  posts: SocialMediaPost[]
  selectedIndex: number
  onNavigateUp: () => void
  onNavigateDown: () => void
  onApprove: (post: SocialMediaPost) => void
  onDisapprove: (post: SocialMediaPost) => void
  onToggleSelection: (post: SocialMediaPost) => void
  onBulkMode: () => void
  onEscape: () => void
  isEnabled?: boolean
}

export function useKeyboardShortcuts({
  posts,
  selectedIndex,
  onNavigateUp,
  onNavigateDown,
  onApprove,
  onDisapprove,
  onToggleSelection,
  onBulkMode,
  onEscape,
  isEnabled = false
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Shortcuts disabled
    return
  }, [])

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isEnabled])

  return { shortcuts: [] }
}
