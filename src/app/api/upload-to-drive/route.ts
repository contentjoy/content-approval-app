import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDrive } from '@/lib/googleDrive';
import { PassThrough } from 'stream';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max


export async function POST(req: NextRequest) {
  try {
    const { files, gymSlug, gymName } = await req.json();
    
    console.log('🚀 Starting Google Drive upload for gym:', gymName);
    console.log('📁 Files to upload:', files.length);
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    if (!gymSlug || !gymName) {
      return NextResponse.json({ error: 'Missing gym information' }, { status: 400 });
    }
    
    // Get gym ID from database
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('"Gym Name"', gymName)
      .single();
    
    if (gymError || !gym) {
      console.error('❌ Gym lookup failed:', gymError);
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
    }
    
    console.log('✅ Found gym:', gymName, 'ID:', gym.id);
    
    // Initialize Google Drive client using the working getDrive function
    const drive = getDrive();
    
    console.log('✅ Google Drive client initialized');
    
    // Create folder structure
    const folderStructure = await createFolderStructure(gymName);
    console.log('✅ Folder structure created:', folderStructure);
    
    // Upload files to appropriate folders
    const uploadResults = [];
    
    for (const file of files) {
      try {
        // Determine which slot folder to use based on file type
        const slotName = determineSlotName(file);
        const targetFolderId = folderStructure.rawSlotFolders[slotName];
        
        if (!targetFolderId) {
          throw new Error(`No target folder found for slot: ${slotName}`);
        }
        
        console.log(`📤 Uploading ${file.name} to Google Drive...`);
        console.log(`📁 Uploading to folder: ${slotName} (${targetFolderId})`);
        
        // Convert base64 to buffer
        const buffer = Buffer.from(file.data, 'base64');
        console.log(`📊 File size: ${buffer.length} bytes`);
        
        // Get shared drive ID
        const sharedDriveId = '0ALOLvWQ1QTx5Uk9PVA';
        
        try {
          // Try multipart upload with fixed PassThrough stream
          const fileMetadata = {
            name: file.name,
            parents: [targetFolderId],
          };
          const media = {
            mimeType: file.type,
            body: new PassThrough().end(buffer), // Key fix: Pipeable stream from buffer
          };
          
          console.log(`🔄 Attempting multipart upload with PassThrough stream...`);
          
          const response = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: 'id,name,size,webViewLink',
            supportsAllDrives: true,
            driveId: sharedDriveId, // Explicit shared drive targeting
          } as any);
          
          if (!response.data || !response.data.id) {
            throw new Error('No file ID returned from multipart upload');
          }
          
          console.log(`✅ File uploaded successfully with multipart: ${response.data.name} (${response.data.id})`);
          
          uploadResults.push({
            name: file.name,
            success: true,
            fileId: response.data.id,
            size: response.data.size,
            webViewLink: response.data.webViewLink,
            slot: slotName
          });
          
        } catch (uploadError) {
          console.error(`❌ Multipart upload failed:`, uploadError);
          
          // Fallback for small files: simple upload
          if (buffer.length < 5 * 1024 * 1024) { // < 5MB
            console.log(`🔄 Trying simple upload fallback for small file...`);
            
            try {
              const fallbackResponse = await drive.files.create({
                resource: {
                  name: file.name,
                  parents: [targetFolderId],
                },
                media: {
                  mimeType: file.type,
                  body: buffer, // Use buffer directly for simple upload
                },
                uploadType: 'media',
                fields: 'id,name,size,webViewLink',
                supportsAllDrives: true,
                driveId: sharedDriveId,
              } as any);
              
              if (!fallbackResponse.data || !fallbackResponse.data.id) {
                throw new Error('No file ID returned from fallback upload');
              }
              
              console.log(`✅ File uploaded successfully with fallback: ${fallbackResponse.data.name} (${fallbackResponse.data.id})`);
              
              uploadResults.push({
                name: file.name,
                success: true,
                fileId: fallbackResponse.data.id,
                size: fallbackResponse.data.size,
                webViewLink: fallbackResponse.data.webViewLink,
                slot: slotName
              });
              
            } catch (fallbackError) {
              console.error(`❌ Fallback upload also failed:`, fallbackError);
              uploadResults.push({
                name: file.name,
                success: false,
                error: fallbackError instanceof Error ? fallbackError.message : 'Fallback upload failed'
              });
            }
          } else {
            // File too large for simple upload fallback
            uploadResults.push({
              name: file.name,
              success: false,
              error: `File too large (${Math.round(buffer.length / (1024 * 1024))}MB) for fallback upload`
            });
          }
        }
        
        console.log(`✅ File processed: ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error);
        uploadResults.push({ 
          name: file.name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // Store upload record in database
    const { error: dbError } = await supabase
      .from('uploads')
      .insert([{
        upload_id: `upload_${Date.now()}`,
        gym_id: gym.id,
        gym_name: gymName,
        upload_folder_id: folderStructure.timestampFolderId,
        gym_folder_id: folderStructure.gymFolderId,
        raw_footage_folder_id: folderStructure.rawFootageFolderId,
        final_footage_folder_id: folderStructure.finalFootageFolderId,
        status: 'completed',
        files_uploaded: uploadResults.filter(r => r.success).length,
        total_files: files.length
      }]);
    
    if (dbError) {
      console.error('⚠️ Failed to store upload record:', dbError);
    }
    
    const successCount = uploadResults.filter(r => r.success).length;
    console.log(`🎉 Upload completed: ${successCount}/${files.length} files successful`);
    
    return NextResponse.json({
      success: true,
      message: `Uploaded ${successCount}/${files.length} files successfully`,
      folderStructure,
      results: uploadResults
    });
    
  } catch (error) {
    console.error('❌ Upload to Google Drive failed:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    const gymFolderId = await createOrFindFolder(drive, gymName, clientsFolderId, sharedDriveId);
    console.log('🏋️ Gym folder:', gymFolderId);
    
    // Step 2: Create timestamp folder
    const timestampFolderId = await createOrFindFolder(drive, uploadLabel, gymFolderId, sharedDriveId);
    console.log('📅 Timestamp folder:', timestampFolderId);
    
    // Step 3: Create Raw footage and Final footage folders
    const rawFootageFolderId = await createOrFindFolder(drive, 'Raw footage', timestampFolderId, sharedDriveId);
    const finalFootageFolderId = await createOrFindFolder(drive, 'Final footage', timestampFolderId, sharedDriveId);
    console.log('🎬 Raw footage folder:', rawFootageFolderId);
    console.log('✨ Final footage folder:', finalFootageFolderId);
    
    // Step 4: Create slot folders in both Raw and Final footage
    const slotNames = ['Photos', 'Videos', 'Facility Photos', 'Facility Videos'];
    const rawSlotFolders: Record<string, string> = {};
    const finalSlotFolders: Record<string, string> = {};
    
    for (const slot of slotNames) {
      rawSlotFolders[slot] = await createOrFindFolder(drive, slot, rawFootageFolderId, sharedDriveId);
      finalSlotFolders[slot] = await createOrFindFolder(drive, slot, finalFootageFolderId, sharedDriveId);
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

async function createOrFindFolder(drive: any, name: string, parentId: string, sharedDriveId: string): Promise<string> {
  try {
    // Check if folder already exists
    const { data: existingFolders } = await drive.files.list({
      q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id,name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    
    if (existingFolders.files && existingFolders.files.length > 0) {
      console.log(`📁 Found existing folder: ${name}`);
      return existingFolders.files[0].id!;
    }
    
    // Create new folder in the shared drive context
    const { data: newFolder } = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
      driveId: sharedDriveId,
    } as any);
    
    if (!newFolder.id) {
      throw new Error('Failed to create folder - no ID returned');
    }
    
    console.log(`✅ Created folder: ${name} (${newFolder.id})`);
    return newFolder.id;
    
  } catch (error) {
    console.error(`❌ Error creating/finding folder ${name}:`, error);
    throw error;
  }
}
