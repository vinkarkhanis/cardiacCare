import { getChatDatabase } from './chat'
import { 
  ChatConversation, 
  ChatExchange, 
  CreateChatConversationData, 
  SaveChatExchangeData,
  ChatConversationResponse,
  ChatExchangesResponse,
  ChatConversationListResponse,
  ChatConversationHistory
} from '../types/conversation'

// Generate unique conversation ID
export function generateConversationId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `CONV-${timestamp}-${random.toUpperCase()}`
}

// Generate unique exchange ID
export function generateExchangeId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6)
  return `EXC-${timestamp}-${random.toUpperCase()}`
}

// Auto-generate conversation title from first message
function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50
  let title = firstMessage.trim()
  
  // Remove common chat prefixes
  title = title.replace(/^(hi|hello|hey|good morning|good afternoon|good evening)[,\s]*/i, '')
  
  // Truncate and add ellipsis if needed
  if (title.length > maxLength) {
    title = title.substring(0, maxLength).trim()
    // Find last complete word
    const lastSpace = title.lastIndexOf(' ')
    if (lastSpace > 20) {
      title = title.substring(0, lastSpace)
    }
    title += '...'
  }
  
  return title || 'New Conversation'
}

/**
 * Create a new conversation in patient_chat container
 */
export async function createChatConversation(data: CreateChatConversationData): Promise<ChatConversationResponse> {
  try {
    console.log('Creating new chat conversation for patient:', data.patientId)
    const { chatContainer } = await getChatDatabase()
    
    const conversationId = generateConversationId()
    const now = new Date().toISOString()
    
    const conversation: ChatConversation = {
      id: conversationId,
      patientId: data.patientId, // Partition key
      conversationId,
      title: data.title || generateConversationTitle(data.initialMessage || 'New Conversation'),
      startTime: now,
      lastMessageTime: now,
      exchangeCount: 0,
      status: 'active',
      tags: [],
      type: 'conversation',
      exchanges: [], // Initialize empty exchanges array
      created_at: now,
      updated_at: now
    }
    
    console.log('Creating conversation document in patient_chat:', {
      id: conversation.id,
      patientId: conversation.patientId,
      title: conversation.title
    })
    
    const result = await chatContainer.items.create(conversation)
    console.log('Chat conversation created successfully:', result.resource?.conversationId)
    
    return {
      success: true,
      conversation: result.resource as ChatConversation
    }
    
  } catch (error: any) {
    console.error('Error creating chat conversation:', error)
    return {
      success: false,
      error: error.message || 'Failed to create conversation'
    }
  }
}

/**
 * Save a complete exchange (user question + AI response) to conversation document
 */
export async function saveChatExchange(data: SaveChatExchangeData): Promise<ChatConversationResponse> {
  try {
    console.log('Saving complete chat exchange to conversation document:', {
      conversationId: data.conversationId,
      patientId: data.patientId,
      userMessageLength: data.userMessage.content.length,
      aiResponseLength: data.aiResponse.content.length
    })
    
    const { chatContainer } = await getChatDatabase()
    const now = new Date().toISOString()
    
    // Get the existing conversation document
    const conversationQuery = {
      query: `
        SELECT * FROM c 
        WHERE c.patientId = @patientId 
        AND c.conversationId = @conversationId 
        AND c.type = "conversation"
      `,
      parameters: [
        { name: '@patientId', value: data.patientId },
        { name: '@conversationId', value: data.conversationId }
      ]
    }
    
    const { resources: conversations } = await chatContainer.items.query<ChatConversation>(conversationQuery).fetchAll()
    
    if (conversations.length === 0) {
      return {
        success: false,
        error: 'Conversation not found'
      }
    }
    
    const conversation = conversations[0]
    const exchangeId = generateExchangeId()
    const exchangeNumber = (conversation.exchanges?.length || 0) + 1
    
    // Create the new exchange
    const newExchange: ChatExchange = {
      exchangeId,
      exchangeNumber,
      timestamp: data.userMessage.timestamp || now,
      
      // User input
      userMessage: {
        content: data.userMessage.content,
        timestamp: data.userMessage.timestamp || now,
        messageLength: data.userMessage.content.length
      },
      
      // AI response
      aiResponse: {
        content: data.aiResponse.content,
        timestamp: data.aiResponse.timestamp || now,
        messageLength: data.aiResponse.content.length,
        processingTime: data.aiResponse.processingTime,
        agentUsed: data.aiResponse.agentUsed,
        success: data.aiResponse.success,
        error: data.aiResponse.error
      },
      
      // Metadata
      metadata: data.metadata
    }
    
    console.log('Adding exchange to conversation document:', {
      exchangeId: newExchange.exchangeId,
      exchangeNumber: newExchange.exchangeNumber,
      userMessageLength: newExchange.userMessage.messageLength,
      aiResponseLength: newExchange.aiResponse.messageLength,
      processingTime: newExchange.aiResponse.processingTime
    })
    
    // Update the conversation document with the new exchange
    const updatedConversation: ChatConversation = {
      ...conversation,
      lastMessageTime: newExchange.aiResponse.timestamp,
      exchangeCount: exchangeNumber,
      exchanges: [...(conversation.exchanges || []), newExchange],
      updated_at: now
    }
    
    // Replace the entire conversation document
    await chatContainer.item(conversation.id, data.patientId).replace(updatedConversation)
    console.log('Conversation document updated with new exchange:', exchangeId)
    
    return {
      success: true
    }
    
  } catch (error: any) {
    console.error('Error saving chat exchange:', error)
    return {
      success: false,
      error: error.message || 'Failed to save exchange'
    }
  }
}

/**
 * Get exchanges for a specific conversation (now from embedded array)
 */
export async function getChatConversationExchanges(
  conversationId: string,
  patientId: string,
  limit: number = 100,
  offset: number = 0
): Promise<ChatExchangesResponse> {
  try {
    console.log(`Getting chat exchanges for conversation: ${conversationId} (limit: ${limit}, offset: ${offset})`)
    const { chatContainer } = await getChatDatabase()
    
    const querySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.patientId = @patientId
        AND c.conversationId = @conversationId 
        AND c.type = "conversation"
      `,
      parameters: [
        { name: '@patientId', value: patientId },
        { name: '@conversationId', value: conversationId }
      ]
    }
    
    const { resources: conversations } = await chatContainer.items.query<ChatConversation>(querySpec).fetchAll()
    
    if (conversations.length === 0) {
      return {
        success: false,
        exchanges: [],
        totalExchanges: 0,
        error: 'Conversation not found'
      }
    }
    
    const conversation = conversations[0]
    const allExchanges = conversation.exchanges || []
    
    // Apply pagination to the exchanges array
    const paginatedExchanges = allExchanges.slice(offset, offset + limit)
    
    console.log(`Found ${paginatedExchanges.length} chat exchanges for conversation ${conversationId} (total: ${allExchanges.length})`)
    
    return {
      success: true,
      exchanges: paginatedExchanges,
      totalExchanges: allExchanges.length
    }
    
  } catch (error: any) {
    console.error('Error getting chat conversation exchanges:', error)
    return {
      success: false,
      exchanges: [],
      totalExchanges: 0,
      error: error.message || 'Failed to get exchanges'
    }
  }
}

/**
 * Get full conversation history from patient_chat container  
 */
export async function getChatConversationHistory(
  conversationId: string,
  patientId: string
): Promise<{ success: boolean; history?: ChatConversationHistory; error?: string }> {
  try {
    console.log(`Getting full chat history for conversation: ${conversationId}`)
    const { chatContainer } = await getChatDatabase()
    
    // Get conversation details
    const conversationQuery = {
      query: `
        SELECT * FROM c 
        WHERE c.patientId = @patientId 
        AND c.conversationId = @conversationId 
        AND c.type = "conversation"
      `,
      parameters: [
        { name: '@patientId', value: patientId },
        { name: '@conversationId', value: conversationId }
      ]
    }
    
    const { resources: conversations } = await chatContainer.items.query<ChatConversation>(conversationQuery).fetchAll()
    
    if (conversations.length === 0) {
      return {
        success: false,
        error: 'Conversation not found'
      }
    }
    
    const conversation = conversations[0]
    
    // Get all exchanges for this conversation
    const exchangesResponse = await getChatConversationExchanges(conversationId, patientId, 1000) // Get up to 1000 exchanges
    
    if (!exchangesResponse.success) {
      return {
        success: false,
        error: exchangesResponse.error
      }
    }
    
    const history: ChatConversationHistory = {
      conversation,
      exchanges: exchangesResponse.exchanges || [],
      totalExchanges: exchangesResponse.totalExchanges || 0,
      lastActivity: conversation.lastMessageTime
    }
    
    console.log(`Retrieved chat conversation history: ${history.totalExchanges} exchanges`)
    
    return {
      success: true,
      history
    }
    
  } catch (error: any) {
    console.error('Error getting chat conversation history:', error)
    return {
      success: false,
      error: error.message || 'Failed to get conversation history'
    }
  }
}

/**
 * Get patient conversation list with summaries from patient_chat container
 */
export async function getPatientChatConversations(patientId: string): Promise<ChatConversationListResponse> {
  try {
    console.log('Getting patient chat conversations for:', patientId)
    const { chatContainer } = await getChatDatabase()
    
    // Get conversation metadata
    const conversationQuery = {
      query: `
        SELECT * FROM c 
        WHERE c.patientId = @patientId 
        AND c.type = "conversation"
        ORDER BY c.lastMessageTime DESC
      `,
      parameters: [
        { name: '@patientId', value: patientId }
      ]
    }
    
    const { resources: conversations } = await chatContainer.items.query<ChatConversation>(conversationQuery).fetchAll()
    console.log(`Found ${conversations.length} conversations for patient:`, patientId)
    
    // Get conversation history for each conversation
    const conversationHistories: ChatConversationHistory[] = []
    
    for (const conversation of conversations) {
      const historyResponse = await getChatConversationHistory(conversation.conversationId, patientId)
      
      if (historyResponse.success && historyResponse.history) {
        conversationHistories.push(historyResponse.history)
      } else {
        // Include conversation even if we can't get full history
        const fallbackHistory: ChatConversationHistory = {
          conversation,
          exchanges: [],
          totalExchanges: 0,
          lastActivity: conversation.lastMessageTime
        }
        conversationHistories.push(fallbackHistory)
      }
    }
    
    console.log(`Retrieved chat conversation list: ${conversationHistories.length} conversations`)
    
    return {
      success: true,
      conversations: conversationHistories,
      totalConversations: conversationHistories.length
    }
    
  } catch (error: any) {
    console.error('Error getting patient chat conversations:', error)
    return {
      success: false,
      conversations: [],
      totalConversations: 0,
      error: error.message || 'Failed to get conversations'
    }
  }
}

/**
 * Update conversation status or metadata in patient_chat container
 */
export async function updateChatConversation(
  conversationId: string,
  patientId: string,
  updates: Partial<Pick<ChatConversation, 'title' | 'status' | 'tags' | 'summary'>>
): Promise<ChatConversationResponse> {
  try {
    console.log(`Updating chat conversation: ${conversationId}`)
    const { chatContainer } = await getChatDatabase()
    
    const conversationQuery = {
      query: `
        SELECT * FROM c 
        WHERE c.patientId = @patientId 
        AND c.conversationId = @conversationId 
        AND c.type = "conversation"
      `,
      parameters: [
        { name: '@patientId', value: patientId },
        { name: '@conversationId', value: conversationId }
      ]
    }
    
    const { resources: conversations } = await chatContainer.items.query<ChatConversation>(conversationQuery).fetchAll()
    
    if (conversations.length === 0) {
      return {
        success: false,
        error: 'Conversation not found'
      }
    }
    
    const conversation = conversations[0]
    const updatedConversation: ChatConversation = {
      ...conversation,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    const result = await chatContainer.item(conversation.id, patientId).replace(updatedConversation)
    console.log('Chat conversation updated successfully:', conversationId)
    
    return {
      success: true,
      conversation: result.resource as ChatConversation
    }
    
  } catch (error: any) {
    console.error('Error updating chat conversation:', error)
    return {
      success: false,
      error: error.message || 'Failed to update conversation'
    }
  }
}

/**
 * Get all exchanges for a patient across all conversations (from embedded arrays)
 */
export async function getAllPatientExchanges(patientId: string): Promise<ChatExchangesResponse> {
  try {
    console.log('Getting all exchanges for patient:', patientId)
    const { chatContainer } = await getChatDatabase()
    
    const querySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.patientId = @patientId
        AND c.type = "conversation"
        ORDER BY c.updated_at DESC
      `,
      parameters: [
        { name: '@patientId', value: patientId }
      ]
    }
    
    const { resources: conversations } = await chatContainer.items.query<ChatConversation>(querySpec).fetchAll()
    
    // Combine all exchanges from all conversations
    const allExchanges: ChatExchange[] = []
    conversations.forEach(conversation => {
      if (conversation.exchanges) {
        allExchanges.push(...conversation.exchanges)
      }
    })
    
    // Sort by exchange number (most recent first)
    allExchanges.sort((a, b) => b.exchangeNumber - a.exchangeNumber)
    
    console.log(`Retrieved ${allExchanges.length} total exchanges for patient:`, patientId)
    
    return {
      success: true,
      exchanges: allExchanges || [],
      totalExchanges: allExchanges.length
    }
    
  } catch (error: any) {
    console.error('Error getting all patient exchanges:', error)
    return {
      success: false,
      exchanges: [],
      totalExchanges: 0,
      error: error.message || 'Failed to get exchanges'
    }
  }
}

/**
 * Delete a conversation from patient_chat container (single document approach)
 */
export async function deleteChatConversation(
  conversationId: string,
  patientId: string
): Promise<ChatConversationResponse> {
  try {
    console.log(`Deleting chat conversation: ${conversationId}`)
    const { chatContainer } = await getChatDatabase()
    
    // Find the conversation document
    const querySpec = {
      query: `
        SELECT c.id FROM c 
        WHERE c.patientId = @patientId 
        AND c.conversationId = @conversationId
        AND c.type = "conversation"
      `,
      parameters: [
        { name: '@patientId', value: patientId },
        { name: '@conversationId', value: conversationId }
      ]
    }
    
    const { resources: conversations } = await chatContainer.items.query(querySpec).fetchAll()
    
    if (conversations.length === 0) {
      return {
        success: false,
        error: 'Conversation not found'
      }
    }
    
    // Delete the single conversation document
    await chatContainer.item(conversations[0].id, patientId).delete()
    console.log('Chat conversation deleted successfully:', conversationId)
    
    return {
      success: true
    }
    
  } catch (error: any) {
    console.error('Error deleting chat conversation:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete conversation'
    }
  }
}

/**
 * Debug function to list all conversations in patient_chat container
 */
export async function listAllChatConversations(): Promise<void> {
  try {
    console.log('=== LISTING ALL CHAT CONVERSATIONS ===')
    const { chatContainer } = await getChatDatabase()
    
    const querySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.type = "conversation"
        ORDER BY c.lastMessageTime DESC
      `
    }
    
    const { resources: conversations } = await chatContainer.items.query(querySpec).fetchAll()
    console.log(`Found ${conversations.length} conversations in patient_chat container:`)
    
    conversations.forEach((conv: any, index: number) => {
      console.log(`${index + 1}. ID: ${conv.id}, Patient: ${conv.patientId}, Title: "${conv.title}", Exchanges: ${conv.exchangeCount}, Status: ${conv.status}`)
    })
    
    if (conversations.length === 0) {
      console.log('No conversations found in patient_chat container!')
    }
  } catch (error: any) {
    console.error('Error listing chat conversations:', error)
  }
}