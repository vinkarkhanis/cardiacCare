'use client';

import { useState, useEffect } from 'react';

interface DebugInfo {
  timestamp: string;
  environment: string;
  hostname: string;
  port: string;
  environmentVariables: Record<string, string>;
  azureCredentialStatus: string;
  allEnvVarCount: number;
  message: string;
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch debug info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value: string) => {
    if (value === 'NOT SET') return 'text-red-600 bg-red-50';
    if (value.includes('***SET***')) return 'text-green-600 bg-green-50';
    if (value.includes('ERROR')) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading environment debug information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Debug Error</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDebugInfo}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">🔍 Azure Environment Debug</h1>
            <p className="text-blue-100 mt-1">Cardiac Care Application - Environment Variables Status</p>
          </div>

          {/* Basic Info */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Application Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Environment</div>
                <div className="font-semibold text-lg">{debugInfo?.environment || 'Unknown'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Hostname</div>
                <div className="font-semibold text-lg">{debugInfo?.hostname || 'Unknown'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Port</div>
                <div className="font-semibold text-lg">{debugInfo?.port || 'Unknown'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Env Vars</div>
                <div className="font-semibold text-lg">{debugInfo?.allEnvVarCount || 0}</div>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Environment Variables</h2>
            <div className="grid grid-cols-1 gap-3">
              {debugInfo?.environmentVariables && Object.entries(debugInfo.environmentVariables).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 px-4 border rounded-lg">
                  <div className="font-medium text-gray-900">{key}</div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(value)}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Azure Credential Status */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔐 Azure Credentials</h2>
            <div className={`p-4 rounded-lg ${getStatusColor(debugInfo?.azureCredentialStatus || 'NOT TESTED')}`}>
              <div className="font-medium">Status: {debugInfo?.azureCredentialStatus}</div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="p-6 bg-gray-50">
            <div className="text-sm text-gray-600">
              Last updated: {debugInfo?.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : 'Unknown'}
            </div>
            <button
              onClick={fetchDebugInfo}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Troubleshooting Guide</h3>
          <div className="text-yellow-700 space-y-2">
            <p><strong>If environment variables show &ldquo;NOT SET&rdquo;:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Check Azure Web App Configuration → Application Settings</li>
              <li>Ensure all required environment variables are configured</li>
              <li>Restart the Azure Web App after making changes</li>
              <li>Verify the variable names match exactly (case-sensitive)</li>
            </ul>
            <p className="mt-4"><strong>If Azure credentials show errors:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Check if Managed Identity is enabled for the Azure Web App</li>
              <li>Verify the Azure AI Foundry resource permissions</li>
              <li>Ensure the Web App has access to the Azure AI project</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}