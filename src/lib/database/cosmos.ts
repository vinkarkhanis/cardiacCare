import { CosmosClient, Database, Container } from '@azure/cosmos'

const endpoint = process.env.COSMOS_DB_ENDPOINT
const key = process.env.COSMOS_DB_KEY
const databaseId = process.env.COSMOS_DB_DATABASE_NAME || 'patient_data'
const containerId = process.env.COSMOS_DB_CONTAINER_NAME || 'patient_data'

if (!endpoint || !key) {
  throw new Error('Azure Cosmos DB configuration is missing. Please set COSMOS_DB_ENDPOINT and COSMOS_DB_KEY environment variables.')
}

const client = new CosmosClient({ endpoint, key })

let database: Database | null = null
let container: Container | null = null

async function initDatabase() {
  try {
    // Only initialize if not already done
    if (!database || !container) {
      console.log('Initializing database connection...')
      
      // Create database if it doesn't exist
      const { database: db } = await client.databases.createIfNotExists({
        id: databaseId
      })
      database = db

      // Create container if it doesn't exist
      const { container: cont } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey: {
          paths: ['/patientId']
        }
      })
      container = cont

      console.log('Database and container initialized successfully')
    }
    
    return { database, container }
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// Function to get existing connection or create new one
async function getDatabase() {
  if (!database || !container) {
    await initDatabase()
  }
  return { database: database!, container: container! }
}

export { client, initDatabase, getDatabase, database, container, databaseId, containerId }