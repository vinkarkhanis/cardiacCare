/**
 * Cardiac Agent Service using Azure AI Foundry Orchestration Agent
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
    // Use the single orchestration agent that handles all routing
    this.orchestrationAgentId = 'asst_t5VlAQIahpzVTRn4igahAXJO';
    
    // Initialize Azure AI Projects client using the exact same working config
    this.projectClient = new AIProjectClient(
      process.env.AZURE_PROJECT_ENDPOINT || 'https://cardiac-care-resource.services.ai.azure.com/api/projects/cardiac-care',
      new DefaultAzureCredential()
    );

    console.log('🏥 CardiacAgentService initialized with Orchestration Agent');
    console.log('🤖 Orchestration Agent ID:', this.orchestrationAgentId);
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
      console.log('💥 Orchestration error:', error);
      return {
        success: false,
        message: "I apologize, but I'm experiencing technical difficulties. Please contact your healthcare provider for immediate assistance.",
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