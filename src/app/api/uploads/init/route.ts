import { NextRequest, NextResponse } from 'next/server';
import { getDrive, ensureGymUploadStructure, timestampLabel, shortId } from '@/lib/googleDrive';
import { getAdminClient } from '@/lib/supabaseServer';
import { SLOT_NAMES } from '@/lib/slots';

export async function POST(req: NextRequest) {
  try {
    const { gymId } = await req.json();
    
    if (!gymId) {
      return NextResponse.json({ 
        error: 'gymId required',
        details: 'Please provide a gym ID in the request body'
      }, { status: 400 });
    }

    console.log(`🚀 Initializing upload structure for gym ID: ${gymId}`);

    // Validate environment variables
    const driveRootId = process.env.GOOGLE_GYM_ROOT_FOLDER_ID || process.env.GOOGLE_SHARED_DRIVE_ID;
    if (!driveRootId) {
      console.error('❌ Missing Google Drive root folder ID');
      return NextResponse.json({ 
        error: 'Google Drive not configured',
        details: 'GOOGLE_GYM_ROOT_FOLDER_ID or GOOGLE_SHARED_DRIVE_ID environment variable is required'
      }, { status: 500 });
    }

    // Look up canonical gym name from Supabase
    const supa = getAdminClient();
    const { data: gymRow, error: gymError } = await supa
      .from('gyms')
      .select('id, "Gym Name"')
      .eq('id', gymId)
      .single();

    if (gymError || !gymRow) {
      console.error('❌ Failed to fetch gym data:', gymError);
      return NextResponse.json({ 
        error: 'Gym not found',
        details: 'Failed to fetch gym data from database'
      }, { status: 404 });
    }

    const gymName = gymRow['Gym Name'] || 'Unknown Gym';
    console.log(`🏋️ Found gym: ${gymName}`);

    const drive = getDrive();
    const uploadLabel = `${timestampLabel()}_${shortId()}`;
    const uploadId = shortId(); // Use short ID as upload ID

    console.log(`📅 Creating upload structure with label: ${uploadLabel}`);

    const structure = await ensureGymUploadStructure(drive, {
      driveRootId,
      gymName,
      uploadLabel,
      slotNames: SLOT_NAMES
    });

    // Persist upload data to Supabase
    const { error: uploadError } = await supa
      .from('uploads')
      .insert([{ 
        upload_id: uploadId, 
        gym_id: gymId, 
        gym_name: gymName, 
        upload_folder_id: structure.uploadFolderId 
      }]);

    if (uploadError) {
      console.error('❌ Failed to insert upload record:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to persist upload data',
        details: 'Database error occurred'
      }, { status: 500 });
    }

    // Persist slot data to Supabase
    const slotRecords = SLOT_NAMES.map(slot => ({
      upload_id: uploadId,
      slot_name: slot,
      drive_folder_id: structure.slotFolders[slot]
    }));

    const { error: slotError } = await supa
      .from('upload_slots')
      .insert(slotRecords);

    if (slotError) {
      console.error('❌ Failed to insert slot records:', slotError);
      return NextResponse.json({ 
        error: 'Failed to persist slot data',
        details: 'Database error occurred'
      }, { status: 500 });
    }

    console.log(`✅ Upload initialization completed for ${gymName}, upload ID: ${uploadId}`);
    return NextResponse.json({ uploadId });

  } catch (error) {
    console.error('❌ Upload initialization failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS_JSON')) {
        return NextResponse.json({ 
          error: 'Google Drive authentication not configured',
          details: 'Please configure GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable'
        }, { status: 500 });
      }
      
      if (error.message.includes('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')) {
        return NextResponse.json({ 
          error: 'Database not configured',
          details: 'Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
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
