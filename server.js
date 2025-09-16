const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Determine environment and configuration
const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.WEBSITES_PORT, 10) || parseInt(process.env.PORT, 10) || 8080

console.log(`🚀 Starting Cardiac Care Application...`)
console.log(`📍 Environment: ${dev ? 'development' : 'production'}`)
console.log(`🌐 Hostname: ${hostname}`)
console.log(`🔌 Port: ${port}`)
console.log(`🏥 Node.js Version: ${process.version}`)

// Create the Next.js application
const app = next({ 
  dev, 
  hostname, 
  port,
  // Use custom directory for Azure Web App
  dir: process.cwd()
})

const handle = app.getRequestHandler()

// Health check endpoint for Azure Web App
const healthCheck = (req, res) => {
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'cardiac-care-app',
      port: port,
      environment: process.env.NODE_ENV || 'development'
    }))
    return true
  }
  return false
}

// Initialize the application
app.prepare().then(() => {
  console.log(`✅ Next.js application prepared successfully`)
  
  const server = createServer(async (req, res) => {
    try {
      // Handle health check requests
      if (healthCheck(req, res)) {
        return
      }

      // Log incoming requests in development
      if (dev) {
        console.log(`📥 ${req.method} ${req.url}`)
      }

      // Parse the request URL
      const parsedUrl = parse(req.url, true)
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl)
      
    } catch (err) {
      console.error('❌ Error occurred handling request:', req.url, err)
      
      // Send error response
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ 
          error: 'Internal server error',
          message: dev ? err.message : 'Something went wrong',
          timestamp: new Date().toISOString()
        }))
      }
    }
  })

  // Handle server errors
  server.on('error', (err) => {
    console.error('🚨 Server error:', err)
    
    // Exit gracefully on critical errors
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use`)
      process.exit(1)
    }
  })

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received, shutting down gracefully...')
    server.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('📴 SIGINT received, shutting down gracefully...')
    server.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  })

  // Start listening
  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err)
      process.exit(1)
    }
    
    console.log('')
    console.log('🎉 ================================')
    console.log('🫀 CARDIAC CARE APP STARTED')
    console.log('🎉 ================================')
    console.log(`🌐 Server: http://${hostname}:${port}`)
    console.log(`🏥 Health: http://${hostname}:${port}/health`)
    console.log(`⚡ Ready for Azure Web App!`)
    console.log('🎉 ================================')
    console.log('')
  })

}).catch((err) => {
  console.error('❌ Failed to start application:', err)
  process.exit(1)
})