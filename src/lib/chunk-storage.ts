// Supabase Storage-backed chunk storage for streaming uploads
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
        chunk_data: null, // Placeholder, will be updated by storeChunk
        chunk_storage_path: null, // Placeholder, will be updated by storeChunk
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

// Store a chunk in Supabase Storage
export async function storeChunk(chunkData: ChunkData): Promise<void> {
  try {
    const supabase = getAdminClient()
    
    // Generate unique filename for this chunk
    const chunkFileName = `${chunkData.session_id}_chunk_${chunkData.chunk_index}.bin`
    
    // Upload chunk to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('file-chunks')
      .upload(chunkFileName, chunkData.chunk_data, {
        contentType: 'application/octet-stream',
        upsert: true
      })

    if (storageError) {
      console.error('❌ Failed to store chunk in storage:', storageError)
      throw new Error(`Failed to store chunk in storage: ${storageError.message}`)
    }

    // Store metadata in database (without the actual chunk data)
    const { error: dbError } = await supabase
      .from('file_chunks')
      .upsert({
        session_id: chunkData.session_id,
        chunk_index: chunkData.chunk_index,
        total_chunks: chunkData.total_chunks,
        original_file_name: chunkData.original_file_name,
        file_type: chunkData.file_type,
        chunk_data: null, // No longer storing binary data in database
        chunk_storage_path: chunkFileName, // Store the storage path instead
        gym_slug: chunkData.gym_slug,
        gym_name: chunkData.gym_name,
        target_folder_id: chunkData.target_folder_id,
        last_activity: new Date().toISOString()
      }, {
        onConflict: 'session_id,chunk_index'
      })

    if (dbError) {
      console.error('❌ Failed to store chunk metadata:', dbError)
      throw new Error(`Failed to store chunk metadata: ${dbError.message}`)
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

// Get all chunks for a session from Supabase Storage
export async function getSessionChunks(sessionId: string): Promise<Buffer[]> {
  try {
    const supabase = getAdminClient()
    
    // Get chunk metadata from database
    const { data: chunkMetadata, error: dbError } = await supabase
      .from('file_chunks')
      .select('chunk_index, chunk_storage_path')
      .eq('session_id', sessionId)
      .order('chunk_index')

    if (dbError) {
      console.error('❌ Failed to get chunk metadata:', dbError)
      throw new Error(`Failed to get chunk metadata: ${dbError.message}`)
    }

    if (!chunkMetadata || chunkMetadata.length === 0) {
      throw new Error(`No chunks found for session ${sessionId}`)
    }

    // Download chunks from storage
    const chunks: Buffer[] = new Array(chunkMetadata.length)
    const downloadPromises = chunkMetadata.map(async (chunk) => {
      try {
        const { data: chunkData, error: downloadError } = await supabase.storage
          .from('file-chunks')
          .download(chunk.chunk_storage_path)

        if (downloadError) {
          throw new Error(`Failed to download chunk ${chunk.chunk_index}: ${downloadError.message}`)
        }

        if (!chunkData) {
          throw new Error(`No data returned for chunk ${chunk.chunk_index}`)
        }

        // Convert to Buffer and store in correct position
        const buffer = Buffer.from(await chunkData.arrayBuffer())
        chunks[chunk.chunk_index] = buffer
        
        console.log(`📥 Downloaded chunk ${chunk.chunk_index + 1} (${(buffer.length / (1024 * 1024)).toFixed(1)}MB)`)
        
      } catch (error) {
        console.error(`❌ Failed to download chunk ${chunk.chunk_index}:`, error)
        throw error
      }
    })

    // Wait for all chunks to download
    await Promise.all(downloadPromises)

    return chunks
  } catch (error) {
    console.error('❌ Chunk retrieval error:', error)
    throw error
  }
}

// Delete a session and all its chunks from both storage and database
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const supabase = getAdminClient()
    
    // Get chunk storage paths before deleting from database
    const { data: chunkPaths, error: fetchError } = await supabase
      .from('file_chunks')
      .select('chunk_storage_path')
      .eq('session_id', sessionId)

    if (fetchError) {
      console.error('❌ Failed to fetch chunk paths for cleanup:', fetchError)
      throw new Error(`Failed to fetch chunk paths: ${fetchError.message}`)
    }

    // Delete chunks from storage
    if (chunkPaths && chunkPaths.length > 0) {
      const storagePaths = chunkPaths.map(chunk => chunk.chunk_storage_path).filter(Boolean)
      
      if (storagePaths.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from('file-chunks')
          .remove(storagePaths)

        if (storageDeleteError) {
          console.error('❌ Failed to delete chunks from storage:', storageDeleteError)
          // Don't throw here, continue with database cleanup
        } else {
          console.log(`🗑️ Deleted ${storagePaths.length} chunks from storage`)
        }
      }
    }

    // Delete session metadata from database
    const { error: dbDeleteError } = await supabase
      .from('file_chunks')
      .delete()
      .eq('session_id', sessionId)

    if (dbDeleteError) {
      console.error('❌ Failed to delete session metadata:', dbDeleteError)
      throw new Error(`Failed to delete session metadata: ${dbDeleteError.message}`)
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
    
    // Get old session IDs and their chunk paths
    const { data: oldSessions, error: fetchError } = await supabase
      .from('file_chunks')
      .select('session_id, chunk_storage_path')
      .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (fetchError) {
      console.error('❌ Failed to fetch old sessions for cleanup:', fetchError)
      throw new Error(`Failed to fetch old sessions: ${fetchError.message}`)
    }

    if (oldSessions && oldSessions.length > 0) {
      // Group by session_id to get unique sessions
      const sessionGroups = oldSessions.reduce((acc, chunk) => {
        if (!acc[chunk.session_id]) {
          acc[chunk.session_id] = []
        }
        if (chunk.chunk_storage_path) {
          acc[chunk.session_id].push(chunk.chunk_storage_path)
        }
        return acc
      }, {} as Record<string, string[]>)

      // Delete chunks from storage
      for (const [sessionId, storagePaths] of Object.entries(sessionGroups)) {
        if (storagePaths.length > 0) {
          const { error: storageDeleteError } = await supabase.storage
            .from('file-chunks')
            .remove(storagePaths)

          if (storageDeleteError) {
            console.error(`❌ Failed to delete storage chunks for session ${sessionId}:`, storageDeleteError)
          }
        }
      }

      // Delete old sessions from database
      const { error: dbDeleteError } = await supabase
        .from('file_chunks')
        .delete()
        .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (dbDeleteError) {
        console.error('❌ Failed to cleanup old sessions from database:', dbDeleteError)
        throw new Error(`Failed to cleanup old sessions: ${dbDeleteError.message}`)
      }

      console.log(`🧹 Cleaned up ${Object.keys(sessionGroups).length} old sessions`)
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error)
    throw error
  }
}
