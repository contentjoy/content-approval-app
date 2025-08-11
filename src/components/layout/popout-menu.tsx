"use client"

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Settings, Users, Command, Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { useAuth } from '@/contexts/auth-context'

interface PopoutMenuProps {
  isOpen: boolean
  onClose: () => void
  placement?: 'desktop' | 'mobile'
}

export function PopoutMenu({ isOpen, onClose, placement = 'desktop' }: PopoutMenuProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  const content = (
    <div className="flex flex-col gap-1 text-sm text-[var(--geist-foreground)]">
      <div className="text-[var(--geist-secondary)] mb-2">{user?.gymName || 'User'}</div>
      <Link href="/" className="no-underline flex items-center p-2 rounded-sm hover:bg-[var(--accents-2)] transition">
        <Home className="h-4 w-4 text-[var(--geist-secondary)] mr-2" />
        Dashboard
      </Link>
      <button onClick={onClose} className="flex items-center p-2 rounded-sm hover:bg-[var(--accents-2)] transition">
        <Settings className="h-4 w-4 text-[var(--geist-secondary)] mr-2" />
        Account Settings
      </button>
      <button className="flex items-center p-2 rounded-sm hover:bg-[var(--accents-2)] transition">
        <Users className="h-4 w-4 text-[var(--geist-secondary)] mr-2" />
        Create Team
      </button>
      <div className="border-t border-[var(--accents-2)] my-2" />
      <button onClick={toggleTheme} className="flex items-center p-2 rounded-sm hover:bg-[var(--accents-2)] transition">
        {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--geist-secondary)] mr-2" /> : <Moon className="h-4 w-4 text-[var(--geist-secondary)] mr-2" />}
        Theme
      </button>
      <Link href="/" className="no-underline flex items-center p-2 rounded-sm hover:bg-[var(--accents-2)] transition">
        <Home className="h-4 w-4 text-[var(--geist-secondary)] mr-2" />
        Home Page
      </Link>
      <button onClick={logout} className="flex items-center p-2 rounded-sm hover:bg-[var(--accents-2)] transition text-[var(--primary)] hover:text-red-600">
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
                ? 'absolute top-12 right-0 w-64 bg-[var(--accents-1)] border border-[var(--accents-2)] rounded-md p-4 z-50'
                : 'fixed top-[3rem] left-0 w-full h-[calc(100vh-3rem)] bg-[var(--accents-1)] border-t border-[var(--accents-2)] rounded-t-none p-4 z-50 overflow-y-auto'
            }
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


