/**
 * Simplified Cardiac Agent Service for debugging
 */

interface AgentResponse {
  success: boolean;
  message: string;
  error?: string;
}

class CardiacAgentService {
  private readonly agentId: string;

  constructor() {
    this.agentId = process.env.AZURE_AI_AGENT_ID || 'asst_vfgtaYqBddTELw8fpib91LIo';
    console.log('🏥 CardiacAgentService initialized (simplified)');
    console.log('📋 Agent ID:', this.agentId);
  }

  /**
   * Send a message to the cardiac care agent
   */
  async sendMessage(
    message: string,
    patientContext?: {
      patientId: string;
      name: string;
      email: string;
      mobile: string;
      medicalHistory?: string[];
    }
  ): Promise<AgentResponse> {
    try {
      console.log('🚀 Processing cardiac health request');
      console.log('📋 Request Details:', {
        messageLength: message.length,
        patientContext: patientContext?.name || 'Anonymous',
        timestamp: new Date().toISOString()
      });

      // NO CACHING - Route directly to Azure AI Foundry orchestration agents
      console.log('🚫 NO CACHING - Every request goes to live agents');
      
      // Import and use orchestration service
      const { cardiacOrchestrationService } = await import('./cardiacAgentOrchestration');
      return await cardiacOrchestrationService.sendMessage(message, patientContext);

    } catch (error) {
      console.log('💥 Cardiac agent error:', error);
      return {
        success: false,
        message: "I apologize, but I'm experiencing technical difficulties. Please contact your healthcare provider for immediate assistance.",
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
      message: 'Cardiac Care Assistant ready - NO CACHING, routes to live Azure AI Foundry agents'
    };
  }
}

// Export the service
// Export the service
export const cardiacAgentService = new CardiacAgentService();
export const cardiacAgent = cardiacAgentService;
export default cardiacAgent;