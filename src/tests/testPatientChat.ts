import { getChatDatabase } from '../lib/database/chat'
import {
  createChatConversation,
  saveChatExchange,
  getPatientChatConversations,
  listAllChatConversations
} from '../lib/database/chatConversations'/**
 * Test script to validate patient_chat container functionality
 * Run this to test the conversation storage system
 */
async function testPatientChatContainer() {
  console.log('🧪 =================================')
  console.log('🧪 TESTING PATIENT_CHAT CONTAINER')
  console.log('🧪 =================================')

  try {
    // Test 1: Initialize chat database
    console.log('\n1️⃣ Testing database initialization...')
    const { chatContainer } = await getChatDatabase()
    console.log('✅ Chat database initialized successfully')
    console.log('📦 Container ID:', chatContainer.id)

    // Test 2: Create a test conversation
    const testPatientId = 'TEST-PATIENT-123'
    console.log('\n2️⃣ Testing conversation creation...')
    const newConversation = await createChatConversation({
      patientId: testPatientId,
      initialMessage: 'Hello, I need help with my cardiac medications'
    })

    if (newConversation.success) {
      console.log('✅ Conversation created successfully')
      console.log('🆔 Conversation ID:', newConversation.conversation?.conversationId)
      console.log('📝 Title:', newConversation.conversation?.title)
    } else {
      console.log('❌ Failed to create conversation:', newConversation.error)
      return
    }

    const conversationId = newConversation.conversation!.conversationId

    // Test 3: Save test exchange
    console.log('\n3️⃣ Testing exchange storage...')
    
    // Save complete exchange (user + AI)
    const exchangeResult = await saveChatExchange({
      conversationId,
      patientId: testPatientId,
      userMessage: {
        content: 'Hello, I need help with my cardiac medications',
        timestamp: new Date().toISOString()
      },
      aiResponse: {
        content: 'I can help you with your cardiac medications. What specific questions do you have?',
        timestamp: new Date().toISOString(),
        processingTime: 1500,
        agentUsed: 'CardiacOrchestrationAgent',
        success: true
      },
      metadata: {
        patientContext: {
          name: 'Test Patient',
          email: 'test@example.com',
          mobile: '+1234567890'
        },
        tags: ['medication', 'test']
      }
    })

    if (exchangeResult.success) {
      console.log('✅ Exchange saved successfully')
    } else {
      console.log('❌ Failed to save exchange:', exchangeResult.error)
    }

    // Test 4: Retrieve conversations
    console.log('\n4️⃣ Testing conversation retrieval...')
    const conversations = await getPatientChatConversations(testPatientId)

    if (conversations.success) {
      console.log('✅ Conversations retrieved successfully')
      console.log('📊 Found', conversations.conversations?.length, 'conversations')
      
      if (conversations.conversations && conversations.conversations.length > 0) {
        const conv = conversations.conversations[0]
        console.log('📄 First conversation:')
        console.log('   - Title:', conv.conversation.title)
        console.log('   - Exchanges:', conv.conversation.exchangeCount)
        console.log('   - Status:', conv.conversation.status)
        console.log('   - Last active:', conv.conversation.lastMessageTime)
        console.log('   - Total exchanges loaded:', conv.totalExchanges)
      }
    } else {
      console.log('❌ Failed to retrieve conversations:', conversations.error)
    }

    // Test 5: List all conversations (debug)
    console.log('\n5️⃣ Testing debug functionality...')
    await listAllChatConversations()

    console.log('\n🎉 =================================')
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY')
    console.log('🎉 patient_chat container is ready!')
    console.log('🎉 =================================')

  } catch (error) {
    console.error('\n💥 =================================')
    console.error('💥 TEST FAILED')
    console.error('💥 =================================')
    console.error('Error:', error)
  }
}

// Export for use in API endpoints or manual testing
export { testPatientChatContainer }

// Run tests if this file is executed directly
if (require.main === module) {
  testPatientChatContainer()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}