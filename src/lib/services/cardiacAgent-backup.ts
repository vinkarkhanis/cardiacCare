/**
 * Cardiac Agent Service using Azure AI Foundry Orchestration Ag      // Start run with orchestration agent using agents API (2 parameters: threadId, agentId)
      const run = await this.projectClient.agents.runs.create(thread.id, this.orchestrationAgentId);
      console.log('🔄 Started orchestration run:', run.id);

      // Wait for completion using agents API
      let runStatus = await this.projectClient.agents.runs.get(thread.id, run.id);utes all queries through a single orchestration agent that manages specialist routing
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
  email?: string;
  mobile?: string;
  medicalHistory?: string[];
}

class CardiacAgentService {
  private readonly orchestrationAgentId: string;
  private projectClient: AIProjectClient;

  constructor() {
    // Use the single orchestration agent that handles all routing
    this.orchestrationAgentId = 'asst_t5VlAQIahpzVTRn4igahAXJO';
    
    // Initialize Azure AI Projects client with the exact same config as working test
    this.projectClient = new AIProjectClient(
      'https://eastus2.api.azureml.ms',
      new DefaultAzureCredential()
    );

    console.log('🏥 CardiacAgentService initialized with Orchestration Agent');
    console.log('🤖 Orchestration Agent ID:', this.orchestrationAgentId);
    console.log('🔀 Single agent handles all routing to specialists');
  }

  /**
   * Send a message to the orchestration agent which routes to appropriate specialists
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

      console.log('🤖 Routing through Azure AI Foundry Orchestration Agent');
      
      // Debug: Check if agents API is available
      console.log('🔍 Checking agents API availability...');
      console.log('📋 projectClient:', typeof this.projectClient);
      console.log('📋 projectClient.agents:', typeof this.projectClient.agents);
      
      if (!this.projectClient.agents) {
        console.log('❌ Agents API not available, falling back to working orchestration service');
        
        // Import and use the working orchestration service
        const { cardiacOrchestrationService } = await import('./cardiacAgentOrchestration');
        return await cardiacOrchestrationService.sendMessage(message, patientContext);
      }
      
      // Use Azure AI Projects SDK agents API (not OpenAI client)
      // Create thread using agents API
      const thread = await this.projectClient.agents.threads.create();
      console.log('📧 Created conversation thread:', thread.id);

      // Build comprehensive context message for the orchestration agent
      const contextualMessage = this.buildContextualMessage(message, patientContext);

      // Add message to thread using agents API (3 parameters: threadId, role, content)
      await this.projectClient.agents.messages.create(thread.id, 'user', contextualMessage);

      // Start run with orchestration agent
      const run = await client.beta.threads.runs.create(thread.id, {
        assistant_id: this.orchestrationAgentId
      });
      console.log('� Started orchestration run:', run.id);

      // Wait for completion
      let runStatus = await client.beta.threads.runs.retrieve(run.id, {
        thread_id: thread.id
      });
      
      let attempts = 0;
      const maxAttempts = 30;

      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        if (attempts >= maxAttempts) {
          console.log('⏰ Orchestration timeout after', maxAttempts, 'attempts');
          return {
            success: false,
            message: "I apologize, but my response is taking longer than expected. Please try again or contact your healthcare provider.",
            error: 'Orchestration timeout'
          };
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.projectClient.agents.runs.get(thread.id, run.id);
        attempts++;
        console.log('⏳ Orchestration status:', runStatus.status, `(attempt ${attempts})`);
      }

      console.log('✅ Orchestration completed with status:', runStatus.status);

      if (runStatus.status === 'completed') {
        // Get the response using agents API
        const messages = await this.projectClient.agents.messages.list(thread.id);
        
        let responseText = '';
        for await (const message of messages) {
          if (message.role === 'assistant') {
            if (message.content && message.content.length > 0) {
              const content = message.content[0];
              if (content.type === 'text' && 'text' in content) {
                responseText = content.text.value;
                break;
              }
            }
          }
        }
        
        if (responseText) {
          console.log('📨 Orchestration response received:', responseText.length, 'characters');
          
          return {
            success: true,
            message: responseText
          };
        } else {
          console.log('❌ No valid response from orchestration agent');
          return {
            success: false,
            message: "Sorry, this question cannot be answered at this moment. Please contact your healthcare provider for assistance."
          };
        }
      } else {
        console.log('❌ Orchestration failed with status:', runStatus.status);
        return {
          success: false,
          message: "Sorry, this question cannot be answered at this moment. Please contact your healthcare provider for assistance.",
          error: `Orchestration failed: ${runStatus.status}`
        };
      }

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
   * Build contextual message with patient information and routing instructions
   */
  private buildContextualMessage(message: string, patientContext?: PatientContext): string {
    let contextualMessage = `Patient Query: "${message}"\n\n`;
    
    if (patientContext) {
      contextualMessage += `Patient Information:\n`;
      contextualMessage += `- Name: ${patientContext.name}\n`;
      contextualMessage += `- Patient ID: ${patientContext.patientId}\n`;
      
      if (patientContext.medicalHistory && patientContext.medicalHistory.length > 0) {
        contextualMessage += `- Medical History: ${patientContext.medicalHistory.join(', ')}\n`;
      }
      
      contextualMessage += `\n`;
    }

    contextualMessage += `ORCHESTRATION INSTRUCTIONS:
Route this cardiac-related query to the most appropriate connected agent (CardiacDietAgent, CardiacMedicationAgent, CardiacExerciseAgent, CardiacNursingAgent) based on the query content.

Core Principles:
- Strict Delegation: Do not answer using your own logic - delegate to connected agents only
- Agent-Only Responses: All responses must come exclusively from connected agents
- Fallback Protocol: If no connected agent provides an answer, respond with: "Sorry, this question cannot be answered at this moment."

Routing Priority:
1. Diet queries → CardiacDietAgent
2. Medication queries → CardiacMedicationAgent  
3. Exercise queries → CardiacExerciseAgent
4. General/Nursing queries → CardiacNursingAgent

If the first agent cannot answer, try other agents in order before using the fallback response.`;

    return contextualMessage;
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
// Export the service
export const cardiacAgentService = new CardiacAgentService();
export const cardiacAgent = cardiacAgentService;
export default cardiacAgent;