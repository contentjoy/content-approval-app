import { NextRequest, NextResponse } from 'next/server'
import { getDrive } from '@/lib/googleDrive'
import { ensureGymUploadStructure, timestampLabel } from '@/lib/googleDrive'
import { SLOT_NAMES } from '@/lib/slots'
import type { SlotName } from '@/lib/slots'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const gymName = formData.get('gymName') as string
    const filesBySlot = JSON.parse(formData.get('filesBySlot') as string) as Record<SlotName, Array<{
      name: string
      type: string
      size: number
      data: string // base64 encoded file data
    }>>

    if (!gymName) {
      return NextResponse.json({ error: 'Missing gym name' }, { status: 400 })
    }

    // Get Google Drive instance
    const drive = getDrive()
    
    // Get root folder ID from environment
    const driveRootId = process.env.GOOGLE_DRIVE_ROOT_ID
    if (!driveRootId) {
      return NextResponse.json({ error: 'Google Drive not configured' }, { status: 500 })
    }

    // Create folder structure
    console.log('🏗️ Creating folder structure for upload...')
    const folderStructure = await ensureGymUploadStructure(drive, {
      driveRootId,
      gymName,
      uploadLabel: timestampLabel(),
      slotNames: SLOT_NAMES
    })

    console.log('✅ Folder structure created:', folderStructure)

    // Upload files to respective folders
    const uploadResults: Record<SlotName, string[]> = {
      'Photos': [],
      'Videos': [],
      'Facility Photos': [],
      'Facility Videos': []
    }
    const errors: string[] = []

    for (const [slotName, files] of Object.entries(filesBySlot)) {
      if (files.length === 0) continue
      
      const slotFolderId = folderStructure.slotFolders[slotName]
      if (!slotFolderId) {
        errors.push(`No folder ID found for slot: ${slotName}`)
        continue
      }

      // Upload each file in this slot
      for (const fileInfo of files) {
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(fileInfo.data, 'base64')
          
          // Create file metadata
          const fileMetadata = {
            name: fileInfo.name,
            parents: [slotFolderId],
            mimeType: fileInfo.type || 'application/octet-stream'
          }

          // Upload file
          const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
              mimeType: fileInfo.type || 'application/octet-stream',
              body: buffer
            },
            fields: 'id,name,webViewLink',
            supportsAllDrives: true,
          })

          if (response.data.id) {
            console.log(`✅ File uploaded successfully: ${fileInfo.name} (${response.data.id})`)
            uploadResults[slotName as SlotName].push(response.data.id)
          }
        } catch (error) {
          const errorMessage = `Failed to upload ${fileInfo.name} to ${slotName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMessage)
          errors.push(errorMessage)
        }
      }
    }

    // Check if we had any successful uploads
    const totalUploaded = Object.values(uploadResults).flat().length
    const success = totalUploaded > 0

    if (success) {
      console.log(`✅ Upload completed successfully. ${totalUploaded} files uploaded.`)
    } else {
      console.log('❌ No files were uploaded successfully.')
    }

    return NextResponse.json({
      success,
      uploadId: timestampLabel(),
      timestamp: timestampLabel(),
      uploadedFiles: uploadResults,
      totalFiles: totalUploaded,
      errors
    })

  } catch (error) {
    console.error('❌ Upload API failed:', error)
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
