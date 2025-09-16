# Azure Web App Deployment Guide

## 🚀 Fixed Issues

The deployment failure was caused by:
1. **Port Configuration**: Azure expects port 8080, Next.js was using 3000
2. **Missing Standalone Output**: Next.js wasn't configured for containerized deployment
3. **No Custom Server**: Azure Web App needs explicit server configuration
4. **Missing IIS Configuration**: Web.config required for Azure App Service

## ✅ Implemented Fixes

### 1. **Updated next.config.js**
- Enabled `output: 'standalone'` for Azure deployment
- Added performance optimizations
- Configured security headers
- Added environment variable handling

### 2. **Created server.js**
- Custom Node.js server that listens on port 8080
- Health check endpoint at `/health`
- Proper error handling and graceful shutdown
- Azure Web App optimized logging

### 3. **Updated package.json**
- Changed start script to use `node server.js`
- Added `postinstall` build script for Azure deployment
- Added Node.js version requirement (>=20.0.0)
- Added health check script

### 4. **Added web.config**
- IISNode configuration for Azure App Service
- URL rewriting rules for Next.js routes
- Security headers for healthcare compliance
- Static file handling optimization

## 🔧 Azure Web App Configuration

In your Azure Web App Settings, ensure these **Application Settings** are configured:

```
NODE_ENV=production
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=~20
SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Your existing environment variables
AZURE_AI_PROJECT_CONNECTION_STRING=your_connection_string
COSMOS_DB_CONNECTION_STRING=your_cosmos_connection_string
COSMOS_DB_DATABASE_NAME=cardiacPatients
COSMOS_DB_CONTAINER_NAME=patients
ORCHESTRATION_AGENT_ID=asst_t5VlAQIahpzVTRn4igahAXJO
```

## 🚀 Deployment Steps

1. **Commit and push these changes:**
   ```bash
   git add .
   git commit -m "Fix Azure Web App deployment configuration"
   git push origin main
   ```

2. **Azure will automatically redeploy** with the new configuration

3. **Monitor deployment logs** in Azure Portal > Deployment Center

4. **Test the application:**
   - Main app: `https://cardiac-care-hchkdngacbh6ehdh.eastus2-01.azurewebsites.net`
   - Health check: `https://cardiac-care-hchkdngacbh6ehdh.eastus2-01.azurewebsites.net/health`

## 🎯 Key Changes Summary

- ✅ **Port 8080**: Server now correctly listens on Azure's required port
- ✅ **Standalone Build**: Optimized for containerized deployment  
- ✅ **Custom Server**: Handles Azure Web App requirements
- ✅ **IIS Integration**: Proper web.config for Azure App Service
- ✅ **Health Monitoring**: Built-in health check endpoint
- ✅ **Error Handling**: Graceful error responses and logging
- ✅ **Security Headers**: Healthcare-appropriate security configuration

Your cardiac care application should now deploy successfully on Azure Web App! 🫀

## 🔍 Troubleshooting

If you still encounter issues:

1. **Check Application Logs** in Azure Portal
2. **Verify Environment Variables** are set correctly
3. **Test Health Endpoint**: `/health` should return 200 OK
4. **Monitor Resource Usage** in Azure metrics

The application is now properly configured for Azure Web App hosting with all necessary optimizations for healthcare applications.