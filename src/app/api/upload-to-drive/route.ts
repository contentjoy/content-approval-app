import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDrive, ensureFolder } from '@/lib/googleDrive';
import { PassThrough } from 'stream';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max


export async function POST(request: NextRequest) {
  // Read max upload size from ENV (default to 2MB if not set)
  const maxUploadSize = parseInt(process.env.MAX_UPLOAD_SIZE || '2048') * 1024 // Convert KB to bytes
  const maxSize = Math.min(maxUploadSize, 100 * 1024 * 1024) // Cap at 100MB for safety
  
  console.log(`📏 Max upload size: ${maxUploadSize / 1024}KB (${maxSize / (1024 * 1024)}MB)`)
  
  try {
    const contentType = request.headers.get('content-type')
    
    // Handle FormData for chunked uploads
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const gymSlug = formData.get('gymSlug') as string
      const gymName = formData.get('gymName') as string
      const sessionFolderId = formData.get('sessionFolderId') as string
      const isChunkedUpload = formData.get('isChunkedUpload') as string
      const originalFileName = formData.get('originalFileName') as string
      const totalChunks = parseInt(formData.get('totalChunks') as string)
      
      if (isChunkedUpload === 'true') {
        console.log('📦 Processing chunked upload via FormData...')
        console.log(`📁 Original file: ${originalFileName}, Total chunks: ${totalChunks}`)
        
        // Extract chunks from FormData
        const chunks: Buffer[] = []
        for (let i = 0; i < totalChunks; i++) {
          const chunk = formData.get(`chunk_${i}`) as File
          if (chunk) {
            const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
            chunks.push(chunkBuffer)
            console.log(`📦 Received chunk ${i + 1}/${totalChunks}: ${(chunkBuffer.length / (1024 * 1024)).toFixed(1)}MB`)
          }
        }
        
        if (chunks.length !== totalChunks) {
          throw new Error(`Missing chunks: expected ${totalChunks}, got ${chunks.length}`)
        }
        
        // Reconstruct the original file
        const reconstructedFile = Buffer.concat(chunks)
        console.log(`✅ File reconstructed: ${originalFileName} (${(reconstructedFile.length / (1024 * 1024)).toFixed(1)}MB)`)
        
        // Create a file object for the reconstructed file
        const reconstructedFileObj = {
          name: originalFileName,
          type: 'video/mp4', // Default to video, could be made dynamic
          size: reconstructedFile.length,
          data: reconstructedFile.toString('base64')
        }
        
        // Use the regular upload handler for the reconstructed file
        return await handleRegularUpload([reconstructedFileObj], gymSlug, gymName, sessionFolderId, maxSize)
      }
    }
    
    // Handle JSON for regular uploads
    const body = await request.json()
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
    
    // Regular upload flow (chunked uploads handled via FormData above)
    return await handleRegularUpload(files, gymSlug, gymName, sessionFolderId, maxSize)
    
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
    
    // 🚨 CRITICAL FIX: Create ONE folder per day and REUSE if exists
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const uploadLabel = `${gymName} ${dateString}`;
    
    console.log(`📅 Looking for existing timestamp folder: "${uploadLabel}"`)
    
    // Step 1: Create or find gym folder inside the "Clients" folder
    const gymFolderId = await ensureFolder(drive, gymName, clientsFolderId);
    console.log('🏋️ Gym folder:', gymFolderId);
    
    // Step 2: Create or find today's folder (REUSE if exists to prevent duplicates)
    const timestampFolderId = await ensureFolder(drive, uploadLabel, gymFolderId);
    console.log('📅 Today\'s folder (reused if exists):', timestampFolderId);
    
    // Step 3: Create Raw footage and Final footage folders (reuse if exist)
    const rawFootageFolderId = await ensureFolder(drive, 'Raw footage', timestampFolderId);
    const finalFootageFolderId = await ensureFolder(drive, 'Final footage', timestampFolderId);
    console.log('🎬 Raw footage folder:', rawFootageFolderId);
    console.log('✨ Final footage folder:', finalFootageFolderId);
    
    // Step 4: Create slot folders in both Raw and Final footage (reuse if exist)
    const slotNames = ['Photos', 'Videos', 'Facility Photos', 'Facility Videos'];
    const rawSlotFolders: Record<string, string> = {};
    const finalSlotFolders: Record<string, string> = {};
    
    for (const slot of slotNames) {
      rawSlotFolders[slot] = await ensureFolder(drive, slot, rawFootageFolderId);
      finalSlotFolders[slot] = await ensureFolder(drive, slot, finalFootageFolderId);
      console.log(`📁 ${slot} folders created/reused`);
    }
    
    console.log(`✅ Folder structure complete - will reuse existing folders to prevent duplicates`)
    
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

// 🚀 WEBHOOK: Send upload metadata to webhook
async function sendUploadWebhook(data: {
  gymName: string
  folderStructure: any
  files: any[]
  webhookType: 'test' | 'production'
}) {
  try {
    const { gymName, folderStructure, files, webhookType } = data
    
    // Count files by category
    const fileCounts = {
      photos: 0,
      videos: 0,
      facilityPhotos: 0,
      facilityVideos: 0
    }
    
    files.forEach(file => {
      const slotName = determineSlotName(file)
      switch (slotName) {
        case 'Photos':
          fileCounts.photos++
          break
        case 'Videos':
          fileCounts.videos++
          break
        case 'Facility Photos':
          fileCounts.facilityPhotos++
          break
        case 'Facility Videos':
          fileCounts.facilityVideos++
          break
      }
    })
    
    // Get webhook URL based on type
    const webhookUrl = webhookType === 'test' 
      ? 'https://contentjoy.app.n8n.cloud/webhook-test/8eac6834-205e-440e-9ae0-c11b8b6d402b' // Hardcoded for reliability
      : process.env.UPLOAD_CONTENT_WEBHOOK || 'https://contentjoy.app.n8n.cloud/webhook/8eac6834-205e-440e-9ae0-c11b8b6d402b'
    
    if (!webhookUrl) {
      throw new Error(`Webhook URL not configured for type: ${webhookType}`)
    }
    
    // Prepare webhook payload
    const webhookPayload = {
      timestamp: new Date().toISOString(),
      event: 'upload_started',
      gymName: gymName,
      totalFiles: files.length,
      fileCounts: {
        photos: fileCounts.photos,
        videos: fileCounts.videos,
        facilityPhotos: fileCounts.facilityPhotos,
        facilityVideos: fileCounts.facilityVideos
      },
      folderStructure: {
        gymFolderId: folderStructure.gymFolderId,
        timestampFolderId: folderStructure.timestampFolderId,
        rawFootageFolderId: folderStructure.rawFootageFolderId,
        finalFootageFolderId: folderStructure.finalFootageFolderId,
        rawSlotFolders: folderStructure.rawSlotFolders,
        finalSlotFolders: folderStructure.finalSlotFolders
      },
      // Note: Direct Drive links require additional API calls, 
      // but you can construct them in N8N using the folder IDs
      driveLinks: {
        note: 'Use folder IDs to construct Drive links in N8N',
        gymFolderId: folderStructure.gymFolderId,
        rawFootageFolderId: folderStructure.rawFootageFolderId
      }
    }
    
    console.log('📡 Sending webhook to:', webhookUrl)
    console.log('📡 Webhook payload:', JSON.stringify(webhookPayload, null, 2))
    
    // Send webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })
    
    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`)
    }
    
    console.log('✅ Webhook sent successfully')
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    throw error
  }
}

// Handle regular uploads
async function handleRegularUpload(files: any[], gymSlug: string, gymName: string, sessionFolderId: string, maxUploadSize: number) {
  console.log('🚀 Starting regular Google Drive upload for gym:', gymName)
  console.log('📁 Files to upload:', files.length)
  
  if (!gymSlug || !gymName) {
    return NextResponse.json({ error: 'Missing gym information' }, { status: 400 })
  }
  
  // 🚨 CRITICAL FIX: Normalize gym name to prevent duplicate client folders
  // This ensures consistency with logo uploads: "my-fitness-guide" -> "my fitness guide"
  const normalizedGymName = gymSlug.replace(/-/g, ' ')
  console.log('🔧 Gym name normalization:', { 
    original: gymName, 
    normalized: normalizedGymName,
    willUse: normalizedGymName 
  })
  
  // 🚨 ROBUST GYM LOOKUP: Try multiple strategies to find the gym
  let gym = null
  let gymError = null
  
  // Strategy 1: Try normalized name first (most common case)
  console.log('🔍 Strategy 1: Looking up gym by normalized name:', normalizedGymName)
  let result = await supabase
    .from('gyms')
    .select('id, "Gym Name"')
    .eq('"Gym Name"', normalizedGymName)
    .single()
  
  if (result.data && !result.error) {
    gym = result.data
    console.log('✅ Found gym by normalized name:', normalizedGymName, 'ID:', gym.id)
  } else {
    console.log('⚠️ Strategy 1 failed, trying Strategy 2...')
    
    // Strategy 2: Try original gymName (fallback)
    console.log('🔍 Strategy 2: Looking up gym by original name:', gymName)
    result = await supabase
      .from('gyms')
      .select('id, "Gym Name"')
      .eq('"Gym Name"', gymName)
      .single()
    
    if (result.data && !result.error) {
      gym = result.data
      console.log('✅ Found gym by original name:', gymName, 'ID:', gym.id)
    } else {
      console.log('⚠️ Strategy 2 failed, trying Strategy 3...')
      
      // Strategy 3: Try case-insensitive search with ILIKE
      console.log('🔍 Strategy 3: Case-insensitive search for:', normalizedGymName)
      result = await supabase
        .from('gyms')
        .select('id, "Gym Name"')
        .ilike('"Gym Name"', `%${normalizedGymName}%`)
        .limit(1)
        .single()
      
      if (result.data && !result.error) {
        gym = result.data
        console.log('✅ Found gym by case-insensitive search:', gym['Gym Name'], 'ID:', gym.id)
      } else {
        console.log('⚠️ Strategy 3 failed, trying Strategy 4...')
        
        // Strategy 4: Try searching by slug (gymSlug)
        console.log('🔍 Strategy 4: Searching by slug:', gymSlug)
        result = await supabase
          .from('gyms')
          .select('id, "Gym Name"')
          .ilike('"Gym Name"', `%${gymSlug}%`)
          .limit(1)
          .single()
        
        if (result.data && !result.error) {
          gym = result.data
          console.log('✅ Found gym by slug search:', gym['Gym Name'], 'ID:', gym.id)
        } else {
          // All strategies failed
          gymError = result.error || new Error('Gym not found with any lookup strategy')
          console.error('❌ All gym lookup strategies failed:', {
            normalizedName: normalizedGymName,
            originalName: gymName,
            slug: gymSlug,
            lastError: result.error
          })
        }
      }
    }
  }
  
  if (gymError || !gym) {
    console.error('❌ Gym lookup failed after all strategies:', gymError)
    return NextResponse.json({ 
      error: 'Gym not found. Tried multiple lookup strategies but no match found.',
      details: {
        normalizedName: normalizedGymName,
        originalName: gymName,
        slug: gymSlug
      }
    }, { status: 404 })
  }
  
  console.log('✅ Found gym:', gym['Gym Name'], 'ID:', gym.id)
  
  // 🚨 CRITICAL FIX: Always use NORMALIZED gym name for folder creation
  // This ensures consistent folder naming: "kokoro-demo" -> "kokoro demo"
  const folderGymName = normalizedGymName
  console.log('🔧 Using normalized gym name for folders:', folderGymName)
  
  // Initialize Google Drive client
  const drive = getDrive()
  console.log('✅ Google Drive client initialized')
  
  // Create folder structure using NORMALIZED gym name (not database name)
  const folderStructure = await createFolderStructure(folderGymName)
  console.log('✅ Folder structure created:', folderStructure)
  
  // 🚀 WEBHOOK: Send upload metadata to test webhook after folders are created
  try {
    await sendUploadWebhook({
      gymName: folderGymName, // Use normalized name for webhook
      folderStructure,
      files,
      webhookType: 'test'
    })
    console.log('✅ Upload webhook sent successfully')
  } catch (webhookError) {
    console.error('⚠️ Webhook failed (non-blocking):', webhookError)
    // Don't fail the upload if webhook fails
  }
  
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
      
      const uploadResult = await uploadFileToDrive(drive, file, targetFolderId, maxUploadSize)
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
      gym_name: folderGymName, // Use normalized gym name for consistency
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
  
  // 🚨 CRITICAL FIX: Normalize gym name to prevent duplicate client folders
  const normalizedGymName = gymSlug.replace(/-/g, ' ')
  console.log('🔧 Gym name normalization for folder creation:', { 
    original: gymName, 
    normalized: normalizedGymName,
    willUse: normalizedGymName 
  })
  
  // 🚨 ROBUST GYM LOOKUP: Try multiple strategies to find the gym
  let gym = null
  let gymError = null
  
  // Strategy 1: Try normalized name first (most common case)
  console.log('🔍 Strategy 1: Looking up gym by normalized name:', normalizedGymName)
  let result = await supabase
    .from('gyms')
    .select('id, "Gym Name"')
    .eq('"Gym Name"', normalizedGymName)
    .single()
  
  if (result.data && !result.error) {
    gym = result.data
    console.log('✅ Found gym by normalized name:', normalizedGymName, 'ID:', gym.id)
  } else {
    console.log('⚠️ Strategy 1 failed, trying Strategy 2...')
    
    // Strategy 2: Try original gymName (fallback)
    console.log('🔍 Strategy 2: Looking up gym by original name:', gymName)
    result = await supabase
      .from('gyms')
      .select('id, "Gym Name"')
      .eq('"Gym Name"', gymName)
      .single()
    
    if (result.data && !result.error) {
      gym = result.data
      console.log('✅ Found gym by original name:', gymName, 'ID:', gym.id)
    } else {
      console.log('⚠️ Strategy 2 failed, trying Strategy 3...')
      
      // Strategy 3: Try case-insensitive search with ILIKE
      console.log('🔍 Strategy 3: Case-insensitive search for:', normalizedGymName)
      result = await supabase
        .from('gyms')
        .select('id, "Gym Name"')
        .ilike('"Gym Name"', `%${normalizedGymName}%`)
        .limit(1)
        .single()
      
      if (result.data && !result.error) {
        gym = result.data
        console.log('✅ Found gym by case-insensitive search:', gym['Gym Name'], 'ID:', gym.id)
      } else {
        console.log('⚠️ Strategy 2 failed, trying Strategy 4...')
        
        // Strategy 4: Try searching by slug (gymSlug)
        console.log('🔍 Strategy 4: Searching by slug:', gymSlug)
        result = await supabase
          .from('gyms')
          .select('id, "Gym Name"')
          .ilike('"Gym Name"', `%${gymSlug}%`)
          .limit(1)
          .single()
        
        if (result.data && !result.error) {
          gym = result.data
          console.log('✅ Found gym by slug search:', gym['Gym Name'], 'ID:', gym.id)
        } else {
          // All strategies failed
          gymError = result.error || new Error('Gym not found with any lookup strategy')
          console.error('❌ All gym lookup strategies failed:', {
            normalizedName: normalizedGymName,
            originalName: gymName,
            slug: gymSlug,
            lastError: result.error
          })
        }
      }
    }
  }
  
  if (gymError || !gym) {
    console.error('❌ Gym lookup failed after all strategies:', gymError)
    return NextResponse.json({ 
      error: 'Gym not found. Tried multiple lookup strategies but no match found.',
      details: {
        normalizedName: normalizedGymName,
        originalName: gymName,
        slug: gymSlug
      }
    }, { status: 404 })
  }
  
  console.log('✅ Found gym:', gym['Gym Name'], 'ID:', gym.id)
  
  // 🚨 CRITICAL FIX: Always use NORMALIZED gym name for folder creation
  // This ensures consistent folder naming: "kokoro-demo" -> "kokoro demo"
  const folderGymName = normalizedGymName
  console.log('🔧 Using normalized gym name for folders:', folderGymName)
  
  const results = []

  for (const file of files) {
    if (file.isFolder) {
      try {
        const folderName = file.name
        console.log(`📁 Creating folder: ${folderName}`)
        console.log(`📁 Folder type: ${file.folderType}`)
        
        // Create proper gym folder structure first using NORMALIZED gym name
        console.log('🏗️ Creating gym folder structure...')
        const folderStructure = await createFolderStructure(folderGymName)
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