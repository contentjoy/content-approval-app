import { NextRequest, NextResponse } from 'next/server'
import { storeChunk, getSession } from '@/lib/chunk-storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const originalFileName = formData.get('originalFileName') as string
    const fileType = formData.get('fileType') as string
    const gymSlug = formData.get('gymSlug') as string
    const gymName = formData.get('gymName') as string
    const targetFolderId = formData.get('targetFolderId') as string
    
    if (!sessionId || isNaN(chunkIndex) || isNaN(totalChunks) || !originalFileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Get the chunk file
    const chunkFile = formData.get('chunk') as File
    if (!chunkFile) {
      return NextResponse.json({ error: 'No chunk file provided' }, { status: 400 })
    }
    
    // Convert chunk to buffer
    const chunkBuffer = Buffer.from(await chunkFile.arrayBuffer())
    
    console.log(`📦 Received chunk ${chunkIndex + 1}/${totalChunks} for ${originalFileName} (${(chunkBuffer.length / (1024 * 1024)).toFixed(1)}MB)`)
    
    // Store the chunk in the database
    await storeChunk({
      session_id: sessionId,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      original_file_name: originalFileName,
      file_type: fileType,
      chunk_data: chunkBuffer,
      gym_slug: gymSlug || '',
      gym_name: gymName || '',
      target_folder_id: targetFolderId
    })
    
    // Check session status
    const session = await getSession(sessionId)
    const isComplete = session?.is_complete || false
    const receivedChunks = session?.received_chunks || 0
    
    console.log(`📊 Session ${sessionId}: ${receivedChunks}/${totalChunks} chunks received`)
    
    if (isComplete) {
      console.log(`✅ All chunks received for session ${sessionId}, ready for reconstruction`)
    }
    
    return NextResponse.json({
      success: true,
      sessionId,
      chunkIndex,
      receivedChunks,
      totalChunks,
      isComplete,
      message: `Chunk ${chunkIndex + 1} uploaded successfully`
    })
    
  } catch (error) {
    console.error('❌ Chunk upload error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Chunk upload failed' 
    }, { status: 500 })
  }
}

// GET endpoint to check session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      sessionId: session.session_id,
      metadata: {
        originalFileName: session.original_file_name,
        fileType: session.file_type,
        totalChunks: session.total_chunks,
        gymSlug: session.gym_slug,
        gymName: session.gym_name,
        targetFolderId: session.target_folder_id,
        createdAt: session.created_at
      },
      receivedChunks: session.received_chunks,
      totalChunks: session.total_chunks,
      isComplete: session.is_complete,
      lastActivity: session.last_activity
    })
    
  } catch (error) {
    console.error('❌ Session status check error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Status check failed' 
    }, { status: 500 })
  }
}
