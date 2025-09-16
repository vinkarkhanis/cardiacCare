import { NextRequest, NextResponse } from 'next/server';
import { cardiacAgent } from '@/lib/services/cardiacAgent';
import { 
  createChatConversation, 
  saveChatExchange, 
  getPatientChatConversations 
} from '@/lib/database/chatConversations';

export async function POST(request: NextRequest) {
  console.log('\n🌐 =================================');
  console.log('🌐 API CHAT ENDPOINT - NEW REQUEST');
  console.log('🌐 =================================');
  
  // Log environment variable status for debugging
  console.log('🔍 Environment Variables Check:');
  console.log('   AZURE_AI_FOUNDRY_PROJECT_ENDPOINT:', process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT ? 'SET' : 'NOT SET');
  console.log('   AZURE_AI_ORCHESTRATION_AGENT_ID:', process.env.AZURE_AI_ORCHESTRATION_AGENT_ID ? 'SET' : 'NOT SET');
  console.log('   AZURE_AI_FOUNDRY_API_KEY:', process.env.AZURE_AI_FOUNDRY_API_KEY ? 'SET' : 'NOT SET');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   WEBSITES_PORT:', process.env.WEBSITES_PORT || 'NOT SET');
  
  try {
    const requestBody = await request.json();
    const { message, patientContext, conversationId } = requestBody;
    
    console.log('📥 Incoming request data:');
    console.log('📝 Raw request body:', JSON.stringify(requestBody, null, 2));
    console.log('💬 Message:', message);
    console.log('👤 Patient context:', patientContext);
    console.log('🗨️ Conversation ID:', conversationId || 'New conversation');
    console.log('');

    if (!message || typeof message !== 'string') {
      console.log('❌ Invalid request - message validation failed');
      console.log('🚫 Message type:', typeof message);
      console.log('🚫 Message value:', message);
      
      const errorResponse = { error: 'Message is required and must be a string' };
      console.log('📤 Sending error response:', errorResponse);
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!patientContext?.patientId) {
      console.log('❌ Invalid request - patient context missing');
      const errorResponse = { error: 'Patient context with patientId is required' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log('✅ Request validation passed');
    console.log('📊 Processing chat request:');
    console.log('   📏 Message length:', message.length);
    console.log('   🏥 Has patient context:', !!patientContext);
    console.log('   👤 Patient ID:', patientContext.patientId);
    console.log('   ⏰ Timestamp:', new Date().toISOString());
    console.log('');

    // Handle conversation creation/continuation
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      console.log('🆕 Creating new conversation in patient_chat container...');
      const newConversationResponse = await createChatConversation({
        patientId: patientContext.patientId,
        initialMessage: message
      });
      
      if (!newConversationResponse.success) {
        console.log('❌ Failed to create conversation:', newConversationResponse.error);
        // Continue without conversation storage if it fails
      } else {
        currentConversationId = newConversationResponse.conversation?.conversationId;
        console.log('✅ New conversation created in patient_chat:', currentConversationId);
      }
    }

    console.log('🤖 =================================');
    console.log('🤖 CALLING CARDIAC AGENT SERVICE');
    console.log('🤖 =================================');

    const startTime = Date.now();
    const userMessageTimestamp = new Date().toISOString();
    
    // Send message to the cardiac care agent
    const agentResponse = await cardiacAgent.sendMessage(message, patientContext);

    console.log('📬 =================================');
    console.log('📬 AGENT RESPONSE RECEIVED');
    console.log('📬 =================================');
    console.log('✅ Agent response success:', agentResponse.success);
    console.log('📝 Agent response message:', agentResponse.message);
    console.log('🚫 Agent response error:', agentResponse.error || 'None');
    console.log('📊 Agent response metadata:');
    console.log('   📏 Message length:', agentResponse.message?.length || 0);
    console.log('   ⏰ Received at:', new Date().toISOString());
    console.log('');

    if (!agentResponse.success) {
      console.log('❌ Agent response indicates failure');
      console.error('🚫 Agent response error details:', agentResponse.error);
      
      const errorResponse = { 
        error: 'Failed to get response from cardiac agent',
        details: agentResponse.error
      };
      
      console.log('📤 =================================');
      console.log('📤 SENDING ERROR RESPONSE TO CLIENT');
      console.log('📤 =================================');
      console.log('🚫 Error response:', JSON.stringify(errorResponse, null, 2));
      console.log('📊 HTTP Status: 500');
      console.log('🌐 =================================\n');
      
      return NextResponse.json(errorResponse, { status: 500 });
    }

    console.log('✅ Agent response successful, preparing client response');
    
    const processingTime = Date.now() - startTime;
    const aiResponseTimestamp = new Date().toISOString();
    console.log('⏱️ Total processing time:', processingTime, 'ms');

    // Save complete exchange (user + AI) to patient_chat container
    if (currentConversationId && agentResponse.message) {
      console.log('💾 Saving complete exchange to patient_chat container...');
      const saveExchangeResponse = await saveChatExchange({
        conversationId: currentConversationId,
        patientId: patientContext.patientId,
        userMessage: {
          content: message,
          timestamp: userMessageTimestamp
        },
        aiResponse: {
          content: agentResponse.message,
          timestamp: aiResponseTimestamp,
          processingTime,
          agentUsed: 'CardiacOrchestrationAgent',
          success: true
        },
        metadata: {
          patientContext: {
            name: patientContext.name,
            email: patientContext.email,
            mobile: patientContext.mobile,
            medicalHistory: patientContext.medicalHistory
          },
          tags: ['api-chat'],
          summary: `Exchange: ${message.substring(0, 50)}...`
        }
      });
      
      if (!saveExchangeResponse.success) {
        console.log('⚠️ Failed to save exchange to patient_chat:', saveExchangeResponse.error);
        // Continue even if storage fails
      } else {
        console.log('✅ Complete exchange saved to patient_chat container');
      }
    }
    
    const clientResponse = {
      success: true,
      message: agentResponse.message,
      conversationId: currentConversationId, // Return conversation ID to client
      timestamp: new Date().toISOString(),
      processingTime
    };

    console.log('📤 =================================');
    console.log('📤 SENDING SUCCESS RESPONSE TO CLIENT');
    console.log('📤 =================================');
    console.log('✅ Success response:');
    console.log('   🎯 Success:', clientResponse.success);
    console.log('   📝 Message:', clientResponse.message);
    console.log('   ⏰ Timestamp:', clientResponse.timestamp);
    console.log('📊 Response metadata:');
    console.log('   📏 Message length:', clientResponse.message.length);
    console.log('   📋 HTTP Status: 200');
    console.log('   📄 Content-Type: application/json');
    console.log('🔥 Full response JSON:');
    console.log(JSON.stringify(clientResponse, null, 2));
    console.log('🌐 =================================\n');

    return NextResponse.json(clientResponse);

  } catch (error) {
    console.log('💥 =================================');
    console.log('💥 API CHAT ENDPOINT ERROR');
    console.log('💥 =================================');
    console.log('🚫 Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.log('💬 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.log('📝 Full error object:', error);
    console.log('📊 Stack trace:');
    if (error instanceof Error && error.stack) {
      console.log(error.stack);
    }
    console.log('');
    
    const errorResponse = { 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.log('📤 SENDING FATAL ERROR RESPONSE:');
    console.log('🚫 Error response:', JSON.stringify(errorResponse, null, 2));
    console.log('📊 HTTP Status: 500');
    console.log('💥 =================================\n');
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  console.log('\n🏥 =================================');
  console.log('🏥 API HEALTH CHECK ENDPOINT');
  console.log('🏥 =================================');
  
  try {
    console.log('🔍 Checking cardiac agent status...');
    const status = await cardiacAgent.getAgentStatus();
    
    console.log('✅ Agent status check successful:');
    console.log('📊 Status:', status.status);
    console.log('💬 Message:', status.message);
    console.log('');
    
    const healthResponse = {
      status: 'healthy',
      agent: {
        online: true,
        agentId: 'asst_t5VlAQIahpzVTRn4igahAXJO'
      },
      message: status.message,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending health check response:');
    console.log(JSON.stringify(healthResponse, null, 2));
    console.log('🏥 =================================\n');
    
    return NextResponse.json(healthResponse);
  } catch (error) {
    console.log('💥 =================================');
    console.log('💥 HEALTH CHECK ERROR');
    console.log('💥 =================================');
    console.log('🚫 Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.log('💬 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.log('📝 Full error:', error);
    console.log('');
    
    const errorResponse = { 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.log('📤 Sending error health response:');
    console.log(JSON.stringify(errorResponse, null, 2));
    console.log('💥 =================================\n');
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}