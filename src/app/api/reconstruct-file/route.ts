import { NextRequest, NextResponse } from 'next/server'
import { getDrive } from '@/lib/googleDrive'
import { getSession, getSessionChunks, deleteSession } from '@/lib/chunk-storage'
import { PassThrough } from 'stream'

// Upload file to Google Drive (copied from upload-to-drive route)
async function uploadFileToDrive(drive: any, file: any, folderId: string, maxUploadSize: number) {
  try {
    if (!folderId) {
      throw new Error('No folder ID provided for upload')
    }
    
    console.log(`📤 Uploading ${file.name} to Google Drive...`)
    console.log(`📁 Uploading to folder: ${folderId}`)
    
    // Convert base64 to buffer
    const buffer = Buffer.from(file.data, 'base64')
    console.log(`📊 File size: ${buffer.length} bytes`)
    
    // Get shared drive ID
    const sharedDriveId = '0ALOLvWQ1QTx5Uk9PVA'
    
    try {
      // Try multipart upload with fixed PassThrough stream
      const fileMetadata = {
        name: file.name,
        parents: [folderId],
      }
      const media = {
        mimeType: file.type,
        body: new PassThrough().end(buffer), // Key fix: Pipeable stream from buffer
      }
      
      console.log(`🔄 Attempting multipart upload with PassThrough stream...`)
      
      const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id,name,size,webViewLink',
        supportsAllDrives: true,
        driveId: sharedDriveId, // Explicit shared drive targeting
      } as any)
      
      if (!response.data || !response.data.id) {
        throw new Error('No file ID returned from multipart upload')
      }
      
      console.log(`✅ File uploaded successfully with multipart: ${response.data.name} (${response.data.id})`)
      
      return {
        success: true,
        fileId: response.data.id,
        size: response.data.size,
        webViewLink: response.data.webViewLink
      }
      
    } catch (uploadError) {
      console.error(`❌ Multipart upload failed:`, uploadError)
      
      // Fallback for small files: simple upload
      if (buffer.length < maxUploadSize) {
        console.log(`🔄 Trying simple upload fallback for small file...`)
        
        try {
          const fallbackResponse = await drive.files.create({
            resource: {
              name: file.name,
              parents: [folderId],
            },
            media: {
              mimeType: file.type,
              body: buffer, // Use buffer directly for simple upload
            },
            uploadType: 'media',
            fields: 'id,name,size,webViewLink',
            supportsAllDrives: true,
            driveId: sharedDriveId,
          } as any)
          
          if (!fallbackResponse.data || !fallbackResponse.data.id) {
            throw new Error('No file ID returned from fallback upload')
          }
          
          console.log(`✅ File uploaded successfully with fallback: ${fallbackResponse.data.name} (${fallbackResponse.data.id})`)
          
          return {
            success: true,
            fileId: fallbackResponse.data.id,
            size: fallbackResponse.data.size,
            webViewLink: fallbackResponse.data.webViewLink
          }
          
        } catch (fallbackError) {
          console.error(`❌ Fallback upload also failed:`, fallbackError)
          throw new Error(`Fallback upload failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      } else {
        throw new Error(`File too large for fallback upload: ${(buffer.length / (1024 * 1024)).toFixed(1)}MB`)
      }
    }
    
  } catch (error) {
    console.error(`❌ Upload failed:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    // Get session status
    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Verify all chunks are present
    if (!session.is_complete) {
      return NextResponse.json({ 
        error: `Incomplete: ${session.received_chunks}/${session.total_chunks} chunks received` 
      }, { status: 400 })
    }
    
    console.log(`🔧 Reconstructing ${session.original_file_name} from ${session.total_chunks} chunks...`)
    
    // Get all chunks for this session
    const chunks = await getSessionChunks(sessionId)
    
    // Reconstruct the file by concatenating all chunks
    const reconstructedFile = Buffer.concat(chunks)
    console.log(`✅ File reconstructed: ${session.original_file_name} (${(reconstructedFile.length / (1024 * 1024)).toFixed(1)}MB)`)
    
    // Create file object for upload
    const fileToUpload = {
      name: session.original_file_name,
      type: session.file_type,
      size: reconstructedFile.length,
      data: reconstructedFile.toString('base64')
    }
    
    // Upload to Google Drive
    console.log(`📤 Uploading reconstructed file to Google Drive...`)
    const drive = getDrive()
    
    const uploadResult = await uploadFileToDrive(
      drive,
      fileToUpload,
      session.target_folder_id,
      100 * 1024 * 1024 // 100MB limit for reconstructed files
    )
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload to Google Drive failed')
    }
    
    console.log(`✅ Successfully uploaded reconstructed file: ${session.original_file_name} (${uploadResult.fileId})`)
    
    // Clean up the session
    await deleteSession(sessionId)
    console.log(`🧹 Cleaned up session: ${sessionId}`)
    
    return NextResponse.json({
      success: true,
      message: 'File reconstructed and uploaded successfully',
      fileId: uploadResult.fileId,
      fileName: session.original_file_name,
      fileSize: reconstructedFile.length
    })
    
  } catch (error) {
    console.error('❌ File reconstruction error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'File reconstruction failed' 
    }, { status: 500 })
  }
}
