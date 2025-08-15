// Shared chunk storage for streaming uploads
export interface ChunkSession {
  chunks: (Buffer | undefined)[]
  metadata: {
    originalFileName: string
    fileType: string
    totalChunks: number
    gymSlug: string
    gymName: string
    targetFolderId: string
    createdAt: number
  }
  lastActivity: number
}

// In-memory storage for chunks (in production, use Redis or database)
const chunkStorage = new Map<string, ChunkSession>()

// Clean up old sessions every hour
setInterval(() => {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  for (const [sessionId, data] of chunkStorage.entries()) {
    if (now - data.lastActivity > oneHour) {
      chunkStorage.delete(sessionId)
      console.log(`🧹 Cleaned up expired session: ${sessionId}`)
    }
  }
}, 60 * 60 * 1000) // Run every hour

export function getChunkStorage() {
  return chunkStorage
}

export function createSession(sessionId: string, metadata: ChunkSession['metadata'], totalChunks: number): ChunkSession {
  const session: ChunkSession = {
    chunks: new Array(totalChunks),
    metadata,
    lastActivity: Date.now()
  }
  chunkStorage.set(sessionId, session)
  return session
}

export function getSession(sessionId: string): ChunkSession | undefined {
  return chunkStorage.get(sessionId)
}

export function updateSessionActivity(sessionId: string) {
  const session = chunkStorage.get(sessionId)
  if (session) {
    session.lastActivity = Date.now()
  }
}

export function deleteSession(sessionId: string) {
  chunkStorage.delete(sessionId)
}
