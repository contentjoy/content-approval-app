import { NextRequest, NextResponse } from 'next/server';
import { getDrive, startResumableSession, uploadToResumable } from '@/lib/googleDrive';

export const runtime = 'nodejs'; // ensure Node (not edge)
export const maxDuration = 300; // 5 minutes max

const VALID_SLOTS = new Set(['Slot-1', 'Slot-2', 'Slot-3', 'Slot-4']);

interface RouteParams {
  params: Promise<{ uploadId: string; slot: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slot, uploadId } = await params;
    
    if (!VALID_SLOTS.has(slot)) {
      return NextResponse.json({ 
        error: 'Invalid slot',
        details: `Slot must be one of: ${Array.from(VALID_SLOTS).join(', ')}`
      }, { status: 400 });
    }

    console.log(`📤 Processing upload for slot: ${slot}, upload ID: ${uploadId}`);

    const url = new URL(req.url);
    const filename = url.searchParams.get('filename') || 'file';
    const mime = url.searchParams.get('mime') || 'application/octet-stream';
    const size = url.searchParams.get('sizeBytes');

    const body = req.body; // ReadableStream (Next 14)
    if (!body) {
      return NextResponse.json({ 
        error: 'Empty body',
        details: 'Request body is required for file upload'
      }, { status: 400 });
    }

    // Client must send the slot folder id in header
    const parentId = req.headers.get('x-slot-folder-id');
    if (!parentId) {
      return NextResponse.json({ 
        error: 'Missing slot folder ID',
        details: 'x-slot-folder-id header is required to specify upload destination'
      }, { status: 400 });
    }

    // Validate file size
    const maxMb = Number(process.env.MAX_UPLOAD_MB || '2048'); // Default 2GB
    const sizeBytes = size ? Number(size) : undefined;
    
    if (sizeBytes && sizeBytes > maxMb * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large',
        details: `Maximum file size is ${maxMb}MB. Received: ${Math.round(sizeBytes / (1024 * 1024))}MB`
      }, { status: 413 });
    }

    console.log(`📁 Uploading ${filename} (${mime}) to slot ${slot}, folder: ${parentId}`);

    const drive = getDrive();
    const { uploadUrl, fileId } = await startResumableSession(drive, {
      filename,
      mime,
      parentId,
      sizeBytes
    });

    await uploadToResumable(uploadUrl, body);

    const response = {
      ok: true,
      driveFileId: fileId,
      name: filename,
      slot,
      uploadId,
      message: 'File uploaded successfully'
    };

    console.log(`✅ Upload completed for slot ${slot}: ${filename} (${fileId})`);
    return NextResponse.json(response);

  } catch (error) {
    const { slot } = await params;
    console.error(`❌ Upload failed for slot ${slot}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to get access token')) {
        return NextResponse.json({ 
          error: 'Authentication failed',
          details: 'Failed to authenticate with Google Drive'
        }, { status: 500 });
      }
      
      if (error.message.includes('Resumable init failed')) {
        return NextResponse.json({ 
          error: 'Upload initialization failed',
          details: error.message
        }, { status: 500 });
      }
      
      if (error.message.includes('Resumable PUT failed')) {
        return NextResponse.json({ 
          error: 'Upload failed',
          details: error.message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
