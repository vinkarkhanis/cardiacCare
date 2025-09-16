import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('\n🔧 =================================');
  console.log('🔧 AZURE AI FOUNDRY TEST ENDPOINT');
  console.log('🔧 =================================');
  
  const results: {
    timestamp: string;
    environment: Record<string, string>;
    tests: Record<string, string>;
    errors: string[];
  } = {
    timestamp: new Date().toISOString(),
    environment: {
      AZURE_AI_FOUNDRY_PROJECT_ENDPOINT: process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 'NOT SET',
      AZURE_AI_ORCHESTRATION_AGENT_ID: process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 'NOT SET',
      AZURE_AI_FOUNDRY_API_KEY: process.env.AZURE_AI_FOUNDRY_API_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    },
    tests: {
      environmentVariables: 'CHECKING...',
      azureCredential: 'CHECKING...',
      aiProjectClient: 'CHECKING...',
      agentConnection: 'CHECKING...'
    },
    errors: []
  };

  // Test 1: Check environment variables
  console.log('🔍 Test 1: Environment Variables');
  const requiredVars = ['AZURE_AI_FOUNDRY_PROJECT_ENDPOINT', 'AZURE_AI_ORCHESTRATION_AGENT_ID'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    results.tests.environmentVariables = 'PASS ✅';
    console.log('✅ All required environment variables are set');
  } else {
    results.tests.environmentVariables = `FAIL ❌ - Missing: ${missingVars.join(', ')}`;
    results.errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
    console.log('❌ Missing environment variables:', missingVars);
  }

  // Test 2: Azure Credential
  console.log('🔍 Test 2: Azure Credential');
  try {
    const { DefaultAzureCredential } = await import('@azure/identity');
    const credential = new DefaultAzureCredential();
    results.tests.azureCredential = 'PASS ✅ - Credential object created';
    console.log('✅ Azure credential created successfully');
  } catch (credError) {
    const errorMsg = credError instanceof Error ? credError.message : 'Unknown credential error';
    results.tests.azureCredential = `FAIL ❌ - ${errorMsg}`;
    results.errors.push(`Azure credential error: ${errorMsg}`);
    console.log('❌ Azure credential error:', errorMsg);
  }

  // Test 3: AI Project Client
  console.log('🔍 Test 3: AI Project Client');
  try {
    const { AIProjectClient } = await import('@azure/ai-projects');
    const { DefaultAzureCredential } = await import('@azure/identity');
    
    const endpoint = process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT || 'https://cardiac-care-resource.services.ai.azure.com/api/projects/cardiac-care';
    const credential = new DefaultAzureCredential();
    
    const projectClient = new AIProjectClient(endpoint, credential);
    results.tests.aiProjectClient = 'PASS ✅ - Client created successfully';
    console.log('✅ AI Project Client created successfully');
    console.log('🔗 Endpoint used:', endpoint);
    
    // Test 4: Agent Connection
    console.log('🔍 Test 4: Agent Connection Test');
    try {
      const agentId = process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 'asst_t5VlAQIahpzVTRn4igahAXJO';
      
      // Create a test thread
      const thread = await projectClient.agents.threads.create();
      console.log('✅ Thread created:', thread.id);
      
      // Try to add a test message
      await projectClient.agents.messages.create(thread.id, 'user', 'Test connection');
      console.log('✅ Test message added');
      
      // Try to create a run (this will test if the agent exists and is accessible)
      const run = await projectClient.agents.runs.create(thread.id, agentId);
      console.log('✅ Run created:', run.id);
      
      results.tests.agentConnection = 'PASS ✅ - Agent responding';
      console.log('✅ Agent connection test successful');
      
    } catch (agentError) {
      const errorMsg = agentError instanceof Error ? agentError.message : 'Unknown agent error';
      results.tests.agentConnection = `FAIL ❌ - ${errorMsg}`;
      results.errors.push(`Agent connection error: ${errorMsg}`);
      console.log('❌ Agent connection error:', errorMsg);
      
      // Log more details about the agent error
      if (agentError instanceof Error) {
        console.log('📝 Agent error details:', {
          name: agentError.name,
          message: agentError.message,
          stack: agentError.stack?.substring(0, 500)
        });
      }
    }
    
  } catch (clientError) {
    const errorMsg = clientError instanceof Error ? clientError.message : 'Unknown client error';
    results.tests.aiProjectClient = `FAIL ❌ - ${errorMsg}`;
    results.errors.push(`AI Project Client error: ${errorMsg}`);
    console.log('❌ AI Project Client error:', errorMsg);
  }

  console.log('🔧 =================================');
  console.log('📊 FINAL TEST RESULTS:');
  Object.entries(results.tests).forEach(([test, result]) => {
    console.log(`   ${test}: ${result}`);
  });
  
  if (results.errors.length > 0) {
    console.log('🚫 ERRORS FOUND:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  console.log('🔧 =================================\n');

  // Determine overall status
  const overallStatus = results.errors.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND';
  const statusCode = results.errors.length === 0 ? 200 : 500;

  return NextResponse.json({
    status: overallStatus,
    ...results
  }, { status: statusCode });
}