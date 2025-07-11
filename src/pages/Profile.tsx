import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useProfileData } from "@/hooks/useProfileData";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from '@/hooks/usePermissions';
import { useSeatableMentors } from "@/hooks/useSeatableMentors";
import { useMentorTraits } from "@/hooks/useMentorTraits";
import { ProfilePhoto } from "@/components/profile/ProfilePhoto";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { AccessDenied } from "@/components/profile/AccessDenied";
import { SeaTableDataUnavailable } from "@/components/profile/SeaTableDataUnavailable";
import { RegistrationInProcess } from "@/components/profile/RegistrationInProcess";
import { EditableUsername } from '@/components/profile/EditableUsername';
import { ColumnMetadata } from "@/types/seaTableTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, User, Database } from 'lucide-react';

const Profile = () => {
  const { language } = useTheme();
  const { user: currentUser } = useAuth();
  const permissions = usePermissions();
  const { 
    isLoading,
    hasAccess,
    accessChecked,
    user,
    seatableMentorData,
    isRegistrationInProcess,
    updateUsername
  } = useProfileData(language);
  
  // ✅ Add local state for the current icon
  const [currentAnimalIcon, setCurrentAnimalIcon] = useState(user?.selected_animal_icon);
  
  // ✅ Update local state when user data changes
  useEffect(() => {
    setCurrentAnimalIcon(user?.selected_animal_icon);
  }, [user?.selected_animal_icon]);

  // Move the hook call to the top level and memoize the options
  const seatableMentorsOptions = useMemo(() => ({}), []); // Empty options
  const { getTableMetadata } = useSeatableMentors(seatableMentorsOptions);
  const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata | undefined>();

  // Fetch mentor traits from Supabase
  const { traits, isLoading: traitsLoading } = useMentorTraits(user?.id);

  // Use centralized permission instead of role check
  const isAdmin = permissions.canViewAdminData;

  // Add debugging and prevent infinite loops
  useEffect(() => {
    console.log('[Profile] useEffect triggered', { 
      hasGetTableMetadata: !!getTableMetadata,
      isLoading,
      hasAccess,
      accessChecked 
    });
    
    // Only fetch if we have access and aren't loading
    if (!isLoading && hasAccess && accessChecked && getTableMetadata) {
      const fetchMetadata = async () => {
        try {
          console.log('[Profile] Fetching metadata...');
          const metadata = await getTableMetadata('Neue_MentorInnen');
          console.log('[Profile] Metadata fetched:', metadata);
          setColumnMetadata(metadata);
        } catch (error) {
          console.error('Error fetching column metadata:', error);
        }
      };
      
      fetchMetadata();
    }
  }, [getTableMetadata, isLoading, hasAccess, accessChecked]); // Add all dependencies

  console.log('[Profile] Render state:', {
    isLoading,
    hasAccess,
    accessChecked,
    user: user?.id,
    seatableMentorData: !!seatableMentorData,
    isRegistrationInProcess
  });

  if (isLoading) {
    console.log('[Profile] Showing skeleton');
    return <ProfileSkeleton />;
  }

  if (accessChecked && !hasAccess) {
    console.log('[Profile] Showing access denied');
    return <AccessDenied language={language} />;
  }
  
  if (isRegistrationInProcess) {
    console.log('[Profile] Showing registration in process');
    return <RegistrationInProcess 
      language={language}
    />;
  }

  if (!seatableMentorData) {
    console.log('[Profile] Showing data unavailable');
    return (
      <SeaTableDataUnavailable 
        language={language} 
        userId={user?.id} 
      />
    );
  }

  const getDisplayUsername = (user: any, language: 'en' | 'de') => {
    if (user?.Username) {
      return user.Username;
    }
    return language === 'de' ? 'Noch kein Anzeigename gegeben' : 'No Username given';
  };

  const displayUsername = getDisplayUsername(user, language);

  // Get initials for the profile photo
  const getInitials = (user: any, seatableData: any) => {
    // Try to get name from SeaTable data first
    if (seatableData?.Vorname && seatableData?.Nachname) {
      return `${seatableData.Vorname.charAt(0)}${seatableData.Nachname.charAt(0)}`.toUpperCase();
    }
    if (seatableData?.Vorname) {
      return seatableData.Vorname.charAt(0).toUpperCase();
    }
    // Fallback to username
    if (user?.Username) {
      return user.Username.charAt(0).toUpperCase();
    }
    // Final fallback
    return 'U';
  };

  const initials = getInitials(user, seatableMentorData);
  const displayName = seatableMentorData?.Vorname && seatableMentorData?.Nachname 
    ? `${seatableMentorData.Vorname} ${seatableMentorData.Nachname}`
    : displayUsername;

  // Helper function to format field values (for traits and other data)
  const formatFieldValue = (value: any, fieldName: string): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Handle arrays (multi-select fields)
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(', ');
    }

    // Handle objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    // Convert to string
    return String(value);
  };

  // Skip fields that are handled separately in personal info
  const skipFields = [
    '_id', '_ctime', '_mtime', '_creator', '_last_modifier', '_locked', '_locked_by', '_archived',
    'Vorname', 'Nachname', 'E-Mail-Adresse', // Skip these as they're shown in personal info
    'Mentor_ID' // Skip ID field
  ];

  // Get all other SeaTable fields for "Further Information"
  const furtherInfoFields = Object.keys(seatableMentorData).filter(key => {
    const value = seatableMentorData[key];
    // Filter out certain system fields and empty values for display
    if (skipFields.includes(key)) return false;
    if (value === null || value === undefined || value === '') return false;
    return true;
  });

  console.log('[Profile] Showing unified profile data');
  return (
    <div className="space-y-6 fade-in max-w-none">
      {/* Profile Photo */}
      <div className="flex justify-center">
        <ProfilePhoto
          profilePictureUrl={user?.pfp_url} // Add this
          displayName={displayName}
          initials={initials}
          role={user?.role} // ✅ Use profile owner's role, not viewer's role
          isOwnProfile={true}
          language={language}
          selectedAnimalIcon={currentAnimalIcon} // ✅ Use local state
          userId={user?.id}
          onImageUploaded={async (url: string) => {
            console.log('Profile picture uploaded:', url);
            // TODO: Save the profile picture URL to Supabase user profile
          }}
        />
      </div>

      {/* Unified Profile Data */}
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              {language === 'de' ? 'Persönliche Informationen' : 'Personal Information'}
            </h3>
            
            <div className="space-y-3">
              {/* Username from Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {language === 'de' ? 'Anzeigename:' : 'Display Name:'}
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                      Supabase
                    </Badge>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <EditableUsername
                    username={displayUsername}
                    onUpdate={updateUsername}
                    isUpdating={isLoading}
                    language={language}
                  />
                </div>
              </div>
              
              {/* Name fields from SeaTable */}
              {(seatableMentorData.Vorname || seatableMentorData.Nachname) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                  <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                    {language === 'de' ? 'Name:' : 'Name:'}
                    {isAdmin && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                        SeaTable
                      </Badge>
                    )}
                  </div>
                  <div className="sm:col-span-2 text-sm sm:text-base">
                    {[seatableMentorData.Vorname, seatableMentorData.Nachname].filter(Boolean).join(' ') || (
                      <span className="text-muted-foreground italic">
                        {language === 'de' ? 'leer' : 'empty'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Email field from SeaTable */}
              {seatableMentorData['E-Mail-Adresse'] && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                  <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                    {language === 'de' ? 'E-Mail:' : 'Email:'}
                    {isAdmin && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                        SeaTable
                      </Badge>
                    )}
                  </div>
                  <div className="sm:col-span-2 text-sm sm:text-base">
                    {seatableMentorData['E-Mail-Adresse'] || (
                      <span className="text-muted-foreground italic">
                        {language === 'de' ? 'leer' : 'empty'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Further Information */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              {language === 'de' ? 'Weitere Informationen' : 'Further Information'}
            </h3>
            
            <div className="space-y-3">
              {/* Traits Section from Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  {language === 'de' ? 'Eigenschaften:' : 'Traits:'}
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                      Supabase
                    </Badge>
                  )}
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

              {/* All other fields from SeaTable */}
              {furtherInfoFields.map(key => {
                const value = seatableMentorData[key];
                
                return (
                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {key}:
                      {isAdmin && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                          SeaTable
                        </Badge>
                      )}
                    </div>
                    <div className="sm:col-span-2 text-sm sm:text-base">
                      {formatFieldValue(value, key) || (
                        <span className="text-muted-foreground italic">
                          {language === 'de' ? 'leer' : 'empty'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;