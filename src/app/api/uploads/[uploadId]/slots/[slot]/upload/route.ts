import { NextRequest, NextResponse } from 'next/server';
import { getDrive, uploadFileDirectly } from '@/lib/googleDrive';
import { supabase } from '@/lib/supabase';
import { SLOT_NAMES, type SlotName } from '@/lib/slots';

export const runtime = 'nodejs'; // ensure Node (not edge)
export const maxDuration = 300; // 5 minutes max

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ uploadId: string; slot: string }> }
) {
  try {
    const { slot, uploadId } = await params;
    
    if (!SLOT_NAMES.includes(slot as SlotName)) {
      return NextResponse.json({ 
        error: 'Invalid slot',
        details: `Slot must be one of: ${SLOT_NAMES.join(', ')}`
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

    // Look up slot folder ID from Supabase
    const supa = supabase;
    const { data: slotData, error: slotError } = await supa
      .from('upload_slots')
      .select('drive_folder_id')
      .eq('upload_id', uploadId)
      .eq('slot_name', slot)
      .single();

    if (slotError || !slotData?.drive_folder_id) {
      console.error('❌ Failed to fetch slot folder ID:', slotError);
      return NextResponse.json({ 
        error: 'Slot not found',
        details: 'Failed to fetch slot folder information from database'
      }, { status: 404 });
    }

    const parentId = slotData.drive_folder_id;

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
    
    // Use direct upload instead of resumable upload
    const { fileId } = await uploadFileDirectly(drive, {
      filename,
      mime,
      parentId,
      body,
      sizeBytes
    });

    // Persist file data to Supabase
    const { error: fileError } = await supa
      .from('files')
      .insert([{
        upload_id: uploadId,
        slot_name: slot,
        drive_file_id: fileId,
        name: filename,
        size_bytes: sizeBytes,
        mime
      }]);

    if (fileError) {
      console.error('❌ Failed to persist file data:', fileError);
      // Don't fail the upload if database insert fails, but log it
      console.warn('⚠️ File uploaded but failed to persist metadata');
    }

    const response = {
      ok: true,
      driveFileId: fileId,
      filename,
      slot,
      sizeBytes
    };

    console.log(`✅ Upload completed successfully for ${filename} in slot ${slot}`);
    return NextResponse.json(response);

  } catch (error) {
    const { slot } = await params;
    console.error(`❌ Upload failed for slot ${slot}:`, error);
    
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown upload error'
    }, { status: 500 });
  }
}
