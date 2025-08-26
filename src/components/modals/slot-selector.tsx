'use client'

import React from 'react'
import { Image, Video, Building2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SLOT_NAMES = ['Photos', 'Videos', 'Facility Photos', 'Facility Videos'] as const
export type SlotName = typeof SLOT_NAMES[number]

export const SLOT_CONFIG = {
  'Photos': { icon: Image, maxFiles: 50, allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  'Videos': { icon: Video, maxFiles: 30, allowedTypes: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
  'Facility Photos': { icon: Building2, maxFiles: 40, allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  'Facility Videos': { icon: Camera, maxFiles: 20, allowedTypes: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] }
}

interface SlotSelectorProps {
  activeSlot: SlotName
  setActiveSlot: (slot: SlotName) => void
  fileCounts: Record<SlotName, number>
  totalFiles: number
}

export function SlotSelector({ activeSlot, setActiveSlot, fileCounts, totalFiles }: SlotSelectorProps) {
  return (
    <div className="lg:col-span-1 xl:col-span-1 2xl:col-span-2 space-y-4 sm:space-y-6">
      <div>
        <h3 className="font-semibold text-foreground text-lg sm:text-xl">Content Types</h3>
        {totalFiles > 0 && (
          <div className="text-sm text-muted-foreground mt-1">
            {totalFiles} total files selected
          </div>
        )}
      </div>
      <div className="space-y-3 sm:space-y-4">
        {SLOT_NAMES.map((slotName) => {
          const config = SLOT_CONFIG[slotName]
          const Icon = config.icon
          const isActive = activeSlot === slotName
          const fileCount = fileCounts[slotName] || 0
          
          return (
            <button
              key={slotName}
              onClick={() => setActiveSlot(slotName as SlotName)}
              className={cn(
                "w-full p-3 sm:p-4 lg:p-5 rounded-xl border-2 transition-all duration-300 text-left hover:scale-[1.02]",
                isActive 
                  ? "border-border bg-muted shadow-xl" 
                  : "border-border hover:border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Icon className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold text-base sm:text-lg",
                    isActive ? "text-foreground" : "text-foreground/80"
                  )}>
                    {slotName}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                    {fileCount} files selected
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {config.allowedTypes.join(', ')}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
