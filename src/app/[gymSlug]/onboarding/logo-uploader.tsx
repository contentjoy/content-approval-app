import React, { useState } from 'react'

interface LogoUploaderProps {
  currentUrl: string
  onFileSelected: (file: File, logoType: 'white' | 'black') => void
  logoType: 'white' | 'black'
  gymName: string
}

export function LogoUploader({ currentUrl, onFileSelected, logoType, gymName }: LogoUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFiles = (file: File) => {
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    setSelectedFile(file)
    onFileSelected(file, logoType)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFiles(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    onFileSelected(null as any, logoType)
  }

  return (
    <div>
      {(currentUrl || selectedFile) && (
        <div className="mb-3 flex items-center space-x-3">
          <img 
            src={selectedFile ? URL.createObjectURL(selectedFile) : currentUrl} 
            alt={`${logoType} logo`} 
            className="w-16 h-16 rounded-lg object-contain border border-border bg-background" 
          />
          <div className="flex-1">
            <span className="text-sm text-muted-foreground block">
              {selectedFile ? 'Selected' : 'Current'} {logoType} logo
            </span>
            {selectedFile && (
              <span className="text-xs text-muted-foreground block">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </span>
            )}
          </div>
          {selectedFile && (
            <button
              onClick={removeFile}
              className="text-destructive hover:text-destructive/90 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 ${dragOver ? 'border-primary' : 'border-dashed border-border'} rounded-lg p-4 text-center bg-card`}
      >
        <p className="text-sm text-foreground mb-2">Drag and drop a {logoType} logo here, or</p>
        <label className="inline-block">
          <span className="px-3 py-2 rounded-lg bg-primary text-primary-foreground cursor-pointer">Choose file</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFiles(file)
            }}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-2">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>
  )
}
