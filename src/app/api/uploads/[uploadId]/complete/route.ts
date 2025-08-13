import { NextRequest, NextResponse } from 'next/server';
import { getDrive } from '@/lib/googleDrive';
import { getAdminClient } from '@/lib/supabaseServer';

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    
    console.log(`🏁 Completing upload: ${uploadId}`);

    // Get upload and file data from Supabase
    const supa = getAdminClient();
    
    // Get upload details
    const { data: uploadData, error: uploadError } = await supa
      .from('uploads')
      .select('*')
      .eq('upload_id', uploadId)
      .single();

    if (uploadError || !uploadData) {
      console.error('❌ Failed to fetch upload data:', uploadError);
      return NextResponse.json({ 
        error: 'Upload not found',
        details: 'Failed to fetch upload information from database'
      }, { status: 404 });
    }

    // Get all files for this upload
    const { data: filesData, error: filesError } = await supa
      .from('files')
      .select('*')
      .eq('upload_id', uploadId)
      .order('slot_name');

    if (filesError) {
      console.error('❌ Failed to fetch files data:', filesError);
      return NextResponse.json({ 
        error: 'Failed to fetch files',
        details: 'Database error occurred while fetching files'
      }, { status: 500 });
    }

    // Build manifest from database data
    const manifestData = {
      uploadId,
      gymId: uploadData.gym_id,
      gymName: uploadData.gym_name,
      createdAt: uploadData.created_at || new Date().toISOString(),
      uploadFolderId: uploadData.upload_folder_id,
      files: filesData?.map(file => ({
        slot: file.slot_name,
        name: file.name,
        driveFileId: file.drive_file_id,
        sizeBytes: file.size_bytes,
        mime: file.mime
      })) || [],
      metadata: {
        totalSlots: 4,
        slots: ['Photos', 'Videos', 'Facility Videos', 'Facility Video'],
        status: 'completed',
        totalFiles: filesData?.length || 0
      }
    };

    console.log(`📝 Creating manifest file for upload ${uploadId} with ${manifestData.files.length} files`);

    const drive = getDrive();
    
    // Create the manifest file in Google Drive
    const { data } = await drive.files.create({
      requestBody: {
        name: 'upload.json',
        parents: [uploadData.upload_folder_id],
        mimeType: 'application/json',
        description: `Upload manifest for ${uploadId}`,
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(manifestData, null, 2),
      },
      supportsAllDrives: true,
      fields: 'id,name,webViewLink',
    });

    if (!data.id) {
      throw new Error('Failed to create manifest file - no ID returned');
    }

    const response = {
      ok: true,
      uploadId,
      manifestFileId: data.id,
      manifestFileName: data.name,
      webViewLink: data.webViewLink,
      message: 'Upload completed successfully with manifest',
      manifest: manifestData
    };

    console.log(`✅ Upload ${uploadId} completed successfully. Manifest file: ${data.id}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ Upload completion failed for ${(await params).uploadId}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to create manifest file')) {
        return NextResponse.json({ 
          error: 'Failed to create manifest file',
          details: error.message
        }, { status: 500 });
      }
      
      if (error.message.includes('Failed to authenticate')) {
        return NextResponse.json({ 
          error: 'Authentication failed',
          details: 'Failed to authenticate with Google Drive'
        }, { status: 500 });
      }

      if (error.message.includes('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')) {
        return NextResponse.json({ 
          error: 'Database not configured',
          details: 'Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Upload completion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
