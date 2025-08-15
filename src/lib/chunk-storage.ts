// Database-backed chunk storage for streaming uploads
import { getAdminClient } from '@/lib/supabaseServer'

export interface ChunkSession {
  session_id: string
  original_file_name: string
  file_type: string
  total_chunks: number
  received_chunks: number
  gym_slug: string
  gym_name: string
  target_folder_id: string
  created_at: string
  last_activity: string
  is_complete: boolean
}

export interface ChunkData {
  session_id: string
  chunk_index: number
  total_chunks: number
  original_file_name: string
  file_type: string
  chunk_data: Buffer
  gym_slug: string
  gym_name: string
  target_folder_id: string
}

// Create a new upload session
export async function createSession(metadata: Omit<ChunkData, 'chunk_index' | 'chunk_data'>): Promise<void> {
  try {
    const supabase = getAdminClient()
    
    // Insert the first chunk to create the session
    const { error } = await supabase
      .from('file_chunks')
      .insert({
        session_id: metadata.session_id,
        chunk_index: 0, // We'll update this with the actual chunk data
        total_chunks: metadata.total_chunks,
        original_file_name: metadata.original_file_name,
        file_type: metadata.file_type,
        chunk_data: Buffer.alloc(0), // Placeholder, will be updated by storeChunk
        gym_slug: metadata.gym_slug,
        gym_name: metadata.gym_name,
        target_folder_id: metadata.target_folder_id
      })

    if (error) {
      console.error('❌ Failed to create session:', error)
      throw new Error(`Failed to create session: ${error.message}`)
    }

    console.log(`🆕 Created new upload session: ${metadata.session_id} for ${metadata.original_file_name}`)
  } catch (error) {
    console.error('❌ Session creation error:', error)
    throw error
  }
}

// Store a chunk in the database
export async function storeChunk(chunkData: ChunkData): Promise<void> {
  try {
    const supabase = getAdminClient()
    
    const { error } = await supabase
      .from('file_chunks')
      .upsert({
        session_id: chunkData.session_id,
        chunk_index: chunkData.chunk_index,
        total_chunks: chunkData.total_chunks,
        original_file_name: chunkData.original_file_name,
        file_type: chunkData.file_type,
        chunk_data: chunkData.chunk_data,
        gym_slug: chunkData.gym_slug,
        gym_name: chunkData.gym_name,
        target_folder_id: chunkData.target_folder_id,
        last_activity: new Date().toISOString()
      }, {
        onConflict: 'session_id,chunk_index'
      })

    if (error) {
      console.error('❌ Failed to store chunk:', error)
      throw new Error(`Failed to store chunk: ${error.message}`)
    }

    console.log(`📦 Stored chunk ${chunkData.chunk_index + 1}/${chunkData.total_chunks} for session ${chunkData.session_id}`)
  } catch (error) {
    console.error('❌ Chunk storage error:', error)
    throw error
  }
}

// Get session status and metadata
export async function getSession(sessionId: string): Promise<ChunkSession | null> {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('chunk_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('❌ Failed to get session:', error)
      throw new Error(`Failed to get session: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('❌ Session retrieval error:', error)
    throw error
  }
}

// Get all chunks for a session
export async function getSessionChunks(sessionId: string): Promise<Buffer[]> {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('file_chunks')
      .select('chunk_index, chunk_data')
      .eq('session_id', sessionId)
      .order('chunk_index')

    if (error) {
      console.error('❌ Failed to get session chunks:', error)
      throw new Error(`Failed to get session chunks: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error(`No chunks found for session ${sessionId}`)
    }

    // Convert chunk_data from base64 to Buffer and sort by index
    const chunks: Buffer[] = new Array(data.length)
    for (const chunk of data) {
      chunks[chunk.chunk_index] = Buffer.from(chunk.chunk_data)
    }

    return chunks
  } catch (error) {
    console.error('❌ Chunk retrieval error:', error)
    throw error
  }
}

// Delete a session and all its chunks
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const supabase = getAdminClient()
    
    const { error } = await supabase
      .from('file_chunks')
      .delete()
      .eq('session_id', sessionId)

    if (error) {
      console.error('❌ Failed to delete session:', error)
      throw new Error(`Failed to delete session: ${error.message}`)
    }

    console.log(`🧹 Cleaned up session: ${sessionId}`)
  } catch (error) {
    console.error('❌ Session deletion error:', error)
    throw error
  }
}

// Clean up old sessions (older than 24 hours)
export async function cleanupOldSessions(): Promise<void> {
  try {
    const supabase = getAdminClient()
    
    const { error } = await supabase
      .from('file_chunks')
      .delete()
      .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('❌ Failed to cleanup old sessions:', error)
      throw new Error(`Failed to cleanup old sessions: ${error.message}`)
    }

    console.log('🧹 Cleaned up old sessions')
  } catch (error) {
    console.error('❌ Cleanup error:', error)
    throw error
  }
}
