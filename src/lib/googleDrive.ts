import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import crypto from 'crypto';

const DRIVE_SCOPE = ['https://www.googleapis.com/auth/drive'];

export function getAuth() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS_JSON');
  
  let creds;
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
  }
  
  if (!creds.client_email || !creds.private_key) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON missing client_email or private_key');
  }
  
  // Fix private key format for Vercel/Node.js compatibility
  let privateKey = creds.private_key;
  
  // Handle escaped newlines that might cause OpenSSL issues
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  // Ensure proper PEM format
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format - must be PEM encoded');
  }
  
  console.log(`🔑 Google Auth: Using service account ${creds.client_email}`);
  console.log(`🔑 Private key length: ${privateKey.length} characters`);
  console.log(`🔑 Project ID: ${creds.project_id}`);
  
  try {
    return new google.auth.JWT({
      email: creds.client_email,
      key: privateKey,
      scopes: DRIVE_SCOPE,
    });
  } catch (authError) {
    console.error('❌ Google Auth JWT creation failed:', authError);
    if (authError instanceof Error && authError.message.includes('DECODER routines')) {
      throw new Error('Google service account private key format error - check GOOGLE_APPLICATION_CREDENTIALS_JSON encoding');
    }
    throw authError;
  }
}

export function getDrive(auth = getAuth()) {
  return google.drive({ version: 'v3', auth });
}

export function sanitizeName(name: string) {
  return name.replace(/[\/\\<>:"|?*\u0000-\u001F]/g, '-').trim().slice(0, 200);
}

export async function ensureFolder(
  drive: drive_v3.Drive, 
  name: string, 
  parentId: string
): Promise<string> {
  try {
    // Escape single quotes in the query
    const escapedName = name.replace(/'/g, "\\'");
    const q = `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
    
    const { data } = await drive.files.list({
      q,
      fields: 'files(id,name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    
    if (data.files?.[0]?.id) {
      console.log(`📁 Found existing folder: ${name} (${data.files[0].id})`);
      return data.files[0].id;
    }
    
    console.log(`📁 Creating new folder: ${name} in parent ${parentId}`);
    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });
    
    if (!res.data.id) {
      throw new Error('Failed to create folder - no ID returned');
    }
    
    console.log(`✅ Created folder: ${name} (${res.data.id})`);
    return res.data.id;
  } catch (error) {
    console.error(`❌ Error ensuring folder ${name}:`, error);
    throw new Error(`Failed to ensure folder ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Find a file by exact name within a parent folder. Returns the first match or null.
export async function findFileInFolder(
  drive: drive_v3.Drive,
  parentId: string,
  name: string
): Promise<{ id: string; name: string; size?: string } | null> {
  try {
    // Escape single quotes in the query
    const escapedName = name.replace(/'/g, "\\'")
    const q = `name='${escapedName}' and '${parentId}' in parents and trashed=false`;
    const { data } = await drive.files.list({
      q,
      fields: 'files(id,name,size)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 10
    });
    return data.files && data.files.length > 0 ? data.files[0] as any : null
  } catch (error) {
    console.error('❌ Error finding file in folder:', error)
    return null
  }
}

export async function ensureGymUploadStructure(drive: drive_v3.Drive, p: {
  driveRootId: string;
  gymName: string;
  uploadLabel: string;
  slotNames: readonly string[];
}) {
  try {
    console.log(`🏗️ Creating upload structure for gym: ${p.gymName}, upload: ${p.uploadLabel}`);
    
    // Step 1: Ensure gym name folder exists (create if not)
    const gymFolderId = await ensureFolder(drive, sanitizeName(p.gymName), p.driveRootId);
    console.log(`🏋️ Gym folder ensured: ${p.gymName} (${gymFolderId})`);
    
    // Step 2: Create timestamp folder inside gym folder
    const timestampFolderId = await ensureFolder(drive, p.uploadLabel, gymFolderId);
    console.log(`📅 Timestamp folder created: ${p.uploadLabel} (${timestampFolderId})`);
    
    // Step 3: Create "Raw footage" and "Final footage" folders
    const rawFootageFolderId = await ensureFolder(drive, 'Raw footage', timestampFolderId);
    const finalFootageFolderId = await ensureFolder(drive, 'Final footage', timestampFolderId);
    console.log(`🎬 Raw footage folder created: Raw footage (${rawFootageFolderId})`);
    console.log(`✨ Final footage folder created: Final footage (${finalFootageFolderId})`);
    
    // Step 4: Create slot folders inside both Raw and Final footage folders
    const rawSlotFolders: Record<string, string> = {};
    const finalSlotFolders: Record<string, string> = {};
    
    for (const slot of p.slotNames) {
      // Create slot folder in Raw footage
      rawSlotFolders[slot] = await ensureFolder(drive, slot, rawFootageFolderId);
      console.log(`📁 Raw ${slot} folder created: ${slot} (${rawSlotFolders[slot]})`);
      
      // Create slot folder in Final footage
      finalSlotFolders[slot] = await ensureFolder(drive, slot, finalFootageFolderId);
      console.log(`📁 Final ${slot} folder created: ${slot} (${finalSlotFolders[slot]})`);
    }
    
    console.log(`✅ Upload structure created successfully with Raw and Final footage folders`);
    return { 
      gymFolderId, 
      timestampFolderId, 
      rawFootageFolderId,
      finalFootageFolderId,
      rawSlotFolders, 
      finalSlotFolders,
      // For backward compatibility, return the raw slot folders as the main slot folders
      slotFolders: rawSlotFolders
    };
  } catch (error) {
    console.error(`❌ Error creating upload structure:`, error);
    throw new Error(`Failed to create upload structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ULTIMATE SIMPLE SOLUTION: Use Google Drive API correctly
export async function uploadFileDirectly(drive: drive_v3.Drive, p: {
  filename: string;
  mime: string;
  parentId: string;
  body: ReadableStream | Buffer;
  sizeBytes?: number;
}): Promise<{ fileId: string }> {
  // Declare fileBuffer in outer scope so it's accessible in catch block
  let fileBuffer: Buffer | undefined;
  
  try {
    console.log(`🚀 Starting ULTIMATE SIMPLE upload for: ${p.filename}`);
    
    // Convert ReadableStream to Buffer
    if (p.body instanceof Buffer) {
      fileBuffer = p.body;
    } else if (p.body instanceof ReadableStream) {
      // Convert ReadableStream to Buffer
      const chunks: Uint8Array[] = [];
      const reader = p.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      fileBuffer = Buffer.concat(chunks);
    } else {
      throw new Error('Invalid body type - expected Buffer or ReadableStream');
    }
    
    console.log(`📤 Uploading ${fileBuffer.length} bytes to Google Drive...`);
    
    // ULTIMATE SIMPLE: Use the Google Drive API's file upload method
    const res = await drive.files.create({
      requestBody: {
        name: p.filename,
        parents: [p.parentId],
      },
      media: {
        mimeType: p.mime,
        body: fileBuffer,
      },
      supportsAllDrives: true,
      fields: 'id,name,size',
    });
    
    if (!res.data.id) {
      throw new Error('No file ID returned from upload');
    }
    
    console.log(`✅ File uploaded successfully: ${res.data.name} (${res.data.id})`);
    return { fileId: res.data.id };
  } catch (error) {
    console.error('❌ Error uploading file directly:', error);
    
    // If the error is about pipe and we have a fileBuffer, try alternative method
    if (error instanceof Error && error.message.includes('pipe') && fileBuffer) {
      console.log('🔄 Trying alternative upload method...');
      
      try {
        // Alternative: Use the Google Drive API's simple upload method
        const res = await drive.files.create({
          requestBody: {
            name: p.filename,
            parents: [p.parentId],
          },
          media: {
            mimeType: p.mime,
            body: fileBuffer,
          },
          supportsAllDrives: true,
          fields: 'id,name,size',
          // Force simple upload
          uploadType: 'media'
        });
        
        if (!res.data.id) {
          throw new Error('No file ID returned from alternative upload');
        }
        
        console.log(`✅ File uploaded successfully with alternative method: ${res.data.name} (${res.data.id})`);
        return { fileId: res.data.id };
      } catch (altError) {
        console.error('❌ Alternative upload method also failed:', altError);
        throw error; // Throw the original error
      }
    }
    
    throw error;
  }
}

// Keep the old function for backward compatibility but mark as deprecated
export async function startResumableSession(drive: drive_v3.Drive, p: {
  filename: string;
  mime: string;
  parentId: string;
  sizeBytes?: number;
}): Promise<{ uploadUrl: string; fileId: string }> {
  console.warn('⚠️ startResumableSession is deprecated. Use uploadFileDirectly instead.');
  
  // Fallback to direct upload
  const result = await uploadFileDirectly(drive, {
    ...p,
    body: Buffer.alloc(0) // Empty buffer as placeholder
  });
  
  return { uploadUrl: 'deprecated', fileId: result.fileId };
}

export async function uploadToResumable(uploadUrl: string, body: ReadableStream | Buffer) {
  try {
    console.log(`📤 Uploading to resumable session: ${uploadUrl}`);
    
    let fetchBody: BodyInit;
    
    if (body instanceof Buffer) {
      // Convert Buffer to Uint8Array for fetch
      fetchBody = new Uint8Array(body);
    } else {
      // ReadableStream is already compatible with fetch
      fetchBody = body as BodyInit;
    }
    
    const put = await fetch(uploadUrl, { 
      method: 'PUT', 
      body: fetchBody,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      // Required for Node.js 18+ when sending a body
      duplex: 'half'
    } as RequestInit & { duplex: 'half' });
    
    if (!put.ok) {
      const txt = await put.text();
      throw new Error(`Resumable PUT failed: ${put.status} ${txt}`);
    }
    
    console.log(`✅ Upload completed successfully`);
  } catch (error) {
    console.error('❌ Error uploading to resumable session:', error);
    throw error;
  }
}

export function newUploadId() {
  return crypto.randomBytes(8).toString('hex');
}

export function timestampLabel() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

export function shortId() {
  return Math.random().toString(36).slice(-8);
}

// Utility function to get file size from ReadableStream
export async function getStreamSize(stream: ReadableStream): Promise<number> {
  let size = 0;
  const reader = stream.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
    }
  } finally {
    reader.releaseLock();
  }
  
  return size;
}
