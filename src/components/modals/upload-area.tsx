'use client'

import React from 'react'
import { Dashboard } from '@uppy/react'
import { FilePreview } from './file-preview'
import { SlotName, SLOT_CONFIG } from './slot-selector'
import { cn } from '@/lib/utils'

interface UploadAreaProps {
  activeSlot: SlotName
  activeUppy: any
  fileCounts: Record<SlotName, number>
  filePreviews: Record<SlotName, Array<{ file: File; preview: string }>>
  removeFile: (slotName: SlotName, file: File) => void
}

export function UploadArea({ activeSlot, activeUppy, fileCounts, filePreviews, removeFile }: UploadAreaProps) {
  return (
    <div className="lg:col-span-2 xl:col-span-3 2xl:col-span-4 space-y-6 sm:space-y-8">
      <div>
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 sm:mb-3">{activeSlot}</h3>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          Upload {activeSlot.toLowerCase()} for your content library
        </p>
      </div>
      
      {/* Upload Zone */}
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10 text-center hover:border-border transition-colors">
        {/* Custom CSS to override Uppy Dashboard styling */}
        <style jsx>{`
          .uppy-Dashboard-inner {
            background: transparent !important;
          }
          .uppy-Dashboard-AddFiles {
            background: transparent !important;
            border: none !important;
          }
          .uppy-Dashboard-AddFiles-title {
            color: hsl(var(--foreground)) !important;
            background: transparent !important;
          }
          .uppy-Dashboard-AddFiles-list {
            background: transparent !important;
          }
          .uppy-Dashboard-AddFiles-item {
            background: hsl(var(--muted)) !important;
            border: 1px solid hsl(var(--border)) !important;
            color: hsl(var(--foreground)) !important;
          }
          .uppy-Dashboard-AddFiles-itemName {
            color: hsl(var(--foreground)) !important;
          }
          .uppy-Dashboard-AddFiles-itemSize {
            color: hsl(var(--muted-foreground)) !important;
          }
          .uppy-Dashboard-AddFiles-itemRemove {
            color: hsl(var(--muted-foreground)) !important;
          }
          .uppy-Dashboard-AddFiles-itemRemove:hover {
            color: hsl(var(--foreground)) !important;
          }
        `}</style>
        
        <Dashboard
          uppy={activeUppy}
          plugins={['Webcam']}
          width="100%"
          height="300px"
          proudlyDisplayPoweredByUppy={false}
          showProgressDetails={false}
          showRemoveButtonAfterComplete={false}
          hideUploadButton={true}
          doneButtonHandler={() => {}}
          note="Drag and drop files here, or click to browse"
          theme="dark"
        />
      </div>

      {/* File Preview Grid */}
      {fileCounts[activeSlot] > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground">Selected Files</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filePreviews[activeSlot].map((filePreview, index) => (
              <FilePreview
                key={`${filePreview.file.name}-${index}`}
                file={filePreview.file}
                onRemove={() => removeFile(activeSlot, filePreview.file)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* File Info */}
      <div className="text-xs sm:text-sm text-muted-foreground text-center">
        Accepted file types: {SLOT_CONFIG[activeSlot]?.allowedTypes.join(', ')}. Maximum size: 25GB.
      </div>
    </div>
  )
}
