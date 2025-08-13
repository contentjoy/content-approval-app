import { NextRequest, NextResponse } from 'next/server';
import { getDrive, ensureGymUploadStructure, timestampLabel, shortId } from '@/lib/googleDrive';
import { supabase } from '@/lib/supabase';
import { SLOT_NAMES } from '@/lib/slots';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting upload initialization...');
    
    const { gymId } = await req.json();
    
    if (!gymId) {
      console.error('❌ Missing gymId in request body');
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
    console.log(`🔍 Looking up gym data for ID: ${gymId}`);
    
    try {
      const { data: gymRow, error: gymError } = await supabase
        .from('gyms')
        .select('id, "Gym Name"')
        .eq('id', gymId)
        .single();

      if (gymError) {
        console.error('❌ Supabase query error:', gymError);
        return NextResponse.json({ 
          error: 'Database query failed',
          details: `Supabase error: ${gymError.message}`
        }, { status: 500 });
      }

      if (!gymRow) {
        console.error('❌ No gym found with ID:', gymId);
        return NextResponse.json({ 
          error: 'Gym not found',
          details: 'No gym found with the provided ID'
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
      try {
        const { error: uploadError } = await supabase
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
          return NextResponse.json({ 
            error: 'Failed to persist upload data',
            details: `Database error: ${uploadError.message}`,
            code: uploadError.code
          }, { status: 500 });
        }

        console.log(`✅ Upload record persisted successfully`);
      } catch (dbError) {
        console.error('❌ Database insert failed:', dbError);
        return NextResponse.json({ 
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }

      // Persist slot data to Supabase
      console.log(`💾 Persisting slot data to database...`);
      try {
        const slotRecords = SLOT_NAMES.map(slot => ({
          upload_id: uploadId,
          slot_name: slot,
          drive_folder_id: structure.slotFolders[slot]
        }));

        const { error: slotError } = await supabase
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
      } catch (slotDbError) {
        console.error('❌ Slot database insert failed:', slotDbError);
        return NextResponse.json({ 
          error: 'Slot database operation failed',
          details: slotDbError instanceof Error ? slotDbError.message : 'Unknown slot database error'
        }, { status: 500 });
      }

      console.log(`✅ Upload initialization completed for ${gymName}, upload ID: ${uploadId}`);
      return NextResponse.json({ uploadId });

    } catch (supabaseError) {
      console.error('❌ Supabase operation failed:', supabaseError);
      return NextResponse.json({ 
        error: 'Supabase operation failed',
        details: supabaseError instanceof Error ? supabaseError.message : 'Unknown Supabase error'
      }, { status: 500 });
    }

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
