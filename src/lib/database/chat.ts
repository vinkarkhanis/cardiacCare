import { CosmosClient, Database, Container } from '@azure/cosmos'

const endpoint = process.env.COSMOS_DB_ENDPOINT
const key = process.env.COSMOS_DB_KEY
const databaseId = process.env.COSMOS_DB_DATABASE_NAME || 'patient_data'
const chatContainerId = process.env.COSMOS_DB_CHAT_CONTAINER_NAME || 'patient_chat'

if (!endpoint || !key) {
  throw new Error('Azure Cosmos DB configuration is missing. Please set COSMOS_DB_ENDPOINT and COSMOS_DB_KEY environment variables.')
}

const client = new CosmosClient({ endpoint, key })

let database: Database | null = null
let chatContainer: Container | null = null

async function initChatDatabase() {
  try {
    // Only initialize if not already done
    if (!database || !chatContainer) {
      console.log('Initializing chat database connection...')
      
      // Create database if it doesn't exist
      const { database: db } = await client.databases.createIfNotExists({
        id: databaseId
      })
      database = db

      // Create patient_chat container if it doesn't exist
      // Using patientId as partition key for optimal performance
      const { container: cont } = await database.containers.createIfNotExists({
        id: chatContainerId,
        partitionKey: {
          paths: ['/patientId']  // patientId as foreign key and partition key
        },
        indexingPolicy: {
          indexingMode: "consistent",
          automatic: true,
          includedPaths: [
            {
              path: "/*"
            }
          ],
          excludedPaths: [
            {
              path: "/content/*"  // Exclude message content from indexing for performance
            }
          ]
        }
      })
      chatContainer = cont

      console.log('Chat database and container initialized successfully')
      console.log(`Database: ${databaseId}, Chat Container: ${chatContainerId}`)
    }
    
    return { database, chatContainer }
  } catch (error) {
    console.error('Error initializing chat database:', error)
    throw error
  }
}

// Function to get existing connection or create new one
async function getChatDatabase() {
  if (!database || !chatContainer) {
    await initChatDatabase()
  }
  return { database: database!, chatContainer: chatContainer! }
}

export { 
  client, 
  initChatDatabase, 
  getChatDatabase, 
  database, 
  chatContainer, 
  databaseId, 
  chatContainerId 
}