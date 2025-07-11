import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Tags } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { EditableUsername } from '@/components/profile/EditableUsername';
import { useMentorTraits } from '@/hooks/useMentorTraits';
import { usePermissions } from '@/hooks/usePermissions';

interface SupabaseProfileDataProps {
  username: string;
  onUpdateUsername: (username: string) => Promise<boolean>;
  isUpdating: boolean;
  language: 'en' | 'de';
  userId?: string;
}

export const SupabaseProfileData: React.FC<SupabaseProfileDataProps> = ({
  username,
  onUpdateUsername,
  isUpdating,
  language,
  userId
}) => {
  const permissions = usePermissions();
  // Fetch mentor traits
  const { traits, isLoading: traitsLoading } = useMentorTraits(userId);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          {language === 'de' ? 'Benutzerdaten' : 'User Data'}
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
            Supabase
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Username */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b border-gray-100">
            <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {language === 'de' ? 'Anzeigename:' : 'Display Name:'}
            </div>
            <div className="sm:col-span-2">
              <EditableUsername
                username={username}
                onUpdate={onUpdateUsername}
                isUpdating={isUpdating}
                language={language}
              />
            </div>
          </div>

          {/* Traits - only show if user has permission to view them */}
          {permissions.canViewAdminData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b border-gray-100 last:border-b-0">
              <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                <Tags className="h-4 w-4" />
                {language === 'de' ? 'Eigenschaften:' : 'Traits:'}
              </div>
              <div className="sm:col-span-2">
                {traitsLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      {language === 'de' ? 'Lade...' : 'Loading...'}
                    </span>
                  </div>
                ) : traits.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {traits.map((trait) => (
                      <Badge 
                        key={trait.id} 
                        variant="secondary"
                        className="text-xs"
                        title={trait.description || undefined}
                      >
                        {trait.group_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic text-sm sm:text-base">
                    {language === 'de' ? 'Keine Eigenschaften zugewiesen' : 'No traits assigned'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};