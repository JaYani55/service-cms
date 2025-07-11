import React from 'react';
import { Loader2 } from 'lucide-react';
import { AdminCard } from './AdminCard';

interface AdminLoadingProps {
  message?: string;
  language: 'en' | 'de';
}

export const AdminLoading: React.FC<AdminLoadingProps> = ({ 
  message, 
  language 
}) => {
  const defaultMessage = language === 'en' ? 'Loading...' : 'Wird geladen...';
  
  return (
    <AdminCard className="flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-center">
          {message || defaultMessage}
        </p>
      </div>
    </AdminCard>
  );
};