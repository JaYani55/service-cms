import React, { useState, useEffect } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { Tags, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Import consistent admin components
import { AdminPageLayout, AdminCard, AdminLoading } from '@/components/admin/ui';
import { AddButton, EditButton, DeleteButton, SaveButton, CancelButton } from '@/components/admin/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Define the type for a trait
interface MentorGroup {
  id: number;
  group_name: string;
  description: string | null;
  user_in_group: any[] | null;
  created_by: string | null;
}

// Define form state
interface FormState {
  group_name: string;
  description: string;
}

const VerwaltungMentorGroups = () => {
  const { language } = useTheme();
  const { user } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<MentorGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<MentorGroup | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    group_name: '',
    description: ''
  });

  const hasPermission = permissions.canManageTraits;

  // Fetch traits
  useEffect(() => {
    if (!hasPermission) {
      navigate('/verwaltung');
      return;
    }
    fetchGroups();
  }, [hasPermission, navigate]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('mentor_groups')
        .select('*')
        .order('group_name', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error(language === 'en' ? 'Failed to load traits' : 'Fehler beim Laden der Eigenschaften');
    } finally {
      setIsLoading(false);
    }
  };

  // Open create form
  const handleCreateClick = () => {
    setCurrentGroup(null);
    setFormState({ group_name: '', description: '' });
    setShowDialog(true);
  };

  // Open edit form
  const handleEditClick = (group: MentorGroup) => {
    setCurrentGroup(group);
    setFormState({
      group_name: group.group_name,
      description: group.description || ''
    });
    setShowDialog(true);
  };

  // Delete a group
  const handleDeleteClick = async (group: MentorGroup) => {
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this trait?' : 'Sind Sie sicher, dass Sie diese Eigenschaft löschen möchten?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('mentor_groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;

      toast.success(language === 'en' ? 'Trait deleted successfully' : 'Eigenschaft erfolgreich gelöscht');
      fetchGroups();
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

    try {
      const saveOperation = currentGroup ? setIsEditing : setIsCreating;
      saveOperation(true);

      if (currentGroup) {
        // Update existing
        const { error } = await supabase
          .from('mentor_groups')
          .update({
            group_name: formState.group_name.trim(),
            description: formState.description.trim() || null
          })
          .eq('id', currentGroup.id);

        if (error) throw error;
        toast.success(language === 'en' ? 'Trait updated successfully' : 'Eigenschaft erfolgreich aktualisiert');
      } else {
        // Create new
        const { error } = await supabase
          .from('mentor_groups')
          .insert({
            group_name: formState.group_name.trim(),
            description: formState.description.trim() || null,
            created_by: user?.id,
            user_in_group: []
          });

        if (error) throw error;
        toast.success(language === 'en' ? 'Trait created successfully' : 'Eigenschaft erfolgreich erstellt');
      }

      setShowDialog(false);
      fetchGroups();
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
    setFormState({ group_name: '', description: '' });
  };

  if (isLoading) {
    return (
      <AdminPageLayout 
        title={language === 'en' ? 'Mentor Traits' : 'Mentor Eigenschaften'}
        icon={Tags}
      >
        <AdminLoading language={language} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={language === 'en' ? 'Mentor Traits' : 'Mentor Eigenschaften'}
      description={language === 'en' 
        ? 'Manage and organize mentor traits and categories' 
        : 'Mentor-Eigenschaften und Kategorien verwalten und organisieren'}
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
                    {group.group_name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {group.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {language === 'en' ? 'Members: ' : 'Mitglieder: '}
                    {Array.isArray(group.user_in_group) ? group.user_in_group.length : 0}
                  </p>
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