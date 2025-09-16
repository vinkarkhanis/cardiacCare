#!/bin/bash

echo "🚀 Starting Cardiac Care Application on Azure..."

# Set environment variables
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=${WEBSITES_PORT:-8080}

echo "📍 Environment: $NODE_ENV"
echo "🌐 Hostname: $HOSTNAME" 
echo "🔌 Port: $PORT"
echo "🏥 Node.js Version: $(node --version)"
echo "📦 NPM Version: $(npm --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Changing to correct directory..."
    cd /home/site/wwwroot
fi

echo "📁 Working Directory: $(pwd)"
echo "📂 Directory Contents:"
ls -la

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --only=production
else
    echo "✅ Dependencies already installed"
fi

# Build the application if .next doesn't exist
if [ ! -d ".next" ]; then
    echo "🔨 Building Next.js application..."
    npm run build
else
    echo "✅ Next.js application already built"
fi

# Start the application
echo "🎉 Starting Cardiac Care server..."
exec node server.js