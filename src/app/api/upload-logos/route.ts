import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDrive, ensureFolder } from '@/lib/googleDrive';
import { PassThrough } from 'stream';

interface LogoFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
  isLogo: boolean;
  logoType: 'white' | 'black';
  gymName: string;
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { files, gymSlug, gymName } = body
    
    console.log('🎨 Logo upload request received:', { 
      fileCount: files?.length || 0, 
      gymSlug, 
      gymName,
      hasFiles: !!files,
      filesData: files?.map((f: LogoFile) => ({ name: f.name, type: f.type, size: f.size, isLogo: f.isLogo }))
    })
    
    if (!files || files.length === 0) {
      console.error('❌ No files provided in request')
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!gymSlug || !gymName) {
      console.error('❌ Missing gym information:', { gymSlug, gymName })
      return NextResponse.json({ error: 'Missing gym information' }, { status: 400 })
    }

    // 🚨 CRITICAL FIX: Convert gymSlug to proper gym name (same as upload content)
    // This prevents duplicate client folders: "my-fitness-guide" vs "my fitness guide"
    const normalizedGymName = gymSlug.replace(/-/g, ' ')
    console.log('🎨 Normalized gym name for folder creation:', { 
      original: gymName, 
      normalized: normalizedGymName,
      willUse: normalizedGymName 
    })
    
    console.log('🎨 Processing logo upload for gym:', normalizedGymName)
    
    // Get gym ID from database using normalized name
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('"Gym Name"', normalizedGymName)
      .single()
    
    if (gymError || !gym) {
      console.error('❌ Gym lookup failed:', gymError)
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    console.log('✅ Found gym:', normalizedGymName, 'ID:', gym.id)
    
    // Initialize Google Drive client
    const drive = getDrive()
    console.log('✅ Google Drive client initialized')
    
    // Create logo folder structure using NORMALIZED gym name
    const folderStructure = await createLogoFolderStructure(drive, normalizedGymName)
    console.log('✅ Logo folder structure created:', folderStructure)
    
    // Upload logo files
    const uploadResults = []
    for (const file of files) {
      try {
        if (!file.isLogo) {
          throw new Error('File is not a logo')
        }

        console.log(`📤 Uploading ${file.name} to Google Drive...`)
        
        const uploadResult = await uploadLogoToDrive(drive, file, folderStructure.logosFolderId)
        uploadResults.push({
          name: file.name,
          success: true,
          fileId: uploadResult.fileId,
          logoType: file.logoType
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
    
    const successCount = uploadResults.filter(r => r.success).length
    console.log(`🎉 Logo upload completed: ${successCount}/${files.length} files successful`)
    
    return NextResponse.json({
      success: true,
      message: `Uploaded ${successCount}/${files.length} logos successfully`,
      folderStructure,
      results: uploadResults
    })
    
  } catch (error) {
    console.error('❌ Logo upload error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Logo upload failed' 
    }, { status: 500 })
  }
}

async function createLogoFolderStructure(drive: any, gymName: string) {
  try {
    console.log('🏗️ Creating logo folder structure for:', gymName);
    
    // Get the shared drive ID and clients folder ID (same as upload-to-drive)
    const sharedDriveId = '0ALOLvWQ1QTx5Uk9PVA'; // New shared drive ID
    const clientsFolderId = '1TCc0xlIA6raD3xBfWOXPMU0PWyTMNnGD'; // "Clients" folder inside shared drive
    
    if (!sharedDriveId) {
      throw new Error('GOOGLE_SHARED_DRIVE_ID not configured');
    }
    
    console.log(`🏢 Using shared drive: ${sharedDriveId}`);
    console.log(`📁 Using clients folder: ${clientsFolderId}`);
    
    // Step 1: Create or find gym folder inside the existing "Clients" folder
    console.log(`🏋️ Creating/finding gym folder: ${gymName} inside Clients folder`);
    const gymFolderId = await ensureFolder(drive, gymName, clientsFolderId);
    console.log('🏋️ Gym folder:', gymFolderId);
    
    // Step 2: Create logos folder inside the gym folder
    console.log('🎨 Creating/finding Logos folder inside gym folder');
    const logosFolderId = await ensureFolder(drive, 'Logos', gymFolderId);
    console.log('🎨 Logos folder:', logosFolderId);
    
    return {
      sharedDriveId,
      clientsFolderId,
      gymFolderId,
      logosFolderId
    };
    
  } catch (error) {
    console.error('❌ Failed to create logo folder structure:', error);
    throw error;
  }
}

async function uploadLogoToDrive(drive: any, file: LogoFile, logosFolderId: string) {
  try {
    console.log(`📤 Uploading logo ${file.name} to Google Drive...`);
    console.log(`📁 Uploading to logos folder: ${logosFolderId}`);
    
    // Convert base64 to buffer
    const buffer = Buffer.from(file.data, 'base64')
    console.log(`📊 File size: ${buffer.length} bytes`)
    
    // Get shared drive ID
    const sharedDriveId = '0ALOLvWQ1QTx5Uk9PVA'
    
    try {
      // Try multipart upload with fixed PassThrough stream (same as upload-to-drive)
      const fileMetadata = {
        name: file.name,
        parents: [logosFolderId],
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
        driveId: sharedDriveId,
      } as any)
      
      if (!response.data || !response.data.id) {
        throw new Error('No file ID returned from multipart upload')
      }
      
      console.log(`✅ Logo uploaded successfully with multipart: ${response.data.name} (${response.data.id})`)
      
      return {
        success: true,
        fileId: response.data.id,
        size: response.data.size,
        webViewLink: response.data.webViewLink
      }
      
    } catch (uploadError) {
      console.error(`❌ Multipart upload failed:`, uploadError)
      
      // Fallback for small files: simple upload (same as upload-to-drive)
      console.log(`🔄 Trying simple upload fallback...`)
      
      try {
        const fallbackResponse = await drive.files.create({
          resource: {
            name: file.name,
            parents: [logosFolderId],
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
        
        console.log(`✅ Logo uploaded successfully with fallback: ${fallbackResponse.data.name} (${fallbackResponse.data.id})`)
        
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
    }
    
  } catch (error) {
    console.error(`❌ Failed to upload logo ${file.name}:`, error)
    throw error
  }
}
