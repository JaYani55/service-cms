import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileImageUpload } from "./ProfileImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { ANIMAL_ICONS } from "@/constants/animalIcons";

interface ProfilePhotoProps {
  profilePictureUrl?: string;
  displayName?: string;
  initials: string;
  role?: string;
  profileOwnerRoles?: string[];
  isOwnProfile?: boolean;
  canEdit?: boolean;
  language?: 'en' | 'de';
  selectedAnimalIcon?: string;
  userId?: string;
  onImageUploaded?: (url: string) => Promise<void>;
}

export const ProfilePhoto = ({ 
  profilePictureUrl, 
  displayName, 
  initials, 
  role,
  profileOwnerRoles = [],
  isOwnProfile = false,
  canEdit = false,
  language = 'en',
  selectedAnimalIcon,
  userId,
  onImageUploaded
}: ProfilePhotoProps) => {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(selectedAnimalIcon);
  const [showIconEditor, setShowIconEditor] = useState(false); // Add this state
  
  const canChangeIcons = permissions.canChangeAnimalIcons;
  
  useEffect(() => {
    setCurrentIcon(selectedAnimalIcon);
  }, [selectedAnimalIcon]);
  
  useEffect(() => {
    setImageError(false);
  }, [profilePictureUrl, previewUrl]);
  
  const handleImageUploaded = async (url: string) => {
    setPreviewUrl(url);
    setImageError(false);
    
    try {
      if (onImageUploaded) {
        await onImageUploaded(url);
      }
      
      toast.success(
        language === 'en'
          ? 'Profile picture updated successfully'
          : 'Profilbild erfolgreich aktualisiert'
      );
    } catch (error) {
      console.error("Failed to update profile with new image URL:", error);
      toast.error(
        language === 'en'
          ? 'Failed to update profile picture'
          : 'Fehler beim Aktualisieren des Profilbilds'
      );
    }
  };

  const handleIconUploaded = async (iconId: string) => {
    setCurrentIcon(iconId);
    setShowIconEditor(false); // Close editor after selection
    
    if (onImageUploaded) {
      await onImageUploaded(iconId);
    }
  };
  
  const handleImageError = () => {
    console.error("Image failed to load:", previewUrl || profilePictureUrl);
    setImageError(true);
  };
  
  const displayUrl = previewUrl || profilePictureUrl;
  const hasAnimalIcon = currentIcon && currentIcon.trim() !== '';
  const hasValidProfilePicture = displayUrl && !imageError;
  
  const shouldShowAnimalIcon = hasAnimalIcon;
  const shouldShowProfilePicture = !hasAnimalIcon && hasValidProfilePicture;
  const shouldShowInitials = !hasAnimalIcon && !hasValidProfilePicture;

  // ✅ ADD: Focus management
  useEffect(() => {
    if (showIconEditor) {
      // When editor opens, focus the first interactive element
      const editorElement = document.getElementById('profile-icon-editor');
      const firstButton = editorElement?.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [showIconEditor]);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Profile photo with edit pencil */}
      <div className="relative">
        <Avatar className="w-32 h-32 border-4 border-primary/10"
                role="img"
                aria-label={`${displayName || 'User'} profile picture`}>
          {shouldShowAnimalIcon && (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <img 
                src={`/assets/animals/${currentIcon}.png`} 
                alt={`${displayName || 'User'}'s profile icon: ${ANIMAL_ICONS.find(icon => icon.id === currentIcon)?.name[language] || 'Animal icon'}`}
                className="w-24 h-24 object-contain"
              />
            </div>
          )}
          
          {shouldShowProfilePicture && (
            <AvatarImage 
              src={displayUrl}
              alt={`${displayName || 'User'}'s profile picture`}
              className="object-cover"
              onError={handleImageError}
            />
          )}
          
          {shouldShowInitials && (
            <AvatarFallback className="text-4xl bg-primary/10 text-primary"
                            aria-label={`${displayName || 'User'}'s initials: ${initials}`}>
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        
        {/* Edit pencil in bottom right corner */}
        {canChangeIcons && userId && (
          <button
            onClick={() => setShowIconEditor(!showIconEditor)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            aria-label={language === 'en' ? 'Edit profile icon' : 'Profil-Icon bearbeiten'}
            aria-expanded={showIconEditor}
            aria-controls="profile-icon-editor"
          >
            <Pencil className="h-4 w-4 text-gray-600" aria-hidden="true" />
          </button>
        )}
      </div>
      
      <h2 className="text-2xl font-bold mt-4" role="heading" aria-level={2}>
        {displayName || 'User'}
      </h2>
      
      {/* Show the profile owner's roles */}
      {profileOwnerRoles && profileOwnerRoles.length > 0 ? (
        <div className="flex flex-wrap gap-1 mt-2 justify-center"
             role="list"
             aria-label={language === 'en' ? 'User roles' : 'Benutzerrollen'}>
          {profileOwnerRoles.map((ownerRole, index) => (
            <Badge key={index} 
                   variant="secondary" 
                   className="text-xs capitalize"
                   role="listitem">
              {ownerRole}
            </Badge>
          ))}
        </div>
      ) : role ? (
        <Badge variant="secondary" 
               className="mt-2 capitalize"
               role="status"
               aria-label={`${language === 'en' ? 'Role' : 'Rolle'}: ${role}`}>
          {role}
        </Badge>
      ) : null}
      
      {/* Icon editor - shows when pencil is clicked */}
      {canChangeIcons && userId && showIconEditor && (
        <div 
          id="profile-icon-editor" 
          role="dialog" 
          aria-modal="false"
          aria-labelledby="icon-editor-title"
        >
          <ProfileImageUpload 
            language={language} 
            onImageUploaded={handleIconUploaded}
            userId={userId}
            currentIcon={currentIcon}
            onClose={() => {
              setShowIconEditor(false);
              // ✅ Return focus to pencil button when closing
              const pencilButton = document.querySelector('[aria-controls="profile-icon-editor"]');
              if (pencilButton) {
                (pencilButton as HTMLElement).focus();
              }
            }}
          />
        </div>
      )}
    </div>
  );
};