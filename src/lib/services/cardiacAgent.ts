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
   * Send message using the exact same working method as orchestration service
   */
  async sendMessage(
    message: string,
    patientContext?: PatientContext
  ): Promise<AgentResponse> {
    try {
      console.log('🚀 Processing cardiac health request via Orchestration Agent');
      console.log('📋 Request Details:', {
        messageLength: message.length,
        patientContext: patientContext?.name || 'Anonymous',
        timestamp: new Date().toISOString()
      });

      console.log('🤖 Calling Azure AI Foundry Orchestration Agent');
      
      // Build simple message with just patient context and question
      const simpleMessage = this.buildOrchestrationMessage(message, patientContext);

      // EXACT SAME WORKING METHOD AS ORCHESTRATION SERVICE
      console.log(`📤 AZURE AI FOUNDRY AGENT CALL TO ${this.orchestrationAgentId}:`, message.substring(0, 50) + '...');
      
      // Create thread using working Azure AI Foundry agent API
      const thread = await this.projectClient.agents.threads.create();
      console.log('🧵 Created Azure AI Foundry agent thread:', thread.id);

      // Add message using working API (3 parameters: threadId, role, content)
      await this.projectClient.agents.messages.create(thread.id, 'user', simpleMessage);
      console.log('📝 Message added to Azure AI Foundry agent thread');

      // Start run using working API (2 parameters: threadId, agentId)
      const run = await this.projectClient.agents.runs.create(thread.id, this.orchestrationAgentId);
      console.log('🏃 Started Azure AI Foundry agent run:', run.id);

      // Wait for completion with timeout - EXACT SAME AS WORKING CODE
      let runStatus = await this.projectClient.agents.runs.get(thread.id, run.id);
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
        runStatus = await this.projectClient.agents.runs.get(thread.id, run.id);
        attempts++;
        console.log(`⏳ Azure AI Foundry agent run status: ${runStatus.status} (attempt ${attempts}/${maxAttempts})`);
      }

      if (runStatus.status === 'completed') {
        // Get the Azure AI Foundry agent's response - EXACT SAME AS WORKING CODE
        const messages = await this.projectClient.agents.messages.list(thread.id);
        
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
   * Build simple message with just patient context and question - no instructions
   */
  private buildOrchestrationMessage(message: string, patientContext?: PatientContext): string {
    let simpleMessage = `${message}`;
    
    if (patientContext) {
      simpleMessage = `Patient: ${patientContext.name}`;
      
      if (patientContext.medicalHistory && patientContext.medicalHistory.length > 0) {
        simpleMessage += ` (Medical History: ${patientContext.medicalHistory.join(', ')})`;
      }
      
      simpleMessage += `\n\nQuestion: ${message}`;
    }

    return simpleMessage;
  }

  /**
   * Get agent status
   */
  async getAgentStatus(): Promise<{ status: string; message: string }> {
    return {
      status: 'active',
      message: 'Cardiac Care Orchestration Agent ready - Routes to specialized cardiac agents automatically'
    };
  }
}

// Export the service
export const cardiacAgentService = new CardiacAgentService();
export const cardiacAgent = cardiacAgentService;
export default cardiacAgent;