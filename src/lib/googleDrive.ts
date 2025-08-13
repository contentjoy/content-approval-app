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
  
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: DRIVE_SCOPE,
  });
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
  uploadId: string;
  dateStr: string;
}) {
  try {
    console.log(`🏗️ Creating upload structure for gym: ${p.gymName}, upload: ${p.uploadId}`);
    
    const gymFolderId = await ensureFolder(drive, sanitizeName(p.gymName), p.driveRootId);
    const uploadFolderName = `${p.dateStr}_${p.uploadId}`;
    const uploadFolderId = await ensureFolder(drive, uploadFolderName, gymFolderId);
    
    const slotFolders: Record<string, string> = {};
    for (const slot of ['Slot-1', 'Slot-2', 'Slot-3', 'Slot-4']) {
      slotFolders[slot] = await ensureFolder(drive, slot, uploadFolderId);
    }
    
    console.log(`✅ Upload structure created successfully`);
    return { gymFolderId, uploadFolderId, slotFolders };
  } catch (error) {
    console.error('❌ Error creating gym upload structure:', error);
    throw error;
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
