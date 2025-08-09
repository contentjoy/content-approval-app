'use client'

import React, { useEffect, useCallback, useRef } from 'react'
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
  posts,
  selectedIndex,
  onNavigateUp,
  onNavigateDown,
  onApprove,
  onDisapprove,
  onToggleSelection,
  onBulkMode,
  onEscape,
  isEnabled = true,
  isBulkMode = false
}: KeyboardShortcutsConfig) {
  const lastKeyTime = useRef(0)
  const keySequence = useRef<string[]>([])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return
    }

    const currentTime = Date.now()
    const key = event.key.toLowerCase()

    // Reset sequence if too much time has passed
    if (currentTime - lastKeyTime.current > 1000) {
      keySequence.current = []
    }
    lastKeyTime.current = currentTime

    const currentPost = posts[selectedIndex]
    
    switch (key) {
      case 'j':
      case 'arrowdown':
        event.preventDefault()
        onNavigateDown()
        break
        
      case 'k':
      case 'arrowup':
        event.preventDefault()
        onNavigateUp()
        break
        
      case 'a':
        if (currentPost && !isBulkMode) {
          event.preventDefault()
          onApprove(currentPost)
        }
        break
        
      case 'r':
      case 'd':
        if (currentPost && !isBulkMode) {
          event.preventDefault()
          onDisapprove(currentPost)
        }
        break
        
      case ' ':
      case 'enter':
        if (currentPost && isBulkMode) {
          event.preventDefault()
          onToggleSelection(currentPost)
        }
        break
        
      case 'b':
        event.preventDefault()
        onBulkMode()
        break
        
      case 'escape':
        event.preventDefault()
        onEscape()
        break
        
      case '?':
        event.preventDefault()
        showShortcutsHelp()
        break
        
      // Number keys for quick navigation
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault()
        const index = parseInt(key) - 1
        if (index < posts.length) {
          // You can implement quick jump to specific post here
          console.log(`Quick jump to post ${index + 1}`)
        }
        break
        
      // Combo shortcuts
      case 'g':
        keySequence.current.push('g')
        if (keySequence.current.length === 2 && keySequence.current[0] === 'g') {
          // gg = go to top
          event.preventDefault()
          keySequence.current = []
          console.log('Go to top')
        }
        break
        
      default:
        // Reset sequence for non-combo keys
        if (!['g'].includes(key)) {
          keySequence.current = []
        }
        break
    }
  }, [
    posts,
    selectedIndex,
    onNavigateUp,
    onNavigateDown,
    onApprove,
    onDisapprove,
    onToggleSelection,
    onBulkMode,
    onEscape,
    isEnabled,
    isBulkMode
  ])

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isEnabled])

  // Return current shortcuts for display
  return {
    shortcuts: [
      { key: 'J / ↓', description: 'Navigate down' },
      { key: 'K / ↑', description: 'Navigate up' },
      { key: 'A', description: 'Approve current post' },
      { key: 'R / D', description: 'Disapprove current post' },
      { key: 'Space', description: 'Select/deselect (bulk mode)' },
      { key: 'B', description: 'Toggle bulk mode' },
      { key: 'Esc', description: 'Exit bulk mode / Clear selection' },
      { key: '?', description: 'Show this help' },
      { key: '1-9', description: 'Quick jump to post' },
      { key: 'GG', description: 'Go to top' },
    ]
  }
}

function showShortcutsHelp() {
  // You can implement a modal or toast showing keyboard shortcuts
  console.log('Keyboard shortcuts help triggered')
}
