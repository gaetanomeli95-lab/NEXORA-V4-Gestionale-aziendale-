import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { RealTimeCollaborationManager } from '@/lib/real-time-collaboration'

export const dynamic = 'force-dynamic'

const collaborationManager = RealTimeCollaborationManager.getInstance()

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'COLLABORATION_VIEW')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const events = collaborationManager.getEventHistory(documentId || undefined, limit)
    
    return ApiResponse.success(events)
  } catch (error) {
    console.error('Error fetching collaboration events:', error)
    return ApiResponse.error('Failed to fetch events', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'COLLABORATION_PARTICIPATE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const { type, data, documentId, position, selection } = body

    // Create and broadcast event
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      data,
      documentId,
      position,
      selection
    }

    // Handle different event types
    switch (type) {
      case 'USER_JOINED':
        await collaborationManager.userJoined(user.id, user.name, user.email, user.avatar || undefined)
        break
      case 'USER_LEFT':
        await collaborationManager.userLeft(user.id)
        break
      case 'CURSOR_MOVED':
        if (documentId && position) {
          await collaborationManager.updateCursor(user.id, documentId, position)
        }
        break
      case 'SELECTION_CHANGED':
        if (documentId && selection) {
          await collaborationManager.updateSelection(user.id, documentId, selection)
        }
        break
      case 'TYPING_STARTED':
        if (documentId) {
          await collaborationManager.startTyping(user.id, documentId)
        }
        break
      case 'TYPING_STOPPED':
        if (documentId) {
          await collaborationManager.stopTyping(user.id, documentId)
        }
        break
      case 'COMMENT_ADDED':
        if (documentId && data?.content && data?.position) {
          await collaborationManager.addComment(documentId, user.id, data.content, data.position)
        }
        break
      case 'EDIT_MADE':
        if (documentId && data?.edits) {
          await collaborationManager.editDocument(documentId, user.id, data.edits)
        }
        break
      default:
        return ApiResponse.error('Invalid event type', 400)
    }

    return ApiResponse.success(event)
  } catch (error) {
    console.error('Error processing collaboration event:', error)
    return ApiResponse.error('Failed to process event', 500)
  }
}
