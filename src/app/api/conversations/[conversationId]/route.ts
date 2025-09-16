import { NextRequest, NextResponse } from 'next/server';
import { 
  getChatConversationHistory,
  getChatConversationExchanges
} from '@/lib/database/chatConversations';
import { ChatExchange } from '@/lib/types/conversation';

/**
 * GET /api/conversations/[conversationId] - Get full conversation history
 * Query params: patientId (required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  console.log('\n💬 =================================');
  console.log('💬 GET CONVERSATION HISTORY ENDPOINT');
  console.log('💬 =================================');
  
  try {
    const { conversationId } = await params;
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const messagesOnly = url.searchParams.get('messagesOnly') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    console.log('📥 Request parameters:');
    console.log('   🗨️ Conversation ID:', conversationId);
    console.log('   👤 Patient ID:', patientId);
    console.log('   📋 Messages only:', messagesOnly);
    console.log('   📊 Limit:', limit);
    console.log('   📄 Offset:', offset);
    
    if (!conversationId || !patientId) {
      console.log('❌ Missing required parameters');
      return NextResponse.json(
        { error: 'conversationId and patientId are required' },
        { status: 400 }
      );
    }

    if (messagesOnly) {
      console.log('🔍 Fetching exchanges only from patient_chat for conversation:', conversationId);
      const response = await getChatConversationExchanges(conversationId, patientId, limit, offset);
      
      if (!response.success) {
        console.log('❌ Failed to fetch exchanges:', response.error);
        return NextResponse.json(
          { error: response.error },
          { status: 500 }
        );
      }

      console.log('✅ Successfully retrieved', response.exchanges?.length || 0, 'exchanges');
      
      return NextResponse.json({
        success: true,
        exchanges: response.exchanges,
        totalExchanges: response.totalExchanges,
        limit,
        offset
      });
    } else {
      console.log('🔍 Fetching full conversation history from patient_chat for:', conversationId);
      const response = await getChatConversationHistory(conversationId, patientId);
      
      if (!response.success) {
        console.log('❌ Failed to fetch conversation history:', response.error);
        return NextResponse.json(
          { error: response.error },
          { status: 500 }
        );
      }

      console.log('✅ Successfully retrieved conversation with', response.history?.totalExchanges || 0, 'exchanges');
      
      // Convert exchanges to message format expected by UI
      const messages: any[] = []
      if (response.history?.exchanges) {
        response.history.exchanges.forEach((exchange: ChatExchange) => {
          // Handle both new nested format and potential old simplified format
          let userContent: string | undefined
          let userTimestamp: string = exchange.timestamp
          let aiContent: string | undefined  
          let aiTimestamp: string = exchange.timestamp
          
          // Check if it's the new nested format
          if (exchange.userMessage && typeof exchange.userMessage === 'object') {
            userContent = exchange.userMessage.content
            userTimestamp = exchange.userMessage.timestamp || exchange.timestamp
          } else if ((exchange as any).userMessage && typeof (exchange as any).userMessage === 'string') {
            // Handle old simplified format if it exists
            userContent = (exchange as any).userMessage
            userTimestamp = exchange.timestamp
          }
          
          if (exchange.aiResponse && typeof exchange.aiResponse === 'object') {
            aiContent = exchange.aiResponse.content
            aiTimestamp = exchange.aiResponse.timestamp || exchange.timestamp
          } else if ((exchange as any).agentResponse && typeof (exchange as any).agentResponse === 'string') {
            // Handle old simplified format if it exists  
            aiContent = (exchange as any).agentResponse
            aiTimestamp = exchange.timestamp
          }
          
          // Add user message
          if (userContent) {
            messages.push({
              id: `${exchange.exchangeNumber}-user`,
              content: userContent,
              role: 'user',
              timestamp: userTimestamp
            })
          }
          
          // Add agent response  
          if (aiContent) {
            messages.push({
              id: `${exchange.exchangeNumber}-agent`,
              content: aiContent,
              role: 'assistant',
              timestamp: aiTimestamp
            })
          }
        })
      }
      
      console.log('📤 Sending conversation history with', messages.length, 'messages to client');
      
      return NextResponse.json({
        success: true,
        conversation: response.history?.conversation,
        exchanges: response.history?.exchanges,
        messages: messages, // Add messages array for UI compatibility
        totalExchanges: response.history?.totalExchanges
      });
    }

  } catch (error) {
    console.error('💥 Error in GET conversation history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}