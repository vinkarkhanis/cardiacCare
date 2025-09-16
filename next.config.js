/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Azure Web App deployment
  output: 'standalone',
  
  // Optimize for production deployment
  experimental: {
    optimizePackageImports: [
      '@azure/ai-projects', 
      '@azure/cosmos', 
      '@azure/identity',
      'framer-motion',
      'lucide-react'
    ]
  },
  
  // Configure environment variables for Azure
  env: {
    // Azure AI Foundry configuration
    AZURE_AI_FOUNDRY_API_KEY: process.env.AZURE_AI_FOUNDRY_API_KEY,
    AZURE_AI_ORCHESTRATION_AGENT_ID: process.env.AZURE_AI_ORCHESTRATION_AGENT_ID,
    AZURE_PROJECT_NAME: process.env.AZURE_PROJECT_NAME,
    AZURE_RESOURCE_GROUP_NAME: process.env.AZURE_RESOURCE_GROUP_NAME,
    AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,
    OPENAI_API_VERSION: process.env.OPENAI_API_VERSION,
    
    // Cosmos DB configuration
    COSMOS_DB_ENDPOINT: process.env.COSMOS_DB_ENDPOINT,
    COSMOS_DB_KEY: process.env.COSMOS_DB_KEY,
    COSMOS_DB_DATABASE_NAME: process.env.COSMOS_DB_DATABASE_NAME,
    COSMOS_DB_CONTAINER_NAME: process.env.COSMOS_DB_CONTAINER_NAME,
    
    // Port configuration
    WEBSITES_PORT: process.env.WEBSITES_PORT,
  },
  
  // Optimize for serverless and containerized environments
  poweredByHeader: false,
  
  // Configure for Azure Web App environment
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig