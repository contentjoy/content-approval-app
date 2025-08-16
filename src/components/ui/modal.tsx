'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-foreground/20 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`w-[calc(100%-12px)] h-auto max-h-[calc(100vh-80px)] mx-1.5 my-4 sm:w-full sm:h-auto sm:mx-0 sm:my-0 ${sizeClasses[size]} sm:max-h-[90vh] bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-[24px] overflow-hidden shadow-xl`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b border-border">
              <h2 id="modal-title" className="text-base sm:text-lg font-semibold text-text">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-muted-text hover:text-text hover:bg-bg-elev-1 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Content - scrollable on mobile with proper height management and no horizontal scroll */}
            <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto overflow-x-hidden h-auto sm:h-auto max-h-[calc(100vh-200px)] sm:max-h-[calc(90vh-4rem)] pb-6 sm:pb-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
