export interface CollaborationEvent {
  id: string
  type: 'USER_JOINED' | 'USER_LEFT' | 'CURSOR_MOVED' | 'SELECTION_CHANGED' | 'EDIT_MADE' | 'COMMENT_ADDED' | 'TYPING_STARTED' | 'TYPING_STOPPED' | 'DOCUMENT_UPDATED'
  userId: string
  userName: string
  userAvatar?: string
  timestamp: Date
  data: any
  documentId?: string
  position?: {
    line: number
    column: number
  }
  selection?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface ActiveUser {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'ACTIVE' | 'AWAY' | 'BUSY'
  lastSeen: Date
  currentDocument?: string
  cursor?: {
    line: number
    column: number
  }
  isTyping: boolean
  color: string
}

export interface Document {
  id: string
  name: string
  type: 'ORDER' | 'INVOICE' | 'CUSTOMER' | 'PRODUCT' | 'REPORT'
  content: any
  version: number
  lastModified: Date
  modifiedBy: string
  isLocked: boolean
  lockedBy?: string
  collaborators: string[]
  comments: Array<{
    id: string
    userId: string
    userName: string
    content: string
    position: { line: number; column: number }
    timestamp: Date
    resolved: boolean
  }>
}

export class RealTimeCollaborationManager {
  private static instance: RealTimeCollaborationManager
  private activeUsers: Map<string, ActiveUser> = new Map()
  private documents: Map<string, Document> = new Map()
  private eventHistory: Map<string, CollaborationEvent[]> = new Map()
  private webSocketConnections: Map<string, WebSocket> = new Map()
  private typingIndicators: Map<string, Set<string>> = new Map()

  static getInstance(): RealTimeCollaborationManager {
    if (!RealTimeCollaborationManager.instance) {
      RealTimeCollaborationManager.instance = new RealTimeCollaborationManager()
    }
    return RealTimeCollaborationManager.instance
  }

  // User Management
  async userJoined(userId: string, userName: string, userEmail: string, userAvatar?: string): Promise<ActiveUser> {
    const user: ActiveUser = {
      id: userId,
      name: userName,
      email: userEmail,
      avatar: userAvatar,
      status: 'ACTIVE',
      lastSeen: new Date(),
      isTyping: false,
      color: this.generateUserColor(userId)
    }

    this.activeUsers.set(userId, user)

    // Broadcast user joined event
    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'USER_JOINED',
      userId,
      userName,
      userAvatar,
      timestamp: new Date(),
      data: { user }
    }

    this.broadcastEvent(event)
    this.addEventToHistory(event)

    return user
  }

  async userLeft(userId: string): Promise<void> {
    const user = this.activeUsers.get(userId)
    if (!user) return

    // Clear typing indicator
    this.clearTypingIndicator(userId)

    // Broadcast user left event
    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'USER_LEFT',
      userId,
      userName: user.name,
      timestamp: new Date(),
      data: { user }
    }

    this.activeUsers.delete(userId)
    this.broadcastEvent(event)
    this.addEventToHistory(event)
  }

  async updateUserStatus(userId: string, status: ActiveUser['status']): Promise<void> {
    const user = this.activeUsers.get(userId)
    if (!user) return

    user.status = status
    user.lastSeen = new Date()

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'SELECTION_CHANGED',
      userId,
      userName: user.name,
      timestamp: new Date(),
      data: { status }
    }

    this.broadcastEvent(event)
  }

  // Document Collaboration
  async openDocument(documentId: string, userId: string): Promise<Document> {
    let document = this.documents.get(documentId)
    
    if (!document) {
      // Create new document
      document = {
        id: documentId,
        name: `Document ${documentId}`,
        type: 'ORDER',
        content: {},
        version: 1,
        lastModified: new Date(),
        modifiedBy: userId,
        isLocked: false,
        collaborators: [userId],
        comments: []
      }
      this.documents.set(documentId, document)
    } else {
      // Add user to collaborators if not already present
      if (!document.collaborators.includes(userId)) {
        document.collaborators.push(userId)
      }
    }

    // Update user's current document
    const user = this.activeUsers.get(userId)
    if (user) {
      user.currentDocument = documentId
    }

    return document
  }

  async closeDocument(documentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId)
    if (document) {
      document.collaborators = document.collaborators.filter(id => id !== userId)
    }

    const user = this.activeUsers.get(userId)
    if (user) {
      user.currentDocument = undefined
      user.cursor = undefined
    }
  }

  async lockDocument(documentId: string, userId: string): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    if (document.isLocked && document.lockedBy !== userId) {
      return false // Document is locked by another user
    }

    document.isLocked = true
    document.lockedBy = userId

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'DOCUMENT_UPDATED',
      userId,
      userName: this.activeUsers.get(userId)?.name || 'Unknown',
      timestamp: new Date(),
      documentId,
      data: { action: 'LOCKED', lockedBy: userId }
    }

    this.broadcastEvent(event)
    return true
  }

  async unlockDocument(documentId: string, userId: string): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    if (document.isLocked && document.lockedBy !== userId) {
      return false // Cannot unlock if not locked by this user
    }

    document.isLocked = false
    document.lockedBy = undefined

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'DOCUMENT_UPDATED',
      userId,
      userName: this.activeUsers.get(userId)?.name || 'Unknown',
      timestamp: new Date(),
      documentId,
      data: { action: 'UNLOCKED' }
    }

    this.broadcastEvent(event)
    return true
  }

  // Cursor and Selection Tracking
  async updateCursor(userId: string, documentId: string, position: { line: number; column: number }): Promise<void> {
    const user = this.activeUsers.get(userId)
    if (!user) return

    user.cursor = position

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'CURSOR_MOVED',
      userId,
      userName: user.name,
      timestamp: new Date(),
      documentId,
      position,
      data: { position }
    }

    this.broadcastEvent(event)
  }

  async updateSelection(userId: string, documentId: string, selection: { start: { line: number; column: number }; end: { line: number; column: number } }): Promise<void> {
    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'SELECTION_CHANGED',
      userId,
      userName: this.activeUsers.get(userId)?.name || 'Unknown',
      timestamp: new Date(),
      documentId,
      selection,
      data: { selection }
    }

    this.broadcastEvent(event)
  }

  // Typing Indicators
  async startTyping(userId: string, documentId: string): Promise<void> {
    const user = this.activeUsers.get(userId)
    if (!user) return

    user.isTyping = true

    // Add to typing indicators for this document
    if (!this.typingIndicators.has(documentId)) {
      this.typingIndicators.set(documentId, new Set())
    }
    this.typingIndicators.get(documentId)!.add(userId)

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'TYPING_STARTED',
      userId,
      userName: user.name,
      timestamp: new Date(),
      documentId,
      data: {}
    }

    this.broadcastEvent(event)
  }

  async stopTyping(userId: string, documentId: string): Promise<void> {
    const user = this.activeUsers.get(userId)
    if (!user) return

    user.isTyping = false
    this.clearTypingIndicator(userId)

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'TYPING_STOPPED',
      userId,
      userName: user.name,
      timestamp: new Date(),
      documentId,
      data: {}
    }

    this.broadcastEvent(event)
  }

  private clearTypingIndicator(userId: string): void {
    for (const [, typingUsers] of Array.from(this.typingIndicators.entries())) {
      typingUsers.delete(userId)
    }
  }

  // Comments and Annotations
  async addComment(documentId: string, userId: string, content: string, position: { line: number; column: number }): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) return

    const comment = {
      id: this.generateEventId(),
      userId,
      userName: this.activeUsers.get(userId)?.name || 'Unknown',
      content,
      position,
      timestamp: new Date(),
      resolved: false
    }

    document.comments.push(comment)

    const event: CollaborationEvent = {
      id: comment.id,
      type: 'COMMENT_ADDED',
      userId,
      userName: comment.userName,
      timestamp: comment.timestamp,
      documentId,
      data: { comment }
    }

    this.broadcastEvent(event)
    this.addEventToHistory(event)
  }

  async resolveComment(documentId: string, commentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) return

    const comment = document.comments.find(c => c.id === commentId)
    if (!comment) return

    comment.resolved = true

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'DOCUMENT_UPDATED',
      userId,
      userName: this.activeUsers.get(userId)?.name || 'Unknown',
      timestamp: new Date(),
      documentId,
      data: { action: 'COMMENT_RESOLVED', commentId }
    }

    this.broadcastEvent(event)
  }

  // Document Editing
  async editDocument(documentId: string, userId: string, edits: Array<{ type: string; position: { line: number; column: number }; content: string }>): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    // Check if document is locked by another user
    if (document.isLocked && document.lockedBy !== userId) {
      return false
    }

    // Apply edits (simplified - in production, use operational transformation)
    for (const edit of edits) {
      // Apply edit logic here
      if (
        typeof document.content === 'object' &&
        document.content !== null &&
        typeof edit.content === 'object' &&
        edit.content !== null
      ) {
        document.content = {
          ...(document.content as Record<string, unknown>),
          ...(edit.content as Record<string, unknown>)
        }
      } else {
        document.content = edit.content
      }
    }

    document.version++
    document.lastModified = new Date()
    document.modifiedBy = userId

    const event: CollaborationEvent = {
      id: this.generateEventId(),
      type: 'EDIT_MADE',
      userId,
      userName: this.activeUsers.get(userId)?.name || 'Unknown',
      timestamp: new Date(),
      documentId,
      data: { edits, version: document.version }
    }

    this.broadcastEvent(event)
    this.addEventToHistory(event)
    return true
  }

  // WebSocket Management
  async connectWebSocket(userId: string, ws: WebSocket): Promise<void> {
    this.webSocketConnections.set(userId, ws)

    ws.onclose = () => {
      this.webSocketConnections.delete(userId)
      this.userLeft(userId)
    }

    ws.onerror = (error) => {
      console.error(`WebSocket error for user ${userId}:`, error)
    }

    // Send initial state
    this.sendInitialState(userId, ws)
  }

  private sendInitialState(userId: string, ws: WebSocket): void {
    const user = this.activeUsers.get(userId)
    if (!user) return

    const initialState = {
      type: 'INITIAL_STATE',
      data: {
        activeUsers: Array.from(this.activeUsers.values()),
        documents: Array.from(this.documents.values()),
        typingIndicators: Object.fromEntries(this.typingIndicators)
      }
    }

    ws.send(JSON.stringify(initialState))
  }

  private broadcastEvent(event: CollaborationEvent): void {
    const message = JSON.stringify(event)

    for (const [userId, ws] of Array.from(this.webSocketConnections.entries())) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message)
        } catch (error) {
          console.error(`Error sending message to user ${userId}:`, error)
        }
      }
    }
  }

  // Query Methods
  getActiveUsers(): ActiveUser[] {
    return Array.from(this.activeUsers.values())
  }

  getDocumentCollaborators(documentId: string): ActiveUser[] {
    const document = this.documents.get(documentId)
    if (!document) return []

    return document.collaborators
      .map(userId => this.activeUsers.get(userId))
      .filter((user): user is ActiveUser => user !== undefined)
  }

  getTypingUsers(documentId: string): ActiveUser[] {
    const typingUserIds = this.typingIndicators.get(documentId)
    if (!typingUserIds) return []

    return Array.from(typingUserIds)
      .map(userId => this.activeUsers.get(userId))
      .filter((user): user is ActiveUser => user !== undefined)
  }

  getDocumentComments(documentId: string): Document['comments'] {
    const document = this.documents.get(documentId)
    return document?.comments || []
  }

  getEventHistory(documentId?: string, limit: number = 50): CollaborationEvent[] {
    if (documentId) {
      const history = this.eventHistory.get(documentId) || []
      return history.slice(-limit)
    }

    // Get all events across documents
    const allEvents: CollaborationEvent[] = []
    for (const events of Array.from(this.eventHistory.values())) {
      allEvents.push(...events)
    }

    return allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Utility Methods
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ]
    
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  private addEventToHistory(event: CollaborationEvent): void {
    const documentId = event.documentId || 'global'
    
    if (!this.eventHistory.has(documentId)) {
      this.eventHistory.set(documentId, [])
    }
    
    const history = this.eventHistory.get(documentId)!
    history.push(event)
    
    // Keep only last 100 events per document
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Remove inactive users (no activity for 30 minutes)
    const now = new Date()
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutes

    for (const [userId, user] of Array.from(this.activeUsers.entries())) {
      if (now.getTime() - user.lastSeen.getTime() > inactiveThreshold) {
        await this.userLeft(userId)
      }
    }
  }

  // Analytics
  getCollaborationStats(): {
    totalActiveUsers: number
    totalDocuments: number
    totalComments: number
    averageCollaboratorsPerDocument: number
    mostActiveDocument?: string
  } {
    const totalActiveUsers = this.activeUsers.size
    const totalDocuments = this.documents.size
    const totalComments = Array.from(this.documents.values())
      .reduce((sum, doc) => sum + doc.comments.length, 0)
    
    const averageCollaboratorsPerDocument = totalDocuments > 0
      ? Array.from(this.documents.values())
          .reduce((sum, doc) => sum + doc.collaborators.length, 0) / totalDocuments
      : 0

    const mostActiveDocument = Array.from(this.documents.values())
      .sort((a, b) => b.collaborators.length - a.collaborators.length)[0]?.id

    return {
      totalActiveUsers,
      totalDocuments,
      totalComments,
      averageCollaboratorsPerDocument,
      mostActiveDocument
    }
  }
}
