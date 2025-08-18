import { NextRequest, NextResponse } from 'next/server'
import { getDrive, findFileInFolder } from '@/lib/googleDrive'
import { getSession, getSessionChunks, deleteSession } from '@/lib/chunk-storage'
import { getAdminClient } from '@/lib/supabaseServer'
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
    
    // Idempotency: check if a file with same name and size already exists in target folder
    try {
      const existing = await findFileInFolder(getDrive(), session.target_folder_id, session.original_file_name)
      const sizeMatches = existing?.size ? Number(existing.size) === reconstructedFile.length : false
      if (existing && sizeMatches) {
        console.log(`♻️ Skipping duplicate reconstructed upload (name+size match): ${session.original_file_name} (${existing.id})`)
        await deleteSession(sessionId)
        return NextResponse.json({
          success: true,
          message: 'Duplicate detected; using existing Drive file',
          fileId: existing.id,
          fileName: session.original_file_name,
          fileSize: reconstructedFile.length,
          deduped: true
        })
      }
    } catch (e) {
      console.warn('⚠️ Dedupe check failed for reconstructed file (continuing):', e)
    }

    // Upload to Google Drive
    console.log(`📤 Uploading reconstructed file to Google Drive...`)
    const drive = getDrive()
    
    // Raise threshold for fallback path to safely handle larger videos
    const uploadResult = await uploadFileToDrive(
      drive,
      fileToUpload,
      session.target_folder_id,
      2 * 1024 * 1024 * 1024 // 2GB limit for reconstructed files
    )
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload to Google Drive failed')
    }
    
    console.log(`✅ Successfully uploaded reconstructed file: ${session.original_file_name} (${uploadResult.fileId})`)
    
    // Clean up the session
    await deleteSession(sessionId)

    // Persist file metadata to DB (if uploads table exists with matching upload_id it will not, so we store minimal metadata)
    try {
      const supa = getAdminClient()
      await supa
        .from('files')
        .insert({
          upload_id: session.session_id, // use session id as a surrogate if no upload session was created
          slot_name: 'Videos',
          drive_file_id: uploadResult.fileId,
          name: session.original_file_name,
          size_bytes: reconstructedFile.length,
          mime: session.file_type
        })
    } catch (e) {
      console.warn('⚠️ Failed to persist reconstructed file metadata (non-blocking):', e)
    }
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
