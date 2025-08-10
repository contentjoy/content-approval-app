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
  isBulkMode?: boolean
}

export function useKeyboardShortcuts({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  posts,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedIndex,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNavigateUp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNavigateDown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onApprove,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDisapprove,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleSelection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBulkMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEscape,
  isEnabled = false,
  isBulkMode = false
}: KeyboardShortcutsConfig) {
  const lastKeyTime = useRef(0)
  const keySequence = useRef<string[]>([])

  const handleKeyDown = useCallback((_event: KeyboardEvent) => {
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

function showShortcutsHelp() {
  // You can implement a modal or toast showing keyboard shortcuts
  console.log('Keyboard shortcuts help triggered')
}
