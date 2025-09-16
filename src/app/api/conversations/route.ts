import { NextRequest, NextResponse } from 'next/server';
import { 
  getPatientChatConversations,
  getChatConversationHistory,
  updateChatConversation,
  deleteChatConversation
} from '@/lib/database/chatConversations';

/**
 * GET /api/conversations - Get all conversations for a patient
 * Query params: patientId, limit?, offset?
 */
export async function GET(request: NextRequest) {
  console.log('\n📜 =================================');
  console.log('📜 GET CONVERSATIONS API ENDPOINT');
  console.log('📜 =================================');
  
  try {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    console.log('📥 Query parameters:');
    console.log('   👤 Patient ID:', patientId);
    console.log('   📊 Limit:', limit);
    console.log('   📄 Offset:', offset);
    
    if (!patientId) {
      console.log('❌ Missing patientId parameter');
      return NextResponse.json(
        { error: 'patientId parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching conversations from patient_chat for patient:', patientId);
    const response = await getPatientChatConversations(patientId);
    
    if (!response.success) {
      console.log('❌ Failed to fetch conversations:', response.error);
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      );
    }

    console.log('✅ Successfully retrieved', response.conversations?.length || 0, 'conversations');
    console.log('📤 Sending conversations response to client');
    
    return NextResponse.json({
      success: true,
      conversations: response.conversations,
      totalConversations: response.totalConversations,
      limit,
      offset
    });

  } catch (error) {
    console.error('💥 Error in GET conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/conversations - Update conversation metadata
 * Body: { conversationId, patientId, updates: { title?, status?, tags?, summary? } }
 */
export async function PUT(request: NextRequest) {
  console.log('\n✏️ =================================');
  console.log('✏️ UPDATE CONVERSATION API ENDPOINT');
  console.log('✏️ =================================');
  
  try {
    const body = await request.json();
    const { conversationId, patientId, updates } = body;
    
    console.log('📥 Update request:');
    console.log('   🗨️ Conversation ID:', conversationId);
    console.log('   👤 Patient ID:', patientId);
    console.log('   📝 Updates:', JSON.stringify(updates, null, 2));
    
    if (!conversationId || !patientId || !updates) {
      console.log('❌ Missing required parameters');
      return NextResponse.json(
        { error: 'conversationId, patientId, and updates are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating conversation in patient_chat:', conversationId);
    const response = await updateChatConversation(conversationId, patientId, updates);
    
    if (!response.success) {
      console.log('❌ Failed to update conversation:', response.error);
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      );
    }

    console.log('✅ Successfully updated conversation');
    console.log('📤 Sending update response to client');
    
    return NextResponse.json({
      success: true,
      conversation: response.conversation
    });

  } catch (error) {
    console.error('💥 Error in PUT conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations - Delete (archive) a conversation
 * Body: { conversationId, patientId }
 */
export async function DELETE(request: NextRequest) {
  console.log('\n🗑️ =================================');
  console.log('🗑️ DELETE CONVERSATION API ENDPOINT');
  console.log('🗑️ =================================');
  
  try {
    const body = await request.json();
    const { conversationId, patientId } = body;
    
    console.log('📥 Delete request:');
    console.log('   🗨️ Conversation ID:', conversationId);
    console.log('   👤 Patient ID:', patientId);
    
    if (!conversationId || !patientId) {
      console.log('❌ Missing required parameters');
      return NextResponse.json(
        { error: 'conversationId and patientId are required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting conversation from patient_chat:', conversationId);
    const response = await deleteChatConversation(conversationId, patientId);
    
    if (!response.success) {
      console.log('❌ Failed to delete conversation:', response.error);
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      );
    }

    console.log('✅ Successfully deleted conversation');
    console.log('📤 Sending delete response to client');
    
    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('💥 Error in DELETE conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}