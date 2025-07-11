import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

export const SeaTableDebug: React.FC = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    setEnvVars({
      VITE_SEATABLE_API_KEY: import.meta.env.VITE_SEATABLE_API_KEY || '',
      NODE_ENV: import.meta.env.NODE_ENV || '',
      MODE: import.meta.env.MODE || ''
    });
  }, []);

  const hasApiKey = !!envVars.VITE_SEATABLE_API_KEY;

  return (
    <div className="space-y-4">
      <Card className="mb-4 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm">SeaTable Environment Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-mono">{key}:</span>
                <span className="font-mono">
                  {key.includes('API_KEY') && value 
                    ? `${value.substring(0, 10)}...` 
                    : value || 'undefined'
                  }
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!hasApiKey && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>SeaTable API Key Missing!</strong>
            <br />
            Please add your SeaTable API key to your .env file:
            <br />
            <code className="bg-red-100 px-1 rounded">VITE_SEATABLE_API_KEY=your_api_key_here</code>
            <br />
            <small>Note: You only need the API key. Base UUID and Server URL will be fetched automatically.</small>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};