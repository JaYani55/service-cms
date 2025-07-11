import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Tags, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MentorGroup, updateMentorTraits, getMentorTraits } from '@/services/mentorGroupService';
import { usePermissions } from '@/hooks/usePermissions';
// Import our consistent admin components
import { AdminCard, AdminLoading } from '@/components/admin/ui';
import { SaveButton, CancelButton } from '@/components/admin/ui';

interface Mentor {
  id: string;
  name: string;
  email?: string;
  profilePic?: string;
}

interface TraitAssignmentProps {
  mentor: Mentor;
  availableTraits: MentorGroup[];
  language: 'en' | 'de';
  onClose: () => void;
  onUpdate: () => void;
  getInitials: (name: string) => string;
}

export const TraitAssignment: React.FC<TraitAssignmentProps> = ({
  mentor,
  availableTraits,
  language,
  onClose,
  onUpdate,
  getInitials
}) => {
  const { canManageTraits } = usePermissions();
  const [selectedTraits, setSelectedTraits] = useState<number[]>([]);
  const [originalTraits, setOriginalTraits] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadMentorTraits = async () => {
      setIsLoading(true);
      const traits = await getMentorTraits(mentor.id);
      setSelectedTraits(traits);
      setOriginalTraits(traits);
      setIsLoading(false);
    };

    loadMentorTraits();
  }, [mentor.id]);

  const handleTraitToggle = (traitId: number, checked: boolean) => {
    setSelectedTraits(prev => 
      checked 
        ? [...prev, traitId]
        : prev.filter(id => id !== traitId)
    );
  };

  const handleSave = async () => {
    if (!canManageTraits) return;
    
    setIsSaving(true);
    
    const success = await updateMentorTraits(mentor.id, selectedTraits);
    
    if (success) {
      toast.success(
        language === 'en' 
          ? 'Traits updated successfully' 
          : 'Eigenschaften erfolgreich aktualisiert'
      );
      setOriginalTraits(selectedTraits);
      onUpdate();
    } else {
      toast.error(
        language === 'en' 
          ? 'Failed to update traits' 
          : 'Fehler beim Aktualisieren der Eigenschaften'
      );
    }
    
    setIsSaving(false);
  };

  const handleCancel = () => {
    setSelectedTraits(originalTraits);
    onClose();
  };

  const hasChanges = JSON.stringify(selectedTraits.sort()) !== JSON.stringify(originalTraits.sort());

  // Filter traits based on search
  const filteredTraits = availableTraits.filter(trait =>
    trait.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trait.description && trait.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return <AdminLoading language={language} message={language === 'en' ? 'Loading mentor traits...' : 'Lade Mentor-Eigenschaften...'} />;
  }

  if (!canManageTraits) {
    return (
      <AdminCard className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center p-6">
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'You do not have permission to manage traits' 
              : 'Sie haben keine Berechtigung, Eigenschaften zu verwalten'}
          </p>
          <CancelButton onClick={onClose}>
            {language === 'en' ? 'Close' : 'Schließen'}
          </CancelButton>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <AdminCard 
        icon={User}
        iconColor="from-blue-500 to-blue-600"
        title={mentor.name}
        actions={
          <CancelButton onClick={handleCancel}>
            {language === 'en' ? 'Close' : 'Schließen'}
          </CancelButton>
        }
        className="flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={mentor.profilePic} alt={mentor.name} />
            <AvatarFallback className="bg-primary/10">
              {getInitials(mentor.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            {mentor.email && (
              <p className="text-sm text-muted-foreground">{mentor.email}</p>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Current traits display */}
      <AdminCard 
        icon={Tags}
        iconColor="from-purple-500 to-purple-600"
        title={language === 'en' ? 'Selected Traits' : 'Ausgewählte Eigenschaften'}
        actions={
          <Badge variant="secondary">
            {selectedTraits.length}
          </Badge>
        }
        className="flex-shrink-0"
      >
        {selectedTraits.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            {language === 'en' 
              ? 'No traits selected' 
              : 'Keine Eigenschaften ausgewählt'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedTraits.map(traitId => {
              const trait = availableTraits.find(t => t.id === traitId);
              return trait ? (
                <Badge key={traitId} variant="default">
                  {trait.name}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </AdminCard>

      {/* Search and available traits */}
      <AdminCard 
        title={language === 'en' ? 'Available Traits' : 'Verfügbare Eigenschaften'}
        actions={
          <Badge variant="outline">
            {filteredTraits.length} / {availableTraits.length}
          </Badge>
        }
        className="flex-1 flex flex-col min-h-0"
      >
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'en' ? 'Search traits...' : 'Eigenschaften suchen...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Traits list */}
        <div className="flex-1 overflow-y-auto">
          {filteredTraits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'en' ? 'No traits found' : 'Keine Eigenschaften gefunden'}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
              {filteredTraits.map(trait => (
                <div key={trait.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={selectedTraits.includes(trait.id)}
                    onCheckedChange={(checked) => handleTraitToggle(trait.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{trait.name}</p>
                    {trait.description && (
                      <p className="text-xs text-muted-foreground">{trait.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminCard>

      {/* Action buttons */}
      <AdminCard className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            {hasChanges && (
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'You have unsaved changes' : 'Sie haben ungespeicherte Änderungen'}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <CancelButton onClick={handleCancel}>
              {language === 'en' ? 'Cancel' : 'Abbrechen'}
            </CancelButton>
            <SaveButton 
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              loading={isSaving}
            >
              {language === 'en' ? 'Save Changes' : 'Änderungen speichern'}
            </SaveButton>
          </div>
        </div>
      </AdminCard>
    </div>
  );
};