import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions'; // Add this import

interface EditableUsernameProps {
  username: string;
  onUpdate: (newUsername: string) => Promise<boolean>;
  isUpdating?: boolean;
  language?: 'en' | 'de';
}

export const EditableUsername: React.FC<EditableUsernameProps> = ({
  username,
  onUpdate,
  isUpdating = false,
  language = 'en'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(username);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { canEditUsername } = usePermissions(); // Use centralized permission

  // Remove currentUserRole prop - use centralized permission instead
  if (!canEditUsername) {
    return <h1 className="text-3xl font-bold text-gray-600">{username}</h1>;
  }

  // Define default usernames for both languages
  const getDefaultUsername = (lang: 'en' | 'de') => {
    return lang === 'de' ? 'Noch kein Anzeigename gegeben' : 'No Username given';
  };

  const defaultUsername = getDefaultUsername(language);
  const isDefaultUsername = username === getDefaultUsername('en') || username === getDefaultUsername('de');

  const handleSave = async () => {
    // Clear any previous errors
    setError(null);
    
    // Don't save if the value is the same or just whitespace
    if (editValue.trim() === username || editValue.trim() === '') {
      setIsEditing(false);
      setEditValue(username);
      return;
    }

    // Basic validation
    if (editValue.trim().length < 2) {
      setError(language === 'de' 
        ? 'Anzeigename muss mindestens 2 Zeichen lang sein' 
        : 'Username must be at least 2 characters long'
      );
      return;
    }

    if (editValue.trim().length > 50) {
      setError(language === 'de' 
        ? 'Anzeigename muss weniger als 50 Zeichen haben' 
        : 'Username must be less than 50 characters'
      );
      return;
    }

    // Check for invalid characters (optional)
    if (!/^[a-zA-Z0-9_\s-]+$/.test(editValue.trim())) {
      setError(language === 'de' 
        ? 'Anzeigename darf nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten' 
        : 'Username can only contain letters, numbers, spaces, hyphens, and underscores'
      );
      return;
    }

    setIsSaving(true);
    try {
      const success = await onUpdate(editValue.trim());
      if (success) {
        setIsEditing(false);
        setError(null);
      } else {
        setEditValue(username); // Reset on failure
        setError(language === 'de' 
          ? 'Fehler beim Aktualisieren des Anzeigenamens. Bitte versuchen Sie es erneut.' 
          : 'Failed to update username. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Error updating username:', error);
      
      // Handle specific error cases
      if (error.message === 'USERNAME_ALREADY_EXISTS') {
        setError(language === 'de' 
          ? 'Dieser Anzeigename ist bereits vergeben. Bitte wählen Sie einen anderen.' 
          : 'This username is already taken. Please choose a different one.'
        );
      } else if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setError(language === 'de' 
          ? 'Dieser Anzeigename ist bereits vergeben. Bitte wählen Sie einen anderen.' 
          : 'This username is already taken. Please choose a different one.'
        );
      } else {
        setError(language === 'de' 
          ? 'Fehler beim Aktualisieren des Anzeigenamens. Bitte versuchen Sie es erneut.' 
          : 'Failed to update username. Please try again.'
        );
      }
      
      // Don't reset the value so user can modify it
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(username);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="flex-1 min-w-0">
            <Input
              value={editValue}
              onChange={handleInputChange}
              className={`text-2xl font-bold h-12 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
              disabled={isSaving || isUpdating}
              placeholder={language === 'de' ? 'Anzeigename eingeben...' : 'Enter username...'}
              aria-label={language === 'de' ? 'Anzeigename bearbeiten' : 'Edit username'}
              aria-describedby={error ? 'username-error' : 'username-help'}
              aria-invalid={!!error}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              autoFocus
            />
          </div>
          
          <div className="flex gap-2 flex-shrink-0" role="group" aria-label={language === 'de' ? 'Aktionen bearbeiten' : 'Edit actions'}>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isUpdating || !!error}
              className="h-12 px-4"
              aria-describedby={language === 'de' ? 'Änderungen speichern' : 'Save changes'}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                  <span className="sr-only">{language === 'de' ? 'Wird gespeichert...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" aria-hidden="true" />
                  {language === 'de' ? 'Speichern' : 'Save'}
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving || isUpdating}
              className="h-12 px-4"
              aria-label={language === 'de' ? 'Bearbeitung abbrechen' : 'Cancel editing'}
            >
              <X className="h-4 w-4 mr-1" aria-hidden="true" />
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div id="username-error" 
               className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 max-w-2xl"
               role="alert"
               aria-live="polite">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Helper text */}
        {!error && (
          <div id="username-help" className="text-sm text-gray-500 max-w-2xl">
            {language === 'de' 
              ? 'Enter zum Speichern, Escape zum Abbrechen' 
              : 'Press Enter to save, Escape to cancel'
            }
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <h1 className={`text-3xl font-bold ${isDefaultUsername ? "text-red-500 italic" : "text-gray-900"}`}
          role="heading" 
          aria-level="1">
        {username}
      </h1>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        disabled={isUpdating}
        className="h-9 w-9 p-0 hover:bg-gray-100"
        aria-label={language === 'de' ? 'Anzeigename bearbeiten' : 'Edit username'}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
};