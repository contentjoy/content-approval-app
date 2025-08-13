import { NextRequest, NextResponse } from 'next/server';
import { getDrive } from '@/lib/googleDrive';

interface RouteParams {
  params: Promise<{ uploadId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { uploadId } = await params;
    const { uploadFolderId, manifest } = await req.json();
    
    console.log(`🏁 Completing upload: ${uploadId}`);

    // If no uploadFolderId provided, just return success (noop)
    if (!uploadFolderId) {
      console.log(`ℹ️ No upload folder ID provided, marking upload ${uploadId} as complete`);
      return NextResponse.json({ 
        ok: true, 
        message: 'Upload marked as complete',
        uploadId 
      });
    }

    console.log(`📝 Creating manifest file for upload ${uploadId} in folder ${uploadFolderId}`);

    // Create upload manifest with metadata
    const manifestData = {
      uploadId,
      completedAt: new Date().toISOString(),
      manifest: manifest || {},
      metadata: {
        totalSlots: 4,
        slots: ['Slot-1', 'Slot-2', 'Slot-3', 'Slot-4'],
        status: 'completed'
      }
    };

    const drive = getDrive();
    
    // Create the manifest file in Google Drive
    const { data } = await drive.files.create({
      requestBody: {
        name: 'upload.json',
        parents: [uploadFolderId],
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
    }
    
    return NextResponse.json({ 
      error: 'Upload completion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
