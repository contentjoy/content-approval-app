'use client'

import { Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'
import { useModalStore } from '@/hooks/use-modal-store'

export function FabCreatePost({ hidden }: { hidden?: boolean }) {
  const { openModal } = useModalStore() as any
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          key="fab"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={() => openModal('create-post')}
          aria-label="Create Post"
          className="fixed z-40 rounded-full shadow-lg border border-border bg-foreground text-popover-foreground hover:bg-foreground/90 transition-colors bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 p-4 md:p-5"
        >
          <Pencil className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}


