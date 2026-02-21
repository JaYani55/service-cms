import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useProfileData } from "@/hooks/useProfileData";
import { usePermissions } from '@/hooks/usePermissions';
import { useMentorTraits, MentorTrait } from "@/hooks/useMentorTraits";
import { ProfilePhoto } from "@/components/profile/ProfilePhoto";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { AccessDenied } from "@/components/profile/AccessDenied";
import { SeaTableDataUnavailable } from "@/components/profile/SeaTableDataUnavailable";
import { RegistrationInProcess } from "@/components/profile/RegistrationInProcess";
import { EditableUsername } from '@/components/profile/EditableUsername';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, User, Construction, Mail, Database } from 'lucide-react';

type UseProfileDataReturn = ReturnType<typeof useProfileData>;
type ProfileUser = UseProfileDataReturn['user'];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const getDisplayUsername = (profile: ProfileUser, language: 'en' | 'de'): string => {
  if (isNonEmptyString(profile?.Username)) {
    return profile.Username;
  }
  return language === 'de' ? 'Noch kein Anzeigename gegeben' : 'No Username given';
};

const getInitials = (profile: ProfileUser): string => {
  if (isNonEmptyString(profile?.Username)) {
    return profile.Username.charAt(0).toUpperCase();
  }

  return 'U';
};

const formatFieldValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String).join(', ');
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const Profile = () => {
  const { language } = useTheme();
  const permissions = usePermissions();
  const { 
    isLoading,
    hasAccess,
    accessChecked,
    user,
    isRegistrationInProcess,
    updateUsername
  } = useProfileData(language);
  
  // ✅ Add local state for the current icon
  const initialAnimalIcon = isNonEmptyString(user?.selected_animal_icon) ? user?.selected_animal_icon : undefined;
  const [currentAnimalIcon, setCurrentAnimalIcon] = useState<string | undefined>(initialAnimalIcon);
  
  // ✅ Update local state when user data changes
  useEffect(() => {
    setCurrentAnimalIcon(isNonEmptyString(user?.selected_animal_icon) ? user.selected_animal_icon : undefined);
  }, [user?.selected_animal_icon]);

  // SeaTable hooks removed
  const [columnMetadata, setColumnMetadata] = useState<Record<string, unknown> | undefined>();

  // Fetch mentor traits from Supabase
  const { traits, isLoading: traitsLoading } = useMentorTraits(user?.id);

  // Use centralized permission instead of role check
  const isAdmin = permissions.canViewAdminData;

  // SeaTable metadata fetch removed
  useEffect(() => {
    setColumnMetadata({});
  }, []);

  console.log('[Profile] Render state:', {
    isLoading,
    hasAccess,
    accessChecked,
    user: user?.id,
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

  const displayUsername = getDisplayUsername(user, language);

  // Get initials for the profile photo
  const displayName = user?.Username || displayUsername || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const profileRole = user?.role;

  console.log('[Profile] Showing profile with migration notice');
  return (
    <div className="space-y-6 fade-in max-w-none">
      {/* Profile Photo + Animal Icon Hint */}
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <ProfilePhoto
            profilePictureUrl={user?.pfp_url}
            displayName={displayName}
            initials={initials}
            role={profileRole}
            isOwnProfile={true}
            language={language}
            selectedAnimalIcon={currentAnimalIcon}
            userId={user?.id}
            onImageUploaded={async (url: string) => {
              console.log('Profile picture uploaded:', url);
              // Profile picture update logic is handled in ProfilePhoto or a separate hook
            }}
          />
          {/* Red hint if no animal icon and user can change icons */}
          {!currentAnimalIcon && permissions.canChangeAnimalIcons && (
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-red-100 text-red-700 border border-red-300 rounded px-2 py-1 text-xs font-semibold shadow-md whitespace-nowrap">
              {language === 'de' ? 'Setze ein Avatar für den User!' : 'Set an avatar for the user!'}
            </span>
          )}
        </div>
      </div>

      {/* Profile Data - Supabase only */}
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
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

              {/* Email from Auth/Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-Mail:
                </div>
                <div className="sm:col-span-2 text-sm sm:text-base text-muted-foreground">
                  {user?.email || 'N/A'}
                </div>
              </div>

              {/* Traits Section from Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
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
                      {traits.map((trait: MentorTrait) => (
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
            </div>
          </div>

          {/* Under Construction Notice for SeaTable Data (Personal Info, Further Info) */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <SeaTableDataUnavailable 
              language={language} 
              userId={user?.id} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;