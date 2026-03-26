import { useState, useEffect, useCallback } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Import consistent admin components
import { AdminPageLayout, AdminCard, AdminLoading } from '@/components/admin/ui';
import { AddButton, EditButton, DeleteButton, SaveButton, CancelButton } from '@/components/admin/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  createStaffTrait,
  deleteStaffTrait,
  fetchStaffTraits,
  type StaffTraitDefinition,
  updateStaffTrait,
} from '@/services/staffRegistryService';

interface MetadataEntry {
  key: string;
  value: string;
}

// Define form state
interface FormState {
  group_name: string;
  description: string;
  metadataEntries: MetadataEntry[];
}

const VerwaltungMentorGroups = () => {
  const { language } = useTheme();
  const { user } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<StaffTraitDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<StaffTraitDefinition | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showAdvancedTraits, setShowAdvancedTraits] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    group_name: '',
    description: '',
    metadataEntries: [],
  });

  const hasPermission = permissions.canManageTraits;

  // Fetch traits
  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchStaffTraits();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error(language === 'en' ? 'Failed to load traits' : 'Fehler beim Laden der Eigenschaften');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (!hasPermission) {
      navigate('/admin');
      return;
    }
    fetchGroups();
  }, [fetchGroups, hasPermission, navigate]);

  // Open create form
  const handleCreateClick = () => {
    setCurrentGroup(null);
    setFormState({ group_name: '', description: '', metadataEntries: [] });
    setShowAdvancedTraits(false);
    setShowDialog(true);
  };

  // Open edit form
  const handleEditClick = (group: StaffTraitDefinition) => {
    setCurrentGroup(group);
    setFormState({
      group_name: group.name,
      description: group.description || '',
      metadataEntries: Object.entries(group.metadata || {}).map(([key, value]) => ({
        key,
        value,
      })),
    });
    setShowAdvancedTraits(Object.keys(group.metadata || {}).length > 0);
    setShowDialog(true);
  };

  // Delete a group
  const handleDeleteClick = async (group: StaffTraitDefinition) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this trait?' : 'Sind Sie sicher, dass Sie diese Eigenschaft löschen möchten?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteStaffTrait(group.id);

      toast.success(language === 'en' ? 'Trait deleted successfully' : 'Eigenschaft erfolgreich gelöscht');
  await fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(language === 'en' ? 'Failed to delete trait' : 'Fehler beim Löschen der Eigenschaft');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create new group or update existing one
  const handleSave = async () => {
    if (!formState.group_name.trim()) {
      toast.error(language === 'en' ? 'Name is required' : 'Name ist erforderlich');
      return;
    }

    const metadataEntries = formState.metadataEntries.filter((entry) => entry.key.trim().length > 0);
    const duplicateKeys = metadataEntries
      .map((entry) => entry.key.trim())
      .filter((key, index, allKeys) => allKeys.indexOf(key) !== index);

    if (duplicateKeys.length > 0) {
      toast.error(language === 'en' ? 'Advanced trait keys must be unique' : 'Erweiterte Eigenschaftsschlüssel müssen eindeutig sein');
      return;
    }

    const metadata = metadataEntries.reduce<Record<string, string>>((result, entry) => {
      result[entry.key.trim()] = entry.value;
      return result;
    }, {});

    try {
      const saveOperation = currentGroup ? setIsEditing : setIsCreating;
      saveOperation(true);

      if (currentGroup) {
        await updateStaffTrait(currentGroup.id, {
          name: formState.group_name.trim(),
          description: formState.description.trim() || undefined,
          metadata,
        });
        toast.success(language === 'en' ? 'Trait updated successfully' : 'Eigenschaft erfolgreich aktualisiert');
      } else {
        await createStaffTrait({
          name: formState.group_name.trim(),
          description: formState.description.trim() || undefined,
          metadata,
        });
        toast.success(language === 'en' ? 'Trait created successfully' : 'Eigenschaft erfolgreich erstellt');
      }

      setShowDialog(false);
  await fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(language === 'en' ? 'Failed to save trait' : 'Fehler beim Speichern der Eigenschaft');
    } finally {
      setIsCreating(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setCurrentGroup(null);
    setFormState({ group_name: '', description: '', metadataEntries: [] });
    setShowAdvancedTraits(false);
  };

  const handleMetadataChange = (index: number, field: keyof MetadataEntry, value: string) => {
    setFormState((prev) => ({
      ...prev,
      metadataEntries: prev.metadataEntries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleAddMetadataEntry = () => {
    setFormState((prev) => ({
      ...prev,
      metadataEntries: [...prev.metadataEntries, { key: '', value: '' }],
    }));
  };

  const handleRemoveMetadataEntry = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      metadataEntries: prev.metadataEntries.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  if (isLoading) {
    return (
      <AdminPageLayout 
        title={language === 'en' ? 'Staff Traits' : 'Mitarbeiter-Eigenschaften'}
        icon={Tags}
      >
        <AdminLoading language={language} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={language === 'en' ? 'Staff Traits' : 'Mitarbeiter-Eigenschaften'}
      description={language === 'en' 
        ? 'Manage and organize staff traits and metadata' 
        : 'Mitarbeiter-Eigenschaften und Metadaten verwalten'}
      icon={Tags}
      actions={
        <AddButton onClick={handleCreateClick} disabled={!hasPermission}>
          {language === 'en' ? 'Create Trait' : 'Eigenschaft erstellen'}
        </AddButton>
      }
    >
      <AdminCard>
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'en' ? 'No traits found' : 'Keine Eigenschaften gefunden'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'en' 
                ? 'Create your first trait to get started.' 
                : 'Erstellen Sie Ihre erste Eigenschaft, um zu beginnen.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {group.description}
                    </p>
                  )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>
                        {language === 'en' ? 'Members: ' : 'Mitglieder: '}
                        {group.assignmentCount || 0}
                      </span>
                      <span>
                        {language === 'en' ? 'Advanced fields: ' : 'Erweiterte Felder: '}
                        {Object.keys(group.metadata || {}).length}
                      </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <EditButton 
                    size="sm"
                    onClick={() => handleEditClick(group)}
                    disabled={!hasPermission}
                  >
                    {language === 'en' ? 'Edit' : 'Bearbeiten'}
                  </EditButton>
                  <DeleteButton 
                    size="sm"
                    onClick={() => handleDeleteClick(group)}
                    disabled={!hasPermission || isDeleting}
                  >
                    {language === 'en' ? 'Delete' : 'Löschen'}
                  </DeleteButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentGroup 
                ? (language === 'en' ? 'Edit Trait' : 'Eigenschaft bearbeiten')
                : (language === 'en' ? 'Create New Trait' : 'Neue Eigenschaft erstellen')
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {language === 'en' ? 'Name' : 'Name'} *
              </label>
              <Input
                value={formState.group_name}
                onChange={(e) => setFormState(prev => ({ ...prev, group_name: e.target.value }))}
                placeholder={language === 'en' ? 'Enter trait name...' : 'Eigenschaftsname eingeben...'}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">
                {language === 'en' ? 'Description' : 'Beschreibung'}
              </label>
              <Textarea
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                placeholder={language === 'en' ? 'Enter description...' : 'Beschreibung eingeben...'}
                className="w-full"
                rows={3}
              />
            </div>

            <Collapsible open={showAdvancedTraits} onOpenChange={setShowAdvancedTraits}>
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" className="w-full justify-between rounded-none px-3 py-3">
                    <span>{language === 'en' ? 'Advanced traits' : 'Erweiterte Eigenschaften'}</span>
                    {showAdvancedTraits ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 border-t px-3 py-3">
                    <p className="text-sm text-muted-foreground">
                      {language === 'en'
                        ? 'Add arbitrary key-value metadata for future plugins and internal organization.'
                        : 'Fügen Sie beliebige Schlüssel-Wert-Metadaten für zukünftige Plugins und die interne Organisation hinzu.'}
                    </p>

                    {formState.metadataEntries.map((entry, index) => (
                      <div key={`${index}-${entry.key}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                        <Input
                          value={entry.key}
                          onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                          placeholder={language === 'en' ? 'Key' : 'Schlüssel'}
                        />
                        <Input
                          value={entry.value}
                          onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                          placeholder={language === 'en' ? 'Value' : 'Wert'}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMetadataEntry(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" onClick={handleAddMetadataEntry} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {language === 'en' ? 'Add field' : 'Feld hinzufügen'}
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <CancelButton onClick={handleCancel}>
              {language === 'en' ? 'Cancel' : 'Abbrechen'}
            </CancelButton>
            <SaveButton 
              onClick={handleSave}
              loading={isCreating || isEditing}
              disabled={!formState.group_name.trim()}
            >
              {currentGroup 
                ? (language === 'en' ? 'Update' : 'Aktualisieren')
                : (language === 'en' ? 'Create' : 'Erstellen')
              }
            </SaveButton>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
};

export default VerwaltungMentorGroups;