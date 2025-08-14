import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDrive, ensureFolder } from '@/lib/googleDrive';
import { PassThrough } from 'stream';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max


export async function POST(req: NextRequest) {
  // Read max upload size from ENV (default to 2MB if not set)
  const maxUploadSize = parseInt(process.env.MAX_UPLOAD_SIZE || '2048') * 1024 // Convert KB to bytes
  const maxSize = Math.min(maxUploadSize, 100 * 1024 * 1024) // Cap at 100MB for safety
  
  console.log(`📏 Max upload size: ${maxUploadSize / 1024}KB (${maxSize / (1024 * 1024)}MB)`)
  
  try {
    const body = await req.json()
    const { files, gymSlug, gymName, sessionFolderId } = body
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    
    // Check for folder creation requests
    const hasFolders = files.some((file: any) => file.isFolder)
    if (hasFolders) {
      console.log('📁 Processing folder creation...')
      return await handleFolderCreation(files, gymSlug, gymName)
    }
    
    // Check total payload size (skip for folder creation)
    const totalSize = files.reduce((sum: number, file: any) => sum + (file.size || 0), 0)
    if (totalSize > maxSize) {
      return NextResponse.json({ 
        error: `Total file size ${(totalSize / (1024 * 1024)).toFixed(1)}MB exceeds limit of ${maxSize / (1024 * 1024)}MB` 
      }, { status: 413 })
    }
    
    // Check for chunked uploads
    const hasChunks = files.some((file: any) => file.isChunk)
    if (hasChunks) {
      console.log('📦 Processing chunked upload...')
      return await handleChunkedUpload(files, gymSlug, gymName, maxUploadSize, sessionFolderId)
    }
    
    // Regular upload flow
    return await handleRegularUpload(files, gymSlug, gymName, sessionFolderId, maxUploadSize)
    
  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 })
  }
}

function determineSlotName(file: any): string {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (isImage) {
    return 'Photos';
  } else if (isVideo) {
    return 'Videos';
  } else {
    // Default to Photos for unknown types
    return 'Photos';
  }
}

async function createFolderStructure(gymName: string) {
  try {
    console.log('🏗️ Creating folder structure for:', gymName);
    
    // Get the shared drive ID and clients folder ID from environment
    const sharedDriveId = '0ALOLvWQ1QTx5Uk9PVA'; // New shared drive ID
    const clientsFolderId = '1TCc0xlIA6raD3xBfWOXPMU0PWyTMNnGD'; // "Clients" folder inside shared drive
    
    if (!sharedDriveId) {
      throw new Error('GOOGLE_SHARED_DRIVE_ID not configured');
    }
    
    console.log(`🏢 Using shared drive: ${sharedDriveId}`);
    console.log(`📁 Using clients folder: ${clientsFolderId}`);
    
    // Initialize Google Drive client
    const drive = getDrive();
    
    // Create timestamp for this upload
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const uploadLabel = `${gymName} ${timestamp}`;
    
    // Step 1: Create or find gym folder inside the "Clients" folder
    const gymFolderId = await ensureFolder(drive, gymName, clientsFolderId);
    console.log('🏋️ Gym folder:', gymFolderId);
    
    // Step 2: Create timestamp folder
    const timestampFolderId = await ensureFolder(drive, uploadLabel, gymFolderId);
    console.log('📅 Timestamp folder:', timestampFolderId);
    
    // Step 3: Create Raw footage and Final footage folders
    const rawFootageFolderId = await ensureFolder(drive, 'Raw footage', timestampFolderId);
    const finalFootageFolderId = await ensureFolder(drive, 'Final footage', timestampFolderId);
    console.log('🎬 Raw footage folder:', rawFootageFolderId);
    console.log('✨ Final footage folder:', finalFootageFolderId);
    
    // Step 4: Create slot folders in both Raw and Final footage
    const slotNames = ['Photos', 'Videos', 'Facility Photos', 'Facility Videos'];
    const rawSlotFolders: Record<string, string> = {};
    const finalSlotFolders: Record<string, string> = {};
    
    for (const slot of slotNames) {
      rawSlotFolders[slot] = await ensureFolder(drive, slot, rawFootageFolderId);
      finalSlotFolders[slot] = await ensureFolder(drive, slot, finalFootageFolderId);
      console.log(`📁 ${slot} folders created`);
    }
    
    return {
      gymFolderId,
      timestampFolderId,
      rawFootageFolderId,
      finalFootageFolderId,
      rawSlotFolders,
      finalSlotFolders
    };
    
  } catch (error) {
    console.error('❌ Failed to create folder structure:', error);
    throw error;
  }
}

// Handle chunked uploads
async function handleChunkedUpload(files: any[], gymSlug: string, gymName: string, maxUploadSize: number, sessionFolderId: string) {
  console.log('📦 Processing chunked upload...')
  
  // Group chunks by original file
  const chunkGroups = new Map<string, any[]>()
  files.forEach(file => {
    if (file.isChunk && file.originalName) {
      if (!chunkGroups.has(file.originalName)) {
        chunkGroups.set(file.originalName, [])
      }
      chunkGroups.get(file.originalName)!.push(file)
    }
  })
  
  // Sort chunks by index
  chunkGroups.forEach(chunks => {
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
  })
  
  // Reconstruct and upload each file
  const results = []
  for (const [originalName, chunks] of chunkGroups) {
    try {
      console.log(`🔧 Reconstructing ${originalName} from ${chunks.length} chunks...`)
      
      // Combine chunks
      const combinedBuffer = Buffer.concat(
        chunks.map(chunk => Buffer.from(chunk.data, 'base64'))
      )
      
      // Upload reconstructed file
      const reconstructedFile = {
        name: originalName,
        type: chunks[0].type,
        size: combinedBuffer.length,
        data: combinedBuffer.toString('base64')
      }
      
      const uploadResult = await uploadFileToDrive(
        getDrive(),
        reconstructedFile,
        sessionFolderId, // Pass sessionFolderId here
        maxUploadSize
      )
      
      results.push({
        name: originalName,
        success: true,
        fileId: uploadResult.fileId || 'chunked-reconstructed'
      })
      
    } catch (error) {
      console.error(`❌ Failed to reconstruct ${originalName}:`, error)
      results.push({
        name: originalName,
        success: false,
        error: error instanceof Error ? error.message : 'Reconstruction failed'
      })
    }
  }
  
  return NextResponse.json({
    success: true,
    message: `Processed ${results.filter(r => r.success).length}/${results.length} chunked files`,
    results
  })
}

// Handle regular uploads
async function handleRegularUpload(files: any[], gymSlug: string, gymName: string, sessionFolderId: string, maxUploadSize: number) {
  console.log('🚀 Starting regular Google Drive upload for gym:', gymName)
  console.log('📁 Files to upload:', files.length)
  
  if (!gymSlug || !gymName) {
    return NextResponse.json({ error: 'Missing gym information' }, { status: 400 })
  }
  
  // Get gym ID from database
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('id')
    .eq('"Gym Name"', gymName)
    .single()
  
  if (gymError || !gym) {
    console.error('❌ Gym lookup failed:', gymError)
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  }
  
  console.log('✅ Found gym:', gymName, 'ID:', gym.id)
  
  // Initialize Google Drive client
  const drive = getDrive()
  console.log('✅ Google Drive client initialized')
  
  // Create folder structure
  const folderStructure = await createFolderStructure(gymName)
  console.log('✅ Folder structure created:', folderStructure)
  
  // Upload files
  const uploadResults = []
  for (const file of files) {
    try {
      const slotName = determineSlotName(file)
      const targetFolderId = folderStructure.rawSlotFolders[slotName]
      
      if (!targetFolderId) {
        throw new Error(`No target folder found for slot: ${slotName}`)
      }
      
      console.log(`📤 Uploading ${file.name} to Google Drive...`)
      
      const uploadResult = await uploadFileToDrive(drive, file, sessionFolderId, maxUploadSize)
      uploadResults.push({
        name: file.name,
        success: true,
        fileId: uploadResult.fileId,
        slot: slotName
      })
      
    } catch (error) {
      console.error(`❌ Failed to process ${file.name}:`, error)
      uploadResults.push({
        name: file.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Store upload record
  const { error: dbError } = await supabase
    .from('uploads')
    .insert([{
      upload_id: `upload_${Date.now()}`,
      gym_id: gym.id,
      gym_name: gymName,
      upload_folder_id: sessionFolderId, // Use sessionFolderId here
      gym_folder_id: folderStructure.gymFolderId,
      raw_footage_folder_id: folderStructure.rawFootageFolderId,
      final_footage_folder_id: folderStructure.finalFootageFolderId,
      status: 'completed',
      files_uploaded: uploadResults.filter(r => r.success).length,
      total_files: files.length
    }])
  
  if (dbError) {
    console.error('⚠️ Failed to store upload record:', dbError)
  }
  
  const successCount = uploadResults.filter(r => r.success).length
  console.log(`🎉 Upload completed: ${successCount}/${files.length} files successful`)
  
  return NextResponse.json({
    success: true,
    message: `Uploaded ${successCount}/${files.length} files successfully`,
    folderStructure,
    results: uploadResults
  })
}

// Handle folder creation requests
async function handleFolderCreation(files: any[], gymSlug: string, gymName: string) {
  console.log('📁 Processing folder creation...')
  console.log('📁 Gym slug:', gymSlug)
  console.log('📁 Gym name:', gymName)
  const results = []

  for (const file of files) {
    if (file.isFolder) {
      try {
        const folderName = file.name
        console.log(`📁 Creating folder: ${folderName}`)
        console.log(`📁 Folder type: ${file.folderType}`)
        
        // Create proper gym folder structure first
        console.log('🏗️ Creating gym folder structure...')
        const folderStructure = await createFolderStructure(gymName)
        console.log('✅ Gym folder structure created:', folderStructure)
        
        // For session root folders, use the timestamp folder as the parent
        let parentFolderId = folderStructure.timestampFolderId
        console.log(`📁 Using parent folder ID: ${parentFolderId}`)
        
        // If it's a specific folder type, use the appropriate parent
        if (file.folderType === 'session-root') {
          parentFolderId = folderStructure.timestampFolderId
          console.log(`📁 Session root folder - using timestamp folder as parent: ${parentFolderId}`)
        }
        
        // Create the session folder inside the timestamp folder
        console.log(`📁 Creating session folder '${folderName}' inside parent folder ${parentFolderId}`)
        const sessionFolderId = await ensureFolder(
          getDrive(), 
          folderName, 
          parentFolderId
        )
        
        results.push({
          name: folderName,
          success: true,
          fileId: sessionFolderId, // Use fileId for consistency with other responses
          folderStructure: folderStructure // Include the complete folder structure for reuse
        })
        console.log(`✅ Session folder created: ${folderName} (${sessionFolderId})`)
      } catch (error) {
        console.error(`❌ Failed to create folder ${file.name}:`, error)
        results.push({
          name: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Folder creation failed'
        })
      }
    } else {
      results.push({
        name: file.name,
        success: false,
        error: 'File is not a folder'
      })
    }
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${results.filter(r => r.success).length}/${results.length} folder creations`,
    results,
    folderStructure: results[0]?.folderStructure || null // Include folder structure for reuse
  })
}

// Upload file to Google Drive
async function uploadFileToDrive(drive: any, file: any, folderId: string, maxUploadSize: number) {
  try {
    const slotName = determineSlotName(file)
    
    if (!folderId) {
      throw new Error('No folder ID provided for upload')
    }
    
    console.log(`📤 Uploading ${file.name} to Google Drive...`)
    console.log(`📁 Uploading to folder: ${slotName} (${folderId})`)
    
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
        webViewLink: response.data.webViewLink,
        slot: slotName
      }
      
    } catch (uploadError) {
      console.error(`❌ Multipart upload failed:`, uploadError)
      
      // Fallback for small files: simple upload
      if (buffer.length < maxUploadSize) { // Use maxUploadSize for fallback
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
            webViewLink: fallbackResponse.data.webViewLink,
            slot: slotName
          }
          
        } catch (fallbackError) {
          console.error(`❌ Fallback upload also failed:`, fallbackError)
          throw new Error(`Fallback upload failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      } else {
        // File too large for simple upload fallback
        throw new Error(`File too large (${Math.round(buffer.length / (1024 * 1024))}MB) for fallback upload`)
      }
    }
    
  } catch (error) {
    console.error(`❌ Failed to upload ${file.name}:`, error)
    throw error
  }
}