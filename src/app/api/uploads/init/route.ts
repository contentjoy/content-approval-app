import { NextRequest, NextResponse } from 'next/server';
import { getDrive, ensureGymUploadStructure, timestampLabel, shortId } from '@/lib/googleDrive';
import { supabase } from '@/lib/supabase';
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

    console.log(`✅ Drive root ID found: ${driveRootId}`);

    // Look up canonical gym name from Supabase
    const supa = supabase;
    console.log(`🔍 Looking up gym data for ID: ${gymId}`);
    
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

    // Test Google Drive connection
    console.log(`🔌 Testing Google Drive connection...`);
    let drive;
    try {
      drive = getDrive();
      console.log(`✅ Google Drive connection successful`);
    } catch (driveError) {
      console.error('❌ Google Drive connection failed:', driveError);
      return NextResponse.json({ 
        error: 'Google Drive connection failed',
        details: driveError instanceof Error ? driveError.message : 'Unknown drive error'
      }, { status: 500 });
    }

    const uploadLabel = `${timestampLabel()}_${shortId()}`;
    const uploadId = shortId(); // Use short ID as upload ID

    console.log(`📅 Creating upload structure with label: ${uploadLabel}`);

    // Test folder creation
    let structure;
    try {
      structure = await ensureGymUploadStructure(drive, {
        driveRootId,
        gymName,
        uploadLabel,
        slotNames: SLOT_NAMES
      });
      console.log(`✅ Folder structure created successfully:`, {
        gymFolderId: structure.gymFolderId,
        timestampFolderId: structure.timestampFolderId,
        rawFootageFolderId: structure.rawFootageFolderId,
        finalFootageFolderId: structure.finalFootageFolderId
      });
    } catch (structureError) {
      console.error('❌ Folder structure creation failed:', structureError);
      return NextResponse.json({ 
        error: 'Failed to create folder structure',
        details: structureError instanceof Error ? structureError.message : 'Unknown structure error'
      }, { status: 500 });
    }

    console.log(`💾 Persisting upload data to database...`);

    // Persist upload data to Supabase with new folder structure
    const { error: uploadError } = await supa
      .from('uploads')
      .insert([{ 
        upload_id: uploadId, 
        gym_id: gymId, 
        gym_name: gymName, 
        upload_folder_id: structure.timestampFolderId,
        gym_folder_id: structure.gymFolderId,
        raw_footage_folder_id: structure.rawFootageFolderId,
        final_footage_folder_id: structure.finalFootageFolderId
      }]);

    if (uploadError) {
      console.error('❌ Failed to insert upload record:', uploadError);
      console.error('❌ Upload data attempted:', { 
        upload_id: uploadId, 
        gym_id: gymId, 
        gym_name: gymName, 
        upload_folder_id: structure.timestampFolderId,
        gym_folder_id: structure.gymFolderId,
        raw_footage_folder_id: structure.rawFootageFolderId,
        final_footage_folder_id: structure.finalFootageFolderId
      });
      return NextResponse.json({ 
        error: 'Failed to persist upload data',
        details: `Database error: ${uploadError.message}`,
        code: uploadError.code
      }, { status: 500 });
    }

    console.log(`✅ Upload record persisted successfully`);

    // Persist slot data to Supabase
    console.log(`💾 Persisting slot data to database...`);
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
        details: `Database error: ${slotError.message}`,
        code: slotError.code
      }, { status: 500 });
    }

    console.log(`✅ Slot records persisted successfully`);

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
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
