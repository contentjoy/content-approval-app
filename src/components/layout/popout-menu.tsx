"use client"

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Settings, Users, Command, Moon, Sun, LogOut, Calendar as CalendarIcon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { useAuth } from '@/contexts/auth-context'
import { useModalStore } from '@/hooks/use-modal-store'

interface PopoutMenuProps {
  isOpen: boolean
  onClose: () => void
  placement?: 'desktop' | 'mobile'
  onAccountSettings?: () => void
  approvedProgress?: number
  goal?: number
}

export function PopoutMenu({ isOpen, onClose, placement = 'desktop', onAccountSettings, approvedProgress = 0, goal = 30 }: PopoutMenuProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { openModal, approvedPosts } = useModalStore() as any
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  const progressPct = Math.min(goal > 0 ? (approvedProgress / goal) * 100 : 0, 100)

  const content = (
    <div className="flex flex-col gap-1 text-sm text-foreground">
      {placement === 'mobile' && (
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-2 bg-[var(--surface)] rounded-md overflow-hidden border border-[var(--border)]">
              <div className="h-full bg-[var(--text)] rounded-md" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-muted-text min-w-[2.5rem]">{approvedProgress}/{goal}</span>
          </div>
        </div>
      )}
      <div className="text-[var(--muted-text)] mb-2">{user?.gymName || 'User'}</div>
      <button onClick={() => { onClose(); onAccountSettings?.() }} className="flex items-center p-2 rounded-[12px] hover:bg-[var(--modal-surface)] transition">
        <Settings className="h-4 w-4 text-[var(--muted-text)] mr-2" />
        Account Settings
      </button>
      <button className="flex items-center p-2 rounded-[12px] hover:bg-[var(--modal-surface)] transition">
        <Users className="h-4 w-4 text-[var(--muted-text)] mr-2" />
        Create Team
      </button>
      <div className="border-t border-[var(--modal-border)] my-2" />
      <button onClick={toggleTheme} className="flex items-center p-2 rounded-[12px] hover:bg-[var(--modal-surface)] transition">
        {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--muted-text)] mr-2" /> : <Moon className="h-4 w-4 text-[var(--muted-text)] mr-2" />}
        {theme === 'dark' ? 'Dark mode' : 'Light mode'}
      </button>
      <button id="schedule-content" className="flex items-center p-2 rounded-[12px] hover:bg-[var(--modal-surface)] transition" onClick={() => { onClose(); openModal('schedule', null, [], approvedPosts || []) }}>
        <CalendarIcon className="h-4 w-4 text-[var(--muted-text)] mr-2" />
        Schedule Content
      </button>
      <button onClick={logout} className="flex items-center p-2 rounded-[12px] hover:bg-[var(--modal-surface)] transition">
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </button>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {placement === 'mobile' && (
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
          )}
          <motion.div
            ref={panelRef}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={
              placement === 'desktop'
                ? 'absolute top-12 right-0 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-md p-4 z-[60]'
                : 'fixed top-[3.25rem] inset-x-0 w-full h-[calc(100vh-3.25rem)] bg-[var(--surface)] rounded-t-none p-4 z-[60] overflow-y-auto'
            }
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


