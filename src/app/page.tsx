'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Heart, Activity, User, Sparkles, Menu, X, BarChart3, Bell, LogOut } from 'lucide-react'
import HeartWithBeat from '@/components/HeartWithBeat'
import MessageCard from '@/components/MessageCard'
import HeartbeatLoader, { ConversationLoader } from '@/components/ui/HeartbeatLoader'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import HealthDashboard from '@/components/HealthDashboard'
import AgentPersonality from '@/components/AgentPersonality'
import ReminderSystem from '@/components/ReminderSystem'
import type { ChatConversationHistory } from '@/lib/types/conversation'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Conversation {
  id: string
  conversationId: string
  title: string
  lastMessageTime: string
  messageCount: number
  status: 'active' | 'archived' | 'completed'
}

type ViewType = 'chat' | 'dashboard' | 'reminders'

function MainApp() {
  const { user, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello ${user?.first_name}! I'm your cardiac health assistant. I'm here to help you manage your heart health, answer questions about your medications, and provide support whenever you need it. How are you feeling today?`,
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChatConversationHistory[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load user's conversation history
  const loadUserConversations = useCallback(async () => {
    if (!user?.patientId) return
    
    setIsLoadingConversations(true)
    try {
      console.log('🔄 Loading conversations from patient_chat for patient:', user.patientId)
      const response = await fetch(`/api/conversations?patientId=${user.patientId}&limit=20`)
      const data = await response.json()
      
      if (data.success && data.conversations) {
        setConversations(data.conversations)
        console.log('✅ Loaded', data.conversations.length, 'conversations from patient_chat')
      } else {
        console.log('ℹ️ No conversations found in patient_chat or failed to load:', data.error)
      }
    } catch (error) {
      console.error('❌ Error loading conversations from patient_chat:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [user?.patientId])

  // Load conversations when user is available
  useEffect(() => {
    if (user?.patientId) {
      loadUserConversations()
    }
  }, [user?.patientId, loadUserConversations])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load specific conversation history
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user?.patientId) return
    
    setIsLoadingConversation(true)
    try {
      console.log('🔄 Loading conversation:', conversationId)
      const response = await fetch(`/api/conversations/${conversationId}?patientId=${user.patientId}`)
      const data = await response.json()
      
      if (data.success && data.messages) {
        // Convert message timestamps to Date objects
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp)
        }))
        
        setMessages(loadedMessages)
        setCurrentConversationId(conversationId)
        console.log('✅ Loaded conversation with', loadedMessages.length, 'messages')
      } else {
        console.error('❌ Failed to load conversation:', data.error)
      }
    } catch (error) {
      console.error('❌ Error loading conversation:', error)
    } finally {
      setIsLoadingConversation(false)
    }
  }, [user?.patientId])

  // Auto-load most recent conversation when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && messages.length <= 1) {
      const mostRecentConversation = conversations[0]
      // ChatConversationHistory has conversation nested
      const conversationId = mostRecentConversation.conversation.conversationId
      if (conversationId) {
        console.log('🔄 Auto-loading most recent conversation:', conversationId)
        loadConversation(conversationId)
      }
    }
  }, [conversations, currentConversationId, messages.length, loadConversation])

  // Start new conversation
  const startNewConversation = () => {
    setMessages([
      {
        id: '1',
        content: `Hello ${user?.first_name}! I'm your cardiac health assistant. I'm here to help you manage your heart health, answer questions about your medications, and provide support whenever you need it. How are you feeling today?`,
        role: 'assistant',
        timestamp: new Date()
      }
    ])
    setCurrentConversationId(null)
    console.log('🆕 Started new conversation')
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Send message to the actual cardiac care agent
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: currentConversationId, // Include current conversation ID
          patientContext: {
            patientId: user?.patientId,
            name: `${user?.first_name} ${user?.last_name}`,
            email: user?.email,
            mobile: user?.mobile_number,
            medicalHistory: user?.patient_problems ? [user.patient_problems] : undefined
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Update conversation ID if returned from API
        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId)
          console.log('✅ New conversation ID received:', data.conversationId)
          // Refresh conversations list to show new conversation
          loadUserConversations()
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get agent response')
      }
    } catch (error) {
      console.error('Error sending message to cardiac agent:', error)
      
      // Fallback message if the agent is unavailable
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, ${user?.first_name}, but I'm currently experiencing some technical difficulties. Please try again in a moment, or contact your healthcare provider if you have urgent concerns.`,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
  }

  const navigationItems = [
    { id: 'chat', label: 'Chat', icon: <HeartWithBeat size="sm" heartColor="text-current" beatColor="text-red-500" showBeat={true} /> },
    { id: 'dashboard', label: 'Health Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'reminders', label: 'Reminders', icon: <Bell className="w-5 h-5" /> }
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-medical-50 via-white to-healing-50">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed lg:relative lg:translate-x-0 w-80 h-full bg-white/90 backdrop-blur-sm border-r border-calm-200 shadow-lg z-40 lg:z-auto"
      >
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6">
            <AgentPersonality mood="caring" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Welcome back!</h2>
              <p className="text-sm text-gray-600">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-medical-600 font-mono">{user?.patientId}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mb-6">
            {navigationItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentView(item.id as ViewType)
                  setSidebarOpen(false)
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                  currentView === item.id
                    ? "bg-gradient-to-r from-medical-500 to-accent-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-medical-50"
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Conversation History */}
          {currentView === 'chat' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Recent Conversations</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startNewConversation}
                  className="text-xs text-medical-600 hover:text-medical-700 font-medium"
                >
                  + New Chat
                </motion.button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="py-4">
                    <HeartbeatLoader 
                      message="Loading conversations..." 
                      size="sm" 
                      className="py-2"
                    />
                  </div>
                ) : conversations.length > 0 ? (
                  conversations.slice(0, 5).map((convHistory) => {
                    // ChatConversationHistory has conversation nested
                    const conv = convHistory.conversation
                    const conversationId = conv.conversationId
                    const totalExchanges = convHistory.totalExchanges || 0
                    
                    return (
                      <motion.button
                        key={conversationId}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadConversation(conversationId)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg border transition-all duration-200 text-xs",
                          currentConversationId === conversationId
                            ? "bg-medical-100 border-medical-300 text-medical-700"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                        )}
                      >
                        <div className="font-medium truncate">{conv.title}</div>
                        <div className="text-gray-500 text-xs">
                          {totalExchanges} exchanges • {new Date(conv.lastMessageTime).toLocaleDateString()}
                        </div>
                      </motion.button>
                    )
                  })
                ) : (
                  <div className="text-xs text-gray-500 py-2">No conversations yet</div>
                )}
              </div>
              
              {conversations.length > 5 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full text-xs text-center text-medical-600 hover:text-medical-700 py-1"
                >
                  View all {conversations.length} conversations
                </motion.button>
              )}
            </div>
          )}

          {/* Patient Info Card */}
          <div className="p-4 bg-gradient-to-br from-healing-50 to-medical-50 rounded-xl border border-healing-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Profile</h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-600">Age:</span>
                <span className="ml-2 font-medium">{user?.age} years</span>
              </div>
              <div>
                <span className="text-gray-600">Conditions:</span>
                <p className="text-gray-800 text-xs mt-1 leading-relaxed">{user?.patient_problems}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 p-4 bg-gradient-to-br from-medical-50 to-accent-50 rounded-xl border border-medical-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Today&apos;s Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Heart Rate</span>
                <span className="text-sm font-medium text-healing-600">72 bpm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Medications</span>
                <span className="text-sm font-medium text-medical-600">2/3 taken</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Activity</span>
                <span className="text-sm font-medium text-accent-600">45 min</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm border-b border-calm-200 px-6 py-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-medical-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentView === 'chat' && 'Chat with your assistant'}
                  {currentView === 'dashboard' && 'Health Dashboard'}
                  {currentView === 'reminders' && 'Your Reminders'}
                </h1>
                <p className="text-sm text-gray-600 flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  {currentView === 'chat' && 'Always here for your heart health'}
                  {currentView === 'dashboard' && 'Monitor your health metrics'}
                  {currentView === 'reminders' && 'Stay on top of your care'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-healing-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
              
              {/* User Profile with Logout */}
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-medical-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-medical-500 to-accent-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.first_name}</p>
                    <p className="text-xs text-gray-500">{user?.patientId}</p>
                  </div>
                </motion.button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                    <p className="text-sm text-gray-500 font-mono">{user?.patientId}</p>
                    <p className="text-xs text-blue-600 mt-1">{user?.email}</p>
                    <p className="text-xs text-green-600">{user?.mobile_number}</p>
                    <p className="text-xs text-medical-600 mt-1">{user?.patient_problems}</p>
                  </div>
                  <div className="p-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Messages */}
                                {/* Messages */}
              <div className="flex-1 overflow-y-auto chat-scrollbar px-6 py-4 space-y-6" role="log" aria-live="polite" aria-label="Conversation with cardiac health assistant">
                {isLoadingConversation ? (
                  <div className="flex items-center justify-center h-full">
                    <ConversationLoader />
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <MessageCard 
                        key={message.id} 
                        message={message}
                        isLatest={index === messages.length - 1}
                      />
                    ))}
                  </AnimatePresence>
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex justify-start"
                    >
                      <div className="flex max-w-xs lg:max-w-md xl:max-w-2xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-medical-500 rounded-full flex items-center justify-center mr-3 shadow-sm">
                          <HeartWithBeat size="sm" heartColor="text-white" beatColor="text-red-400" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Cardiac Care Assistant</span>
                              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                            </div>
                          </div>
                          <div className="px-4 py-3">
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <HeartbeatLoader 
                                message="Analyzing your question..." 
                                size="sm" 
                                className="py-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 backdrop-blur-sm border-t border-calm-200 p-6"
              >
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share how you're feeling or ask me anything..."
                      className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200 max-h-32"
                      rows={1}
                      aria-label="Type your message to the cardiac health assistant"
                      aria-describedby="input-help"
                      style={{
                        minHeight: '48px',
                        height: 'auto'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = target.scrollHeight + 'px'
                      }}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center space-x-1">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    aria-label="Send message to cardiac health assistant"
                    className="bg-gradient-to-r from-accent-500 to-medical-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2"
                  >
                    <Send className="w-5 h-5" aria-hidden="true" />
                  </motion.button>
                </div>
                
                {/* Quick suggestions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "How do I take my medications?",
                    "I'm feeling anxious about my heart",
                    "Track my daily symptoms",
                    "Emergency contact information"
                  ].map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-3 py-2 text-sm bg-calm-50 text-calm-700 rounded-full hover:bg-calm-100 transition-colors duration-200 border border-calm-200"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {currentView === 'dashboard' && (
            <div className="h-full overflow-y-auto">
              <HealthDashboard />
            </div>
          )}

          {currentView === 'reminders' && (
            <div className="h-full overflow-y-auto p-6">
              <ReminderSystem />
            </div>
          )}
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                  <p className="text-sm text-gray-600">Are you sure you want to logout?</p>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  You&apos;ll need to log back in with your User ID: 
                  <span className="font-mono font-medium text-medical-600 ml-1">{user?.patientId}</span>
                </p>
              </div>
              
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  )
}