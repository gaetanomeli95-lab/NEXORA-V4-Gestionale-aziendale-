"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  MessageSquare, 
  Edit3, 
  Eye, 
  Lock, 
  Unlock, 
  Send,
  User,
  Activity,
  Clock,
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Video,
  Phone,
  Share2,
  Download,
  Upload,
  Settings,
  Bell,
  Zap,
  CheckCircle,
  AlertTriangle,
  Package,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface ActiveUser {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'ACTIVE' | 'AWAY' | 'BUSY'
  lastSeen: string
  currentDocument?: string
  cursor?: {
    line: number
    column: number
  }
  isTyping: boolean
  color: string
}

interface Document {
  id: string
  name: string
  type: 'ORDER' | 'INVOICE' | 'CUSTOMER' | 'PRODUCT' | 'REPORT'
  version: number
  lastModified: string
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
    timestamp: string
    resolved: boolean
  }>
}

interface CollaborationEvent {
  id: string
  type: 'USER_JOINED' | 'USER_LEFT' | 'CURSOR_MOVED' | 'SELECTION_CHANGED' | 'EDIT_MADE' | 'COMMENT_ADDED' | 'TYPING_STARTED' | 'TYPING_STOPPED'
  userId: string
  userName: string
  timestamp: string
  data: any
  documentId?: string
}

export default function CollaborationPage() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [events, setEvents] = useState<CollaborationEvent[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDocumentDetails, setShowDocumentDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [newComment, setNewComment] = useState('')
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Initialize WebSocket connection
    initializeWebSocket()
    fetchCollaborationData()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const initializeWebSocket = () => {
    // Mock WebSocket connection
    setIsConnected(true)
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Simulate random events
      const eventTypes: CollaborationEvent['type'][] = ['USER_JOINED', 'USER_LEFT', 'EDIT_MADE', 'COMMENT_ADDED']
      const randomEvent: CollaborationEvent = {
        id: Math.random().toString(36),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        userId: 'user_' + Math.random().toString(36),
        userName: 'User ' + Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
        data: {}
      }
      
      setEvents(prev => [randomEvent, ...prev.slice(0, 49)])
    }, 5000)

    return () => clearInterval(interval)
  }

  const fetchCollaborationData = async () => {
    try {
      // Mock data
      const mockUsers: ActiveUser[] = [
        {
          id: '1',
          name: 'Mario Rossi',
          email: 'mario@nexora.com',
          avatar: '/avatars/mario.jpg',
          status: 'ACTIVE',
          lastSeen: new Date().toISOString(),
          currentDocument: 'doc_1',
          cursor: { line: 15, column: 32 },
          isTyping: true,
          color: '#FF6B6B'
        },
        {
          id: '2',
          name: 'Laura Bianchi',
          email: 'laura@nexora.com',
          avatar: '/avatars/laura.jpg',
          status: 'ACTIVE',
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          currentDocument: 'doc_2',
          cursor: { line: 8, column: 24 },
          isTyping: false,
          color: '#4ECDC4'
        },
        {
          id: '3',
          name: 'Paolo Verdi',
          email: 'paolo@nexora.com',
          avatar: '/avatars/paolo.jpg',
          status: 'AWAY',
          lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          currentDocument: 'doc_1',
          isTyping: false,
          color: '#45B7D1'
        }
      ]

      const mockDocuments: Document[] = [
        {
          id: 'doc_1',
          name: 'Ordine #ORD-2024-001',
          type: 'ORDER',
          version: 3,
          lastModified: new Date().toISOString(),
          modifiedBy: 'Mario Rossi',
          isLocked: false,
          collaborators: ['1', '3'],
          comments: [
            {
              id: 'c1',
              userId: '1',
              userName: 'Mario Rossi',
              content: 'Verificare disponibilità prodotti',
              position: { line: 10, column: 5 },
              timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              resolved: false
            }
          ]
        },
        {
          id: 'doc_2',
          name: 'Fattura #INV-2024-001',
          type: 'INVOICE',
          version: 1,
          lastModified: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          modifiedBy: 'Laura Bianchi',
          isLocked: true,
          lockedBy: '2',
          collaborators: ['2'],
          comments: []
        }
      ]

      setActiveUsers(mockUsers)
      setDocuments(mockDocuments)
    } catch (error) {
      console.error('Error fetching collaboration data:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Attivo', variant: 'default' as const },
      AWAY: { label: 'Assente', variant: 'secondary' as const },
      BUSY: { label: 'Occupato', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <FileText className="h-4 w-4" />
      case 'INVOICE': return <FileText className="h-4 w-4" />
      case 'CUSTOMER': return <Users className="h-4 w-4" />
      case 'PRODUCT': return <Package className="h-4 w-4" />
      case 'REPORT': return <BarChart3 className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeUsersCount = activeUsers.filter(u => u.status === 'ACTIVE').length
  const lockedDocumentsCount = documents.filter(d => d.isLocked).length
  const totalComments = documents.reduce((sum, doc) => sum + doc.comments.length, 0)

  return (
    <div className="bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Real-Time Collaboration
            </h1>
            <p className="text-gray-600">Collaborazione in tempo reale su documenti e progetti</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connesso' : 'Disconnesso'}
              </span>
            </div>
            <Button variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Inizia Video Call
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Documento
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utenti Attivi</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeUsersCount}</p>
                    <p className="text-xs text-green-600 mt-1">
                      di {activeUsers.length} totali
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documenti Aperti</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{documents.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      In collaborazione
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documenti Bloccati</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{lockedDocumentsCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      In modifica
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50">
                    <Lock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Commenti</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{totalComments}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Discussioni attive
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="users">Utenti Attivi</TabsTrigger>
            <TabsTrigger value="documents">Documenti</TabsTrigger>
            <TabsTrigger value="activity">Attività</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Utenti Attivi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback style={{ backgroundColor: user.color }}>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              user.isTyping ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.currentDocument ? 'Sto modificando...' : 'Inattivo'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(user.status)}
                          {user.isTyping && (
                            <p className="text-xs text-green-600 mt-1">Sta scrivendo...</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documenti Recenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                           onClick={() => {
                             setSelectedDocument(doc)
                             setShowDocumentDetails(true)
                           }}>
                        <div className="flex items-center space-x-3">
                          {getDocumentTypeIcon(doc.type)}
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              Modificato da {doc.modifiedBy} • {doc.collaborators.length} collaboratori
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.isLocked ? (
                            <Lock className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Unlock className="h-4 w-4 text-gray-400" />
                          )}
                          <Badge variant="outline">v{doc.version}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Attività in Tempo Reale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {event.type === 'USER_JOINED' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {event.type === 'USER_LEFT' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {event.type === 'EDIT_MADE' && <Edit3 className="h-4 w-4 text-blue-500" />}
                        {event.type === 'COMMENT_ADDED' && <MessageSquare className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{event.userName}</span>
                          {event.type === 'USER_JOINED' && ' si è unito alla sessione'}
                          {event.type === 'USER_LEFT' && ' ha lasciato la sessione'}
                          {event.type === 'EDIT_MADE' && ' ha modificato un documento'}
                          {event.type === 'COMMENT_ADDED' && ' ha aggiunto un commento'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString('it-IT')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Utenti Attivi</CardTitle>
                <CardDescription>
                  Gestisci e monitora gli utenti attivi nella piattaforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Documento Corrente</TableHead>
                      <TableHead>Ultima Attività</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback style={{ backgroundColor: user.color }}>
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                user.isTyping ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {user.currentDocument ? (
                            <Badge variant="outline">Documento attivo</Badge>
                          ) : (
                            <span className="text-sm text-gray-500">Nessuno</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.lastSeen).toLocaleTimeString('it-IT')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Dettagli
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Invia Messaggio
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Video className="h-4 w-4 mr-2" />
                                Video Call
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documenti in Collaborazione</CardTitle>
                <CardDescription>
                  Gestisci i documenti aperti per la collaborazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca documenti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedDocument(doc)
                            setShowDocumentDetails(true)
                          }}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getDocumentTypeIcon(doc.type)}
                            <CardTitle className="text-lg">{doc.name}</CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            {doc.isLocked ? (
                              <Lock className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Unlock className="h-4 w-4 text-gray-400" />
                            )}
                            <Badge variant="outline">v{doc.version}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Collaboratori:</span>
                            <span>{doc.collaborators.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Commenti:</span>
                            <span>{doc.comments.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Modificato:</span>
                            <span>{new Date(doc.lastModified).toLocaleTimeString('it-IT')}</span>
                          </div>
                          {doc.isLocked && (
                            <div className="flex items-center text-sm text-orange-600">
                              <Lock className="h-3 w-3 mr-1" />
                              Bloccato da {doc.lockedBy}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Log Attività</CardTitle>
                <CardDescription>
                  Storico completo delle attività di collaborazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {event.type === 'USER_JOINED' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {event.type === 'USER_LEFT' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {event.type === 'EDIT_MADE' && <Edit3 className="h-4 w-4 text-blue-500" />}
                        {event.type === 'COMMENT_ADDED' && <MessageSquare className="h-4 w-4 text-purple-500" />}
                        {event.type === 'TYPING_STARTED' && <Zap className="h-4 w-4 text-yellow-500" />}
                        {event.type === 'TYPING_STOPPED' && <Clock className="h-4 w-4 text-gray-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{event.userName}</span>
                          {event.type === 'USER_JOINED' && ' si è unito alla sessione'}
                          {event.type === 'USER_LEFT' && ' ha lasciato la sessione'}
                          {event.type === 'EDIT_MADE' && ' ha modificato un documento'}
                          {event.type === 'COMMENT_ADDED' && ' ha aggiunto un commento'}
                          {event.type === 'TYPING_STARTED' && ' ha iniziato a scrivere'}
                          {event.type === 'TYPING_STOPPED' && ' ha smesso di scrivere'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Details Dialog */}
        <Dialog open={showDocumentDetails} onOpenChange={setShowDocumentDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dettagli Documento</DialogTitle>
              <DialogDescription>
                Gestione collaborazione e commenti del documento
              </DialogDescription>
            </DialogHeader>
            
            {selectedDocument && (
              <div className="space-y-6">
                {/* Document Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Documento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        {getDocumentTypeIcon(selectedDocument.type)}
                        <div>
                          <h3 className="font-medium">{selectedDocument.name}</h3>
                          <p className="text-sm text-gray-500">Tipo: {selectedDocument.type}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Versione</span>
                          <span>v{selectedDocument.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Modificato da</span>
                          <span>{selectedDocument.modifiedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Ultima modifica</span>
                          <span>{new Date(selectedDocument.lastModified).toLocaleString('it-IT')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Stato</span>
                          <div className="flex items-center space-x-2">
                            {selectedDocument.isLocked ? (
                              <>
                                <Lock className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-orange-600">Bloccato</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-600">Disponibile</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Collaboratori</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedDocument.collaborators.map((collaboratorId) => {
                          const user = activeUsers.find(u => u.id === collaboratorId)
                          if (!user) return null
                          
                          return (
                            <div key={collaboratorId} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback style={{ backgroundColor: user.color }}>
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(user.status)}
                                {user.isTyping && (
                                  <div className="flex items-center text-xs text-green-600">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Scrivendo
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Commenti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedDocument.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {comment.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{comment.userName}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  Riga {comment.position.line}:{comment.position.column}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.timestamp).toLocaleString('it-IT')}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                            {comment.resolved && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Risolto
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="mt-4 space-y-3">
                      <Textarea
                        placeholder="Aggiungi un commento..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button>
                          <Send className="h-4 w-4 mr-2" />
                          Invia Commento
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

