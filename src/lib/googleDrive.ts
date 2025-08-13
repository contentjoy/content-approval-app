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

// Minimal resumable: init session then single PUT of the file body
export async function startResumableSession(drive: drive_v3.Drive, p: {
  filename: string;
  mime: string;
  parentId: string;
  sizeBytes?: number;
}): Promise<{ uploadUrl: string; fileId: string }> {
  try {
    console.log(`🚀 Starting resumable upload for: ${p.filename}`);
    
    // Get OAuth access token
    // @ts-expect-error - accessing auth context
    const token = await drive.context._options.auth.getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }
    
    const accessToken = typeof token === 'string' ? token : token?.token;
    if (!accessToken) {
      throw new Error('Invalid access token format');
    }
    
    const initUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';
    const initRes = await fetch(initUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Upload-Content-Type': p.mime,
        ...(p.sizeBytes ? { 'X-Upload-Content-Length': String(p.sizeBytes) } : {}),
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        name: p.filename,
        parents: [p.parentId],
      }),
    });
    
    if (!initRes.ok) {
      const errorText = await initRes.text();
      throw new Error(`Resumable init failed: ${initRes.status} ${errorText}`);
    }
    
    const location = initRes.headers.get('location');
    if (!location) {
      throw new Error('No resumable session location header received');
    }
    
    const fileData = await initRes.json();
    const fileId = fileData?.id;
    if (!fileId) {
      throw new Error('No file ID returned from resumable init');
    }
    
    console.log(`✅ Resumable session started: ${fileId}`);
    return { uploadUrl: location, fileId };
  } catch (error) {
    console.error('❌ Error starting resumable session:', error);
    throw error;
  }
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
      }
    });
    
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
