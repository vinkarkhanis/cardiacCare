/**
 * Cardiac Orchestration Agent Service - NO CACHING, LIVE AGENT CALLS ONLY
 * Routes queries to specialized Azure AI Foundry agents for every request
 */

import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';

interface AgentResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface SpecializedAgent {
  id: string;
  name: string;
  description: string;
}

export class CardiacOrchestrationService {
  private projectClient: AIProjectClient;
  private orchestrationAgentId: string;
  private specializedAgents: SpecializedAgent[];
  private openAIClient: any = null;

  constructor(projectEndpoint?: string) {
    // Initialize Azure AI Projects client using environment variables
    const endpoint = projectEndpoint || process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT;
    if (!endpoint) {
      throw new Error('Azure AI Foundry project endpoint is required. Set AZURE_AI_FOUNDRY_PROJECT_ENDPOINT environment variable.');
    }

    this.projectClient = new AIProjectClient(
      endpoint,
      new DefaultAzureCredential()
    );

    // Set the main orchestration agent ID from environment variables
    this.orchestrationAgentId = process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || '';
    if (!this.orchestrationAgentId) {
      throw new Error('Orchestration agent ID is required. Set AZURE_AI_ORCHESTRATION_AGENT_ID environment variable.');
    }

    // Define specialized agents using environment variables
    this.specializedAgents = [
      {
        id: process.env.AZURE_AI_NURSING_AGENT_ID || '',
        name: 'cardiac_nursing_agent',
        description: 'Cardiac nursing care and patient support'
      },
      {
        id: process.env.AZURE_AI_EXERCISE_AGENT_ID || '',
        name: 'cardiac_exercise_agent',
        description: 'Cardiac exercise and rehabilitation guidance'
      },
      {
        id: process.env.AZURE_AI_DIET_AGENT_ID || '',
        name: 'cardiac_diet_agent',
        description: 'Cardiac diet and nutrition advice'
      },
      {
        id: process.env.AZURE_AI_MEDICATION_AGENT_ID || '',
        name: 'cardiac_medication_agent',
        description: 'Cardiac medication management and guidance'
      }
    ];

    // Validate that all agent IDs are configured
    const missingAgents = this.specializedAgents.filter(agent => !agent.id);
    if (missingAgents.length > 0) {
      throw new Error(`Missing agent IDs for: ${missingAgents.map(a => a.name).join(', ')}. Please configure the corresponding environment variables.`);
    }

    console.log('🏥 Cardiac Orchestration Agent initialized - NO CACHING, LIVE AGENT CALLS ONLY');
    console.log('🎭 Orchestration Agent ID:', this.orchestrationAgentId);
    console.log('🔗 Specialized Agents:', this.specializedAgents.map(a => a.name));
  }

  /**
   * Initialize OpenAI client (called lazily)
   */
  private async getOpenAIClient() {
    if (!this.openAIClient) {
      console.log('🔧 Initializing Azure OpenAI client...');
      this.openAIClient = await this.projectClient.getAzureOpenAIClient({
        apiVersion: process.env.OPENAI_API_VERSION || "2024-12-01-preview"
      });
      console.log('✅ Azure OpenAI client initialized');
    }
    return this.openAIClient;
  }

  /**
   * Send a message to the cardiac care orchestration system - NO CACHING!
   * Every request goes directly to Azure AI Foundry agents
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
      console.log('\n🎭 =================================');
      console.log('🎭 CARDIAC ORCHESTRATION STARTED - LIVE AGENT CALL');
      console.log('🎭 =================================');
      console.log('📝 Query:', message);
      console.log('👤 Patient:', patientContext?.name || 'Anonymous');
      console.log('🚫 NO CACHING - Direct agent communication only');

      // Classify the query to route to appropriate specialist
      const classification = this.classifyQuery(message);
      console.log('🔍 Query Classification:', classification);

      // Route to the most appropriate specialist first
      if (classification.category !== 'general' && classification.confidence > 0.05) {
        console.log('🎯 Routing to', classification.category, 'specialist...');
        const specialistAgent = this.getSpecialistAgent(classification.category);
        if (specialistAgent) {
          console.log('🎯 Calling', specialistAgent.name, `(${specialistAgent.id})...`);
          const response = await this.callSpecializedAgent(specialistAgent.id, message, patientContext);
          if (response.success) {
            return response;
          } else {
            console.log('⚠️ Specialist failed, trying fallback cascade...');
          }
        }
      }

      // Fallback: Try all agents in cascade
      console.log('🔄 Initiating fallback cascade through all agents...');
      const cascadeResponse = await this.cascadeThroughAgents(message, patientContext);
      if (cascadeResponse.success) {
        return cascadeResponse;
      }

      // Final fallback: Return protocol message
      console.log('🚫 No agents provided response - returning protocol message');
      return {
        success: true,
        message: 'Sorry, this question cannot be answered at this moment. Please contact your healthcare provider for assistance.'
      };

    } catch (error) {
      console.log('💥 Orchestration error:', error);
      return {
        success: false,
        message: 'System error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Call a specific specialized Azure AI Foundry agent - WORKING IMPLEMENTATION
   */
  private async callSpecializedAgent(
    agentId: string, 
    message: string, 
    patientContext?: any
  ): Promise<AgentResponse> {
    try {
      console.log(`📤 AZURE AI FOUNDRY AGENT CALL TO ${agentId}:`, message.substring(0, 50) + '...');
      
      // Map agent IDs to roles for context
      const agentRoles: Record<string, string> = {
        'asst_D0M6yedHC1F4ChVjMJN931Uk': 'Cardiac Nursing Specialist',
        'asst_1kQBSif36F0mWMTALMLT4rj5': 'Cardiac Exercise Specialist', 
        'asst_DkqnIem7WvxBrSdvPWd91xMe': 'Cardiac Diet and Nutrition Specialist',
        'asst_pd3L2NT8eBacDuqCHcYlfVho': 'Cardiac Medication Specialist'
      };

      const role = agentRoles[agentId] || 'Cardiac Specialist';

      // Create specialized message with patient context
      const specialistMessage = `You are a ${role} responding to a cardiac patient's question. Please provide expert medical guidance.

Patient Question: ${message}

Patient Information: ${patientContext?.name ? `Patient: ${patientContext.name}` : 'Anonymous Patient'}${patientContext?.medicalHistory ? `, Medical History: ${patientContext.medicalHistory.join(', ')}` : ''}

Please provide a comprehensive, professional medical response appropriate for this specialization area. Include specific recommendations, precautions, and when to seek further medical attention.`;

      // WORKING AZURE AI FOUNDRY AGENT API CALLS
      const thread = await this.projectClient.agents.threads.create();
      console.log('🧵 Created Azure AI Foundry agent thread:', thread.id);

      await this.projectClient.agents.messages.create(thread.id, 'user', specialistMessage);
      console.log('📝 Message added to Azure AI Foundry agent thread');

      const run = await this.projectClient.agents.runs.create(thread.id, agentId);
      console.log('🏃 Started Azure AI Foundry agent run:', run.id);

      // Wait for completion with timeout
      let runStatus = await this.projectClient.agents.runs.get(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30;

      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        if (attempts >= maxAttempts) {
          console.log('⏰ Azure AI Foundry agent run timeout after 30 attempts');
          return { success: false, message: 'Agent response timeout' };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.projectClient.agents.runs.get(thread.id, run.id);
        attempts++;
        console.log(`⏳ Azure AI Foundry agent run status: ${runStatus.status} (attempt ${attempts}/${maxAttempts})`);
      }

      if (runStatus.status === 'completed') {
        // Get the Azure AI Foundry agent's response
        const messages = await this.projectClient.agents.messages.list(thread.id);
        
        // Handle PagedAsyncIterableIterator
        for await (const agentMessage of messages) {
          if (agentMessage.role === 'assistant') {
            if (agentMessage.content && agentMessage.content.length > 0) {
              const responseContent = agentMessage.content[0] as any;
              if (responseContent.type === 'text') {
                // Extract text content (handle different possible structures)
                const responseText = responseContent.text?.value || responseContent.text || responseContent.content || 'No text content';
                console.log(`📥 ${role} response via Azure AI Foundry:`, String(responseText).substring(0, 100) + '...');
                return {
                  success: true,
                  message: String(responseText)
                };
              }
            }
          }
        }
      }

      console.log(`❌ Azure AI Foundry agent ${role} failed. Status: ${runStatus.status}`);
      return { success: false, message: 'Azure AI Foundry agent response failed' };

    } catch (error) {
      console.log(`💥 Error calling Azure AI Foundry agent ${agentId}:`, error);
      return { 
        success: false, 
        message: 'Azure AI Foundry agent communication error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Try all specialized agents in cascade
   */
  private async cascadeThroughAgents(message: string, patientContext?: any): Promise<AgentResponse> {
    console.log('🔄 Cascading through all specialized agents...');
    
    for (const agent of this.specializedAgents) {
      console.log(`🔄 Trying ${agent.name}...`);
      const response = await this.callSpecializedAgent(agent.id, message, patientContext);
      if (response.success && response.message && response.message.length > 50) {
        console.log(`✅ ${agent.name} provided adequate response`);
        return response;
      } else {
        console.log(`❌ ${agent.name} did not provide adequate response`);
      }
    }
    
    return { success: false, message: 'No agents provided adequate response' };
  }

  /**
   * Classify query to determine routing
   */
  private classifyQuery(message: string): { category: string; confidence: number; keywords: string[] } {
    const lowerMessage = message.toLowerCase();
    
    // Exercise/Physical Activity
    const exerciseKeywords = ['exercise', 'activity', 'physical', 'walk', 'run', 'gym', 'workout', 'cardio', 'rehab'];
    const exerciseMatches = exerciseKeywords.filter(keyword => lowerMessage.includes(keyword));
    
    // Diet/Nutrition
    const dietKeywords = ['diet', 'food', 'eat', 'nutrition', 'salt', 'sodium', 'weight', 'meal'];
    const dietMatches = dietKeywords.filter(keyword => lowerMessage.includes(keyword));
    
    // Medication
    const medicationKeywords = ['medication', 'drug', 'pill', 'medicine', 'dose', 'prescription', 'beta blocker', 'ace inhibitor'];
    const medicationMatches = medicationKeywords.filter(keyword => lowerMessage.includes(keyword));
    
    // Nursing/Symptoms
    const nursingKeywords = ['pain', 'symptom', 'chest', 'shortness', 'breath', 'fatigue', 'swelling', 'heart rate'];
    const nursingMatches = nursingKeywords.filter(keyword => lowerMessage.includes(keyword));
    
    // Determine best category
    const scores: Record<string, number> = {
      exercise: exerciseMatches.length / exerciseKeywords.length,
      diet: dietMatches.length / dietKeywords.length,
      medication: medicationMatches.length / medicationKeywords.length,
      nursing: nursingMatches.length / nursingKeywords.length
    };
    
    const maxCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const maxScore = scores[maxCategory];
    
    if (maxScore > 0) {
      return {
        category: maxCategory,
        confidence: maxScore,
        keywords: maxCategory === 'exercise' ? exerciseMatches :
                 maxCategory === 'diet' ? dietMatches :
                 maxCategory === 'medication' ? medicationMatches : nursingMatches
      };
    }
    
    return { category: 'general', confidence: 0, keywords: [] };
  }

  /**
   * Get specialist agent by category
   */
  private getSpecialistAgent(category: string): SpecializedAgent | null {
    const categoryMap: Record<string, string> = {
      'exercise': 'cardiac_exercise_agent',
      'diet': 'cardiac_diet_agent',
      'medication': 'cardiac_medication_agent',
      'nursing': 'cardiac_nursing_agent'
    };
    
    const agentName = categoryMap[category];
    return this.specializedAgents.find(agent => agent.name === agentName) || null;
  }

  /**
   * Get agent status
   */
  async getAgentStatus(): Promise<{ status: string; message: string }> {
    return {
      status: 'active',
      message: 'Cardiac Orchestration Agent ready - Live agent calls only, no caching'
    };
  }
}

// Export a singleton instance
export const cardiacOrchestrationService = new CardiacOrchestrationService();