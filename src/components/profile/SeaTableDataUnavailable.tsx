import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { usePermissions } from '@/hooks/usePermissions';

interface SeaTableDataUnavailableProps {
  language: 'en' | 'de';
  userId?: string;
  onRetry?: () => void;
}

export const SeaTableDataUnavailable: React.FC<SeaTableDataUnavailableProps> = ({
  language,
  userId,
  onRetry
}) => {
  const permissions = usePermissions();
  
  return (
    <Card className="p-6 shadow-md border border-amber-200 bg-amber-50">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {language === 'en' ? 'SeaTable Data Unavailable' : 'SeaTable-Daten nicht verfügbar'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <p className="text-amber-700 mb-4">
          {language === 'en' 
            ? `The additional mentor data for user ID ${userId || 'unknown'} could not be loaded from SeaTable.` 
            : `Die zusätzlichen Mentor-Daten für Benutzer-ID ${userId || 'unbekannt'} konnten nicht aus SeaTable geladen werden.`}
        </p>
        {permissions.canViewAdminData && (
          <>
            <p className="text-sm text-amber-600 mb-4">
              {language === 'en'
                ? 'Please check the SeaTable API integration or verify that this user has a corresponding record in the SeaTable database.'
                : 'Bitte überprüfen Sie die SeaTable-API-Integration oder stellen Sie sicher, dass dieser Benutzer einen entsprechenden Eintrag in der SeaTable-Datenbank hat.'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/seatable-debug', '_blank')}
                className="text-amber-700 border-amber-300"
              >
                {language === 'en' ? 'Open API Debugger' : 'API-Debugger öffnen'}
              </Button>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="text-amber-700 border-amber-300"
                >
                  {language === 'en' ? 'Retry' : 'Erneut versuchen'}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};