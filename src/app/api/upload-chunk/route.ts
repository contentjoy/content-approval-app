import { NextRequest, NextResponse } from 'next/server'
import { createSession, getSession, updateSessionActivity } from '@/lib/chunk-storage'

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
    
    // Initialize or get existing session
    let session = getSession(sessionId)
    if (!session) {
      const metadata = {
        originalFileName,
        fileType,
        totalChunks,
        gymSlug,
        gymName,
        targetFolderId,
        createdAt: Date.now()
      }
      session = createSession(sessionId, metadata, totalChunks)
      console.log(`🆕 Created new upload session: ${sessionId} for ${originalFileName}`)
    }
    
    // Store the chunk
    session.chunks[chunkIndex] = chunkBuffer
    updateSessionActivity(sessionId)
    
    // Check if all chunks are received
    const receivedChunks = session.chunks.filter(chunk => chunk !== undefined).length
    const isComplete = receivedChunks === totalChunks
    
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
    
    const session = getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    const receivedChunks = session.chunks.filter(chunk => chunk !== undefined).length
    const isComplete = receivedChunks === session.metadata.totalChunks
    
    return NextResponse.json({
      sessionId,
      metadata: session.metadata,
      receivedChunks,
      totalChunks: session.metadata.totalChunks,
      isComplete,
      lastActivity: session.lastActivity
    })
    
  } catch (error) {
    console.error('❌ Session status check error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Status check failed' 
    }, { status: 500 })
  }
}
