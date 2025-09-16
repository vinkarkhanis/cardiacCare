import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('\n🔍 =================================');
  console.log('🔍 DEBUG ENDPOINT - ENVIRONMENT CHECK');
  console.log('🔍 =================================');
  
  try {
    // Get all environment variables (filter sensitive ones for display)
    const envVars = {
      // Azure AI Foundry Variables
      AZURE_AI_FOUNDRY_API_KEY: process.env.AZURE_AI_FOUNDRY_API_KEY ? '***SET***' : 'NOT SET',
      AZURE_AI_ORCHESTRATION_AGENT_ID: process.env.AZURE_AI_ORCHESTRATION_AGENT_ID || 'NOT SET',
      AZURE_PROJECT_NAME: process.env.AZURE_PROJECT_NAME || 'NOT SET',
      AZURE_RESOURCE_GROUP_NAME: process.env.AZURE_RESOURCE_GROUP_NAME || 'NOT SET',
      AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID || 'NOT SET',
      OPENAI_API_VERSION: process.env.OPENAI_API_VERSION || 'NOT SET',
      
      // Cosmos DB Variables
      COSMOS_DB_ENDPOINT: process.env.COSMOS_DB_ENDPOINT ? '***SET***' : 'NOT SET',
      COSMOS_DB_KEY: process.env.COSMOS_DB_KEY ? '***SET***' : 'NOT SET',
      COSMOS_DB_DATABASE_NAME: process.env.COSMOS_DB_DATABASE_NAME || 'NOT SET',
      COSMOS_DB_CONTAINER_NAME: process.env.COSMOS_DB_CONTAINER_NAME || 'NOT SET',
      
      // Azure Web App Variables
      WEBSITES_PORT: process.env.WEBSITES_PORT || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      
      // Additional Azure Variables that might be relevant
      WEBSITE_HOSTNAME: process.env.WEBSITE_HOSTNAME || 'NOT SET',
      WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME || 'NOT SET',
    };

    console.log('📊 Environment Variables Status:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Test Azure credential access
    let credentialStatus = 'NOT TESTED';
    try {
      const { DefaultAzureCredential } = await import('@azure/identity');
      const credential = new DefaultAzureCredential();
      
      // Try to get a token (this will fail if credentials aren't available)
      credentialStatus = 'CREDENTIAL OBJECT CREATED';
      console.log('✅ DefaultAzureCredential created successfully');
    } catch (credError) {
      const errorMessage = credError instanceof Error ? credError.message : 'Unknown credential error';
      credentialStatus = `CREDENTIAL ERROR: ${errorMessage}`;
      console.error('❌ DefaultAzureCredential failed:', credError);
    }

    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hostname: process.env.WEBSITE_HOSTNAME || 'localhost',
      port: process.env.WEBSITES_PORT || process.env.PORT || '8080',
      environmentVariables: envVars,
      azureCredentialStatus: credentialStatus,
      allEnvVarCount: Object.keys(process.env).length,
      message: 'Environment debug information'
    };

    console.log('📤 Sending debug response');
    console.log('🔍 =================================\n');

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('💥 Debug endpoint error:', error);
    
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}