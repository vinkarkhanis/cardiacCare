/**
 * Cardiac Agent Service usin  constructor() {
    // Use the orchestration agent ID from environment variables
    this.orchestrationAgentId = process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 'asst_t5VlAQIahpzVTRn4igahAXJO';
    
    // Use the direct Azure AI Foundry project endpoint
    const azureProjectEndpoint = process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 
      'https://cardiac-care-resource.services.ai.azure.com/api/projects/cardiac-care';
    
    console.log('🔍 Azure Environment Check:');
    console.log('   AZURE_AI_FOUNDRY_PROJECT_ENDPOINT:', process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 'NOT SET');
    console.log('   AZURE_AI_ORCHESTRATION_AGENT_ID:', this.orchestrationAgentId);
    
    // Initialize Azure AI Projects client
    this.projectClient = new AIProjectClient(
      azureProjectEndpoint,
      new DefaultAzureCredential()
    );

    console.log('🏥 CardiacAgentService initialized with Orchestration Agent');
    console.log('🤖 Orchestration Agent ID:', this.orchestrationAgentId);
    console.log('🔗 Azure Project Endpoint:', azureProjectEndpoint);
    console.log('🔀 Single agent handles all routing to specialists');
  } Orchestration Agent
 * Uses the exact same working method as orchestration service
 */

import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';

interface AgentResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface PatientContext {
  patientId: string;
  name: string;
  email: string;
  mobile: string;
  medicalHistory: string[];
}

class CardiacAgentService {
  private readonly orchestrationAgentId: string;
  private projectClient: AIProjectClient;
  
  // Thread management for conversation continuity
  private conversationThreads: Map<string, string> = new Map();
  private threadLastUsed: Map<string, number> = new Map();
  private readonly THREAD_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Debug environment variables
    console.log('🔍 ENVIRONMENT VARIABLE DEBUG:');
    console.log('   AZURE_AI_ORCHESTRATION_AGENT_ID:', process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 'NOT SET');
    console.log('   AZURE_AI_FOUNDRY_PROJECT_ENDPOINT:', process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 'NOT SET');
    console.log('   AZURE_AI_FOUNDRY_API_KEY:', process.env.AZURE_AI_FOUNDRY_API_KEY ? 'SET' : 'NOT SET');
    
    // Use the orchestration agent ID from environment variables
    this.orchestrationAgentId = process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 'asst_t5VlAQIahpzVTRn4igahAXJO';
    
    // Use the direct Azure AI Foundry project endpoint
    const azureProjectEndpoint = process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 
      'https://cardiac-care-resource.services.ai.azure.com/api/projects/cardiac-care';
    
    // Initialize Azure AI Projects client
    this.projectClient = new AIProjectClient(
      azureProjectEndpoint,
      new DefaultAzureCredential()
    );

    console.log('🏥 CardiacAgentService initialized with Orchestration Agent');
    console.log('🤖 Orchestration Agent ID:', this.orchestrationAgentId);
    console.log('🔗 Azure Project Endpoint:', azureProjectEndpoint);
    console.log('🔀 Single agent handles all routing to specialists');
  }

  /**
   * Get or create a thread for a specific conversation
   * Maintains one thread per conversation for context continuity
   */
  private async getOrCreateThreadForConversation(conversationId: string): Promise<string> {
    // Clean up expired threads first
    this.cleanupExpiredThreads();
    
    // Check if we already have a thread for this conversation
    const existingThreadId = this.conversationThreads.get(conversationId);
    if (existingThreadId) {
      // Update last used timestamp
      this.threadLastUsed.set(conversationId, Date.now());
      console.log(`♻️ Reusing existing thread for conversation ${conversationId}: ${existingThreadId}`);
      return existingThreadId;
    }
    
    // Create new thread for this conversation
    try {
      const thread = await this.projectClient.agents.threads.create();
      this.conversationThreads.set(conversationId, thread.id);
      this.threadLastUsed.set(conversationId, Date.now());
      console.log(`🆕 Created new thread for conversation ${conversationId}: ${thread.id}`);
      return thread.id;
    } catch (error) {
      console.error(`❌ Failed to create thread for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up threads that haven't been used recently
   * Prevents memory leaks and maintains performance
   */
  private cleanupExpiredThreads(): void {
    const now = Date.now();
    const expiredConversations: string[] = [];
    
    for (const [conversationId, lastUsed] of this.threadLastUsed.entries()) {
      if (now - lastUsed > this.THREAD_TIMEOUT_MS) {
        expiredConversations.push(conversationId);
      }
    }
    
    for (const conversationId of expiredConversations) {
      const threadId = this.conversationThreads.get(conversationId);
      this.conversationThreads.delete(conversationId);
      this.threadLastUsed.delete(conversationId);
      console.log(`🧹 Cleaned up expired thread for conversation ${conversationId}: ${threadId}`);
    }
    
    if (expiredConversations.length > 0) {
      console.log(`🧹 Cleaned up ${expiredConversations.length} expired threads`);
    }
  }

  /**
   * Build conversation context from previous messages
   * Helps maintain context when reusing threads
   */
  private buildConversationContext(message: string, patientContext?: PatientContext): string {
    let contextMessage = `${message}`;
    
    if (patientContext) {
      contextMessage = `Patient: ${patientContext.name}`;
      
      if (patientContext.medicalHistory && patientContext.medicalHistory.length > 0) {
        contextMessage += ` (Medical History: ${patientContext.medicalHistory.join(', ')})`;
      }
      
      contextMessage += `\n\nQuestion: ${message}`;
    }

    return contextMessage;
  }

  /**
   * Send message using conversation-aware thread management
   */
  async sendMessage(
    message: string,
    patientContext?: PatientContext,
    conversationId?: string
  ): Promise<AgentResponse> {
    try {
      console.log('🚀 Processing cardiac health request via Orchestration Agent');
      console.log('📋 Request Details:', {
        messageLength: message.length,
        patientContext: patientContext?.name || 'Anonymous',
        timestamp: new Date().toISOString()
      });

      console.log('🤖 Calling Azure AI Foundry Orchestration Agent');
      
      // Build conversation-aware message with context
      const contextualMessage = this.buildConversationContext(message, patientContext);

      // EXACT SAME WORKING METHOD AS ORCHESTRATION SERVICE
      console.log(`📤 AZURE AI FOUNDRY AGENT CALL TO ${this.orchestrationAgentId}:`, message.substring(0, 50) + '...');
      
      // ENHANCED: Get or create thread for conversation continuity
      let threadId: string;
      if (conversationId) {
        threadId = await this.getOrCreateThreadForConversation(conversationId);
        console.log(`🧵 Using existing thread for conversation ${conversationId}: ${threadId}`);
      } else {
        // Create new thread for one-off questions
        const thread = await this.projectClient.agents.threads.create();
        threadId = thread.id;
        console.log('🧵 Created new thread for one-off question:', threadId);
      }

      // Add message using working API (3 parameters: threadId, role, content)
      await this.projectClient.agents.messages.create(threadId, 'user', contextualMessage);
      console.log('📝 Message added to Azure AI Foundry agent thread');

      // Start run using working API (2 parameters: threadId, agentId)
      const run = await this.projectClient.agents.runs.create(threadId, this.orchestrationAgentId);
      console.log('🏃 Started Azure AI Foundry agent run:', run.id);

      // Wait for completion with timeout - EXACT SAME AS WORKING CODE
      let runStatus = await this.projectClient.agents.runs.get(threadId, run.id);
      let attempts = 0;
      const maxAttempts = 30;

      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        if (attempts >= maxAttempts) {
          console.log('⏰ Azure AI Foundry agent run timeout after 30 attempts');
          return { 
            success: false, 
            message: 'I apologize, but my response is taking longer than expected. Please try again or contact your healthcare provider.',
            error: 'Agent response timeout' 
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.projectClient.agents.runs.get(threadId, run.id);
        attempts++;
        console.log(`⏳ Azure AI Foundry agent run status: ${runStatus.status} (attempt ${attempts}/${maxAttempts})`);
      }

      if (runStatus.status === 'completed') {
        // Get the Azure AI Foundry agent's response - EXACT SAME AS WORKING CODE
        const messages = await this.projectClient.agents.messages.list(threadId);
        
        // Handle PagedAsyncIterableIterator - EXACT SAME AS WORKING CODE
        for await (const agentMessage of messages) {
          if (agentMessage.role === 'assistant') {
            if (agentMessage.content && agentMessage.content.length > 0) {
              const responseContent = agentMessage.content[0] as any;
              if (responseContent.type === 'text') {
                // Extract text content (handle different possible structures) - EXACT SAME AS WORKING CODE
                const responseText = responseContent.text?.value || responseContent.text || responseContent.content || 'No text content';
                console.log('📥 Orchestration agent response via Azure AI Foundry:', String(responseText).substring(0, 100) + '...');
                return {
                  success: true,
                  message: String(responseText)
                };
              }
            }
          }
        }
      }

      console.log(`❌ Azure AI Foundry orchestration agent failed. Status: ${runStatus.status}`);
      return { 
        success: false, 
        message: 'Sorry, this question cannot be answered at this moment. Please contact your healthcare provider for assistance.',
        error: `Agent failed: ${runStatus.status}` 
      };

    } catch (error) {
      console.log('💥 =================================');
      console.log('💥 CARDIAC AGENT ERROR DETAILS');
      console.log('💥 =================================');
      console.log('🚫 Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
      console.log('💬 Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.log('📝 Full error object:', error);
      
      // Log specific Azure-related error details
      if (error instanceof Error) {
        console.log('🔍 Error details:');
        console.log('   Name:', error.name);
        console.log('   Message:', error.message);
        
        // Check for specific Azure authentication errors
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.log('🔐 Authentication error detected - check Azure credentials');
        }
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          console.log('🔍 Resource not found - check Azure AI Foundry endpoint and agent ID');
        }
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          console.log('🚫 Permission denied - check Azure AI Foundry permissions');
        }
        
        if (error.stack) {
          console.log('📊 Stack trace (first 500 chars):');
          console.log(error.stack.substring(0, 500));
        }
      }
      console.log('💥 =================================');
      
      // Provide more specific error messages based on error type
      let userMessage = "I apologize, but I'm experiencing technical difficulties. Please contact your healthcare provider for immediate assistance.";
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          userMessage = "I'm currently experiencing authentication issues. Please try again in a moment or contact your healthcare provider.";
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          userMessage = "I'm having trouble connecting to my knowledge base. Please try again or contact your healthcare provider.";
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          userMessage = "I don't have the necessary permissions to answer right now. Please contact your healthcare provider.";
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          userMessage = "My response is taking longer than expected. Please try again or contact your healthcare provider.";
        }
      }
      
      return {
        success: false,
        message: userMessage,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get agent status
   */
  async getAgentStatus(): Promise<{ status: string; message: string }> {
    return {
      status: 'active',
      message: 'Cardiac Care Orchestration Agent ready - Routes to specialized cardiac agents automatically with conversation continuity'
    };
  }

  /**
   * Get thread management statistics
   */
  getThreadStats(): { activeThreads: number; totalConversations: number; oldestThread: string | null } {
    const now = Date.now();
    let oldestThread: string | null = null;
    let oldestTime = now;

    for (const [conversationId, lastUsed] of this.threadLastUsed.entries()) {
      if (lastUsed < oldestTime) {
        oldestTime = lastUsed;
        oldestThread = conversationId;
      }
    }

    return {
      activeThreads: this.conversationThreads.size,
      totalConversations: this.threadLastUsed.size,
      oldestThread: oldestThread ? `${oldestThread} (${Math.round((now - oldestTime) / 1000 / 60)} min ago)` : null
    };
  }

  /**
   * Force cleanup of all threads (useful for maintenance)
   */
  clearAllThreads(): void {
    const clearedCount = this.conversationThreads.size;
    this.conversationThreads.clear();
    this.threadLastUsed.clear();
    console.log(`🧹 Force cleared ${clearedCount} conversation threads`);
  }
}

// Export the service
export const cardiacAgentService = new CardiacAgentService();
export const cardiacAgent = cardiacAgentService;
export default cardiacAgent;