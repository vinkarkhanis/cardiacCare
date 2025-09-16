// Chat Exchange - stores user question and AI response within conversation document
export interface ChatExchange {
  exchangeId: string            // Unique exchange ID within conversation
  exchangeNumber: number        // Order within conversation (1, 2, 3...)
  timestamp: string            // When the exchange started
  
  // User input
  userMessage: {
    content: string            // User's question/message
    timestamp: string          // When user sent the message
    messageLength: number      // Length of user message
  }
  
  // AI response
  aiResponse: {
    content: string            // AI agent's response
    timestamp: string          // When AI responded
    messageLength: number      // Length of AI response
    processingTime: number     // How long AI took to respond (ms)
    agentUsed: string         // Which AI agent provided response
    success: boolean          // Whether AI response was successful
    error?: string            // Error message if AI failed
  }
  
  // Shared metadata
  metadata?: {
    patientContext?: {
      name: string
      email: string
      mobile: string
      medicalHistory?: string[]
    }
    tags?: string[]           // Categories like 'medication', 'exercise', etc.
    summary?: string          // Brief summary of the exchange
    importance?: 'low' | 'medium' | 'high' // Clinical importance
  }
}

// Conversation metadata stored in patient_chat container
export interface ChatConversation {
  id: string                   // Cosmos DB document ID
  patientId: string           // Partition key and foreign key to patient
  conversationId: string       // Conversation identifier 
  title: string               // Auto-generated or user-set title
  startTime: string           // When conversation started
  lastMessageTime: string     // Last activity timestamp
  exchangeCount: number       // Total exchanges in conversation
  status: 'active' | 'archived' | 'completed'
  tags?: string[]             // For categorization (medication, exercise, etc.)
  summary?: string            // AI-generated summary for long conversations
  type: 'conversation'        // Document type identifier
  
  // All exchanges stored within this single document
  exchanges: ChatExchange[]   // Array of all user-AI exchanges
  
  created_at: string
  updated_at: string
}

// For creating new conversations
export interface CreateChatConversationData {
  patientId: string
  title?: string
  initialMessage?: string
}

// For saving complete exchanges (user + AI)
export interface SaveChatExchangeData {
  conversationId: string
  patientId: string
  userMessage: {
    content: string
    timestamp?: string
  }
  aiResponse: {
    content: string
    timestamp?: string
    processingTime: number
    agentUsed: string
    success: boolean
    error?: string
  }
  metadata?: ChatExchange['metadata']
}

// For retrieving conversation history
export interface ChatConversationHistory {
  conversation: ChatConversation
  exchanges: ChatExchange[]
  totalExchanges: number
  lastActivity: string
}

// API response types
export interface ChatConversationResponse {
  success: boolean
  conversation?: ChatConversation
  error?: string
}

export interface ChatExchangesResponse {
  success: boolean
  exchanges: ChatExchange[]
  totalExchanges: number
  error?: string
}

export interface ChatConversationListResponse {
  success: boolean
  conversations: ChatConversationHistory[]
  totalConversations: number
  error?: string
}

// Legacy types for backward compatibility
export interface ConversationMessage extends ChatExchange {}
export interface Conversation extends ChatConversation {}
export interface CreateConversationData extends CreateChatConversationData {}
export interface SaveMessageData extends SaveChatExchangeData {}
export interface ConversationHistory extends ChatConversationHistory {}
export interface ConversationResponse extends ChatConversationResponse {}
export interface MessagesResponse extends ChatExchangesResponse {}
export interface ConversationListResponse extends ChatConversationListResponse {}