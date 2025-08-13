export async function initUpload(gymId: string): Promise<string> {
  const res = await fetch('/api/uploads/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gymId }),
  });
  if (!res.ok) throw new Error('init failed');
  const data = await res.json();
  return data.uploadId as string;
}

export async function uploadFile(uploadId: string, slot: string, file: File) {
  const qs = new URLSearchParams({
    filename: file.name,
    mime: file.type || 'application/octet-stream',
    sizeBytes: String(file.size || 0),
  });
  const res = await fetch(`/api/uploads/${encodeURIComponent(uploadId)}/slots/${encodeURIComponent(slot)}/upload?${qs}`, {
    method: 'POST',
    body: file, // raw
  });
  if (!res.ok) throw new Error(`${slot}: ${file.name} → ${res.status}`);
  return res.json();
}

export async function completeUpload(uploadId: string) {
  const res = await fetch(`/api/uploads/${encodeURIComponent(uploadId)}/complete`, { method: 'POST' });
  if (!res.ok) throw new Error('complete failed');
}
