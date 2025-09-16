# Azure Web App Deployment Guide

## � **CRITICAL: Deployment Issues Fixed**

The deployment failure was caused by:
1. **Build Process**: Azure wasn't building the Next.js app properly
2. **Script Configuration**: Wrong startup script being used
3. **Environment Setup**: Missing production build configuration

## ✅ **Latest Fixes Applied**

### 1. **Fixed Package.json Scripts**
- ✅ Removed problematic `postinstall` script
- ✅ Added `azure:build` for proper Azure deployment
- ✅ Ensured `start` script uses `node server.js`

### 2. **Enhanced Server.js**
- ✅ Auto-detection of built application
- ✅ Automatic build process if needed
- ✅ Better error handling and logging
- ✅ Fallback to development mode if build fails

### 3. **Azure Deployment Scripts**
- ✅ Added `.deployment` file for Azure
- ✅ Added `deploy.sh` for proper build process
- ✅ Added `startup.sh` for container startup

## 🔧 **Azure Web App Configuration Required**

### **Application Settings** (Environment Variables)
```
NODE_ENV=production
WEBSITES_PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=~20
SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Your Azure AI Foundry variables
AZURE_AI_FOUNDRY_API_KEY=your_api_key
AZURE_AI_ORCHESTRATION_AGENT_ID=asst_t5VlAQIahpzVTRn4igahAXJO
AZURE_PROJECT_NAME=cardiac-care
AZURE_RESOURCE_GROUP_NAME=your_resource_group
AZURE_SUBSCRIPTION_ID=your_subscription_id
OPENAI_API_VERSION=2024-12-01-preview

# Cosmos DB variables
COSMOS_DB_ENDPOINT=your_cosmos_endpoint
COSMOS_DB_KEY=your_cosmos_key
COSMOS_DB_DATABASE_NAME=CardiacHealthDB
COSMOS_DB_CONTAINER_NAME=patients
```

### **Startup Command** (In Azure Portal)
Set the startup command to:
```
node server.js
```

## 🚀 **Deployment Process**

1. **Push to Repository:**
   ```bash
   git add .
   git commit -m "Fix Azure deployment configuration"
   git push origin main
   ```

2. **Azure will automatically:**
   - Pull the code
   - Run `npm install --production`
   - Run `npm run build` (via deploy.sh)
   - Start with `node server.js`

3. **Monitor Logs:**
   - Check Azure Portal → Deployment Center → Logs
   - Check Application Logs for runtime issues

## 🔍 **Troubleshooting Steps**

### **If still getting "next: not found" error:**

1. **Check Startup Command in Azure Portal:**
   - Go to Configuration → General Settings
   - Set Startup Command: `node server.js`

2. **Enable Logging:**
   - Go to App Service logs
   - Enable Application Logging (Filesystem)
   - Set to "Information" level

3. **Verify Build Process:**
   - Check Deployment Center logs
   - Ensure `npm run build` completed successfully
   - Verify `.next` folder exists after deployment

### **Manual Build Verification:**
If automatic build fails, you can manually build:
```bash
# SSH into Azure Web App (Advanced Tools → SSH)
cd /home/site/wwwroot
npm install
npm run build
node server.js
```