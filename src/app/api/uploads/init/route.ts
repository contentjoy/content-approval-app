import { NextRequest, NextResponse } from 'next/server';
import { getDrive, ensureGymUploadStructure, newUploadId } from '@/lib/googleDrive';

export async function POST(req: NextRequest) {
  try {
    const { gymName } = await req.json();
    
    if (!gymName) {
      return NextResponse.json({ 
        error: 'gymName required',
        details: 'Please provide a gym name in the request body'
      }, { status: 400 });
    }

    console.log(`🚀 Initializing upload structure for gym: ${gymName}`);

    // Validate environment variables
    const driveRootId = process.env.GOOGLE_GYM_ROOT_FOLDER_ID || process.env.GOOGLE_SHARED_DRIVE_ID;
    if (!driveRootId) {
      console.error('❌ Missing Google Drive root folder ID');
      return NextResponse.json({ 
        error: 'Google Drive not configured',
        details: 'GOOGLE_GYM_ROOT_FOLDER_ID or GOOGLE_SHARED_DRIVE_ID environment variable is required'
      }, { status: 500 });
    }

    const drive = getDrive();
    const uploadId = newUploadId();
    const dateStr = new Date().toISOString().slice(0, 10);

    console.log(`📅 Creating upload structure for date: ${dateStr}, upload ID: ${uploadId}`);

    const structure = await ensureGymUploadStructure(drive, {
      driveRootId,
      gymName,
      uploadId,
      dateStr
    });

    const response = {
      uploadId,
      dateStr,
      ...structure,
      message: 'Upload structure created successfully'
    };

    console.log(`✅ Upload initialization completed for ${gymName}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Upload initialization failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS_JSON')) {
        return NextResponse.json({ 
          error: 'Google Drive authentication not configured',
          details: 'Please configure GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable'
        }, { status: 500 });
      }
      
      if (error.message.includes('Failed to ensure folder')) {
        return NextResponse.json({ 
          error: 'Failed to create folder structure',
          details: error.message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Upload initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
