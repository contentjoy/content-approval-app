import { getDrive } from './googleDrive'
import { ensureGymUploadStructure, timestampLabel } from './googleDrive'
import { SLOT_NAMES } from './slots'
import type { SlotName } from './slots'

export interface UploadResult {
  success: boolean
  uploadId: string
  timestamp: string
  uploadedFiles: Record<SlotName, string[]>
  errors: string[]
}

export interface FileUpload {
  file: File
  slotName: SlotName
  progress?: number
}

/**
 * Handles the complete upload workflow for gym content
 * Creates folder structure and uploads files to Google Drive
 */
export async function handleGymContentUpload(
  gymName: string,
  filesBySlot: Record<SlotName, File[]>
): Promise<UploadResult> {
  const result: UploadResult = {
    success: false,
    uploadId: timestampLabel(),
    timestamp: timestampLabel(),
    uploadedFiles: {
      'Photos': [],
      'Videos': [],
      'Facility Photos': [],
      'Facility Videos': []
    },
    errors: []
  }

  try {
    // Get Google Drive instance
    const drive = getDrive()
    
    // Get root folder ID from environment
    const driveRootId = process.env.GOOGLE_DRIVE_ROOT_ID
    if (!driveRootId) {
      throw new Error('GOOGLE_DRIVE_ROOT_ID environment variable not set')
    }

    // Create folder structure
    console.log('🏗️ Creating folder structure for upload...')
    const folderStructure = await ensureGymUploadStructure(drive, {
      driveRootId,
      gymName,
      uploadLabel: result.timestamp,
      slotNames: SLOT_NAMES
    })

    console.log('✅ Folder structure created:', folderStructure)

    // Upload files to respective folders
    const uploadPromises: Promise<void>[] = []
    
    for (const [slotName, files] of Object.entries(filesBySlot)) {
      if (files.length === 0) continue
      
      const slotFolderId = folderStructure.slotFolders[slotName]
      if (!slotFolderId) {
        result.errors.push(`No folder ID found for slot: ${slotName}`)
        continue
      }

      // Upload each file in this slot
      for (const file of files) {
        const uploadPromise = uploadFileToDrive(drive, file, slotFolderId)
          .then(fileId => {
            if (fileId) {
              result.uploadedFiles[slotName as SlotName].push(fileId)
            }
          })
          .catch(error => {
            result.errors.push(`Failed to upload ${file.name} to ${slotName}: ${error.message}`)
          })
        
        uploadPromises.push(uploadPromise)
      }
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises)

    // Check if we had any successful uploads
    const totalUploaded = Object.values(result.uploadedFiles).flat().length
    result.success = totalUploaded > 0

    if (result.success) {
      console.log(`✅ Upload completed successfully. ${totalUploaded} files uploaded.`)
    } else {
      console.log('❌ No files were uploaded successfully.')
    }

  } catch (error) {
    console.error('❌ Upload workflow failed:', error)
    result.errors.push(`Upload workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Uploads a single file to Google Drive
 */
async function uploadFileToDrive(
  drive: any,
  file: File,
  parentFolderId: string
): Promise<string | null> {
  try {
    console.log(`📤 Uploading ${file.name} to folder ${parentFolderId}`)
    
    // Convert File to Buffer for Google Drive API
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create file metadata
    const fileMetadata = {
      name: file.name,
      parents: [parentFolderId],
      mimeType: file.type || 'application/octet-stream'
    }

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: buffer
      },
      fields: 'id,name,webViewLink',
      supportsAllDrives: true,
    })

    if (response.data.id) {
      console.log(`✅ File uploaded successfully: ${file.name} (${response.data.id})`)
      return response.data.id
    } else {
      throw new Error('No file ID returned from upload')
    }

  } catch (error) {
    console.error(`❌ Failed to upload ${file.name}:`, error)
    throw error
  }
}

/**
 * Validates files before upload
 */
export function validateFiles(filesBySlot: Record<SlotName, File[]>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const [slotName, files] of Object.entries(filesBySlot)) {
    if (files.length === 0) continue
    
    const config = getSlotConfig(slotName as SlotName)
    
    // Check file count limit
    if (files.length > config.maxFiles) {
      errors.push(`${slotName}: Maximum ${config.maxFiles} files allowed, got ${files.length}`)
    }
    
    // Check file types
    for (const file of files) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!config.allowedTypes.includes(extension)) {
        errors.push(`${slotName}: File type ${extension} not allowed for ${file.name}`)
      }
      
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`${slotName}: File ${file.name} exceeds 100MB limit`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get configuration for a specific slot
 */
function getSlotConfig(slotName: SlotName) {
  const configs = {
    'Photos': { maxFiles: 20, allowedTypes: ['.jpg', '.jpeg', '.png', '.heic'] },
    'Videos': { maxFiles: 20, allowedTypes: ['.mov', '.mp4'] },
    'Facility Photos': { maxFiles: 15, allowedTypes: ['.jpg', '.jpeg', '.png', '.heic'] },
    'Facility Videos': { maxFiles: 15, allowedTypes: ['.mov', '.mp4'] }
  }
  
  return configs[slotName]
}
