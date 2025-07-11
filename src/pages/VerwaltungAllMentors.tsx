import React, { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from "react-router-dom";
import { Users } from 'lucide-react';
import { fetchMentorGroups, MentorGroup } from '@/services/mentorGroupService';
import { supabase } from '@/lib/supabase';

// Import consistent admin components
import { AdminPageLayout, AdminLoading, AdminCard } from '@/components/admin/ui';
import { AddButton } from '@/components/admin/ui';
import { ImprovedMentorList } from "@/components/admin/ImprovedMentorList";
import { TraitAssignment } from "@/components/admin/TraitAssignment";

interface Mentor {
  id: string;
  name: string;
  email?: string;
  profilePic?: string;
}

const VerwaltungAllMentors = () => {
  const { language } = useTheme();
  const permissions = usePermissions();
  const navigate = useNavigate();
  
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [availableTraits, setAvailableTraits] = useState<MentorGroup[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check permissions and redirect if needed
  useEffect(() => {
    if (!permissions.canViewMentorProfiles) {
      navigate('/verwaltung');
    }
  }, [permissions.canViewMentorProfiles, navigate]);

  // Load mentors efficiently using batch operations
  useEffect(() => {
    const loadMentors = async () => {
      try {
        setIsLoading(true);

        // Step 1: Get mentor role ID
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'mentor')
          .single();

        if (roleError || !roleData) {
          console.error('Error fetching mentor role:', roleError);
          setMentors([]);
          return;
        }

        // Step 2: Get all user IDs with mentor role
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role_id', roleData.id);

        if (userRolesError || !userRolesData?.length) {
          console.error('Error fetching user roles:', userRolesError);
          setMentors([]);
          return;
        }

        const mentorUserIds = userRolesData.map(item => item.user_id);

        // Step 3: Batch fetch all mentor profiles at once
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profile')
          .select('user_id, Username, pfp_url')
          .in('user_id', mentorUserIds)
          .order('Username');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setMentors([]);
          return;
        }

        // Step 4: Transform data for UI
        const processedMentors: Mentor[] = (profilesData || []).map(profile => ({
          id: profile.user_id,
          name: profile.Username || 'No Username given',
          profilePic: profile.pfp_url || undefined
        }));

        setMentors(processedMentors);
        console.log(`[VerwaltungAllMentors] Loaded ${processedMentors.length} mentors`);

      } catch (error) {
        console.error('Error loading mentors:', error);
        setMentors([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMentors();
  }, []);

  // Load available traits
  useEffect(() => {
    const loadTraits = async () => {
      try {
        const traits = await fetchMentorGroups();
        setAvailableTraits(traits);
      } catch (error) {
        console.error('Error loading traits:', error);
        setAvailableTraits([]);
      }
    };

    loadTraits();
  }, []);

  // Helper functions
  const getInitials = (name: string) => {
    if (!name || name === 'No Username given') return 'NU';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // FIX: This function was using wrong property - should use 'members' not 'memberCount'
  const getMentorGroups = (mentorId: string): string[] => {
    return availableTraits
      .filter(trait => {
        // Use 'members' array, not 'memberCount' (which is a number)
        const members = trait.members || [];
        return Array.isArray(members) && members.includes(mentorId);
      })
      .map(trait => trait.name);
  };

  // FIX: Navigate to mentor profile instead of opening trait assignment
  const handleEditMentor = (mentor: Mentor) => {
    // Navigate to the mentor's profile page
    navigate(`/profile/${mentor.id}`);
  };

  // Keep trait assignment for when we implement it properly
  const handleTraitAssignment = (mentor: Mentor) => {
    setSelectedMentor(mentor);
  };

  const handleTraitUpdate = async () => {
    try {
      // Reload traits after update
      const traits = await fetchMentorGroups();
      setAvailableTraits(traits);
    } catch (error) {
      console.error('Error refreshing traits:', error);
    }
  };

  // Permission checks
  const canViewMentors = permissions.canViewMentorProfiles;
  const canManageMentors = permissions.canManageMentors;

  if (!canViewMentors) {
    return null;
  }

  if (isLoading) {
    return (
      <AdminPageLayout
        title={language === 'en' ? 'All Mentors' : 'Alle MentorInnen'}
        icon={Users}
      >
        <AdminLoading language={language} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={language === 'en' ? 'All Mentors' : 'Alle MentorInnen'}
      description={language === 'en' 
        ? 'Overview and management of all registered mentors' 
        : 'Übersicht und Verwaltung aller registrierten MentorInnen'}
      icon={Users}
      actions={
        canManageMentors && (
          <AddButton onClick={() => navigate('/verwaltung/add-mentor')}>
            {language === 'en' ? 'Add Mentor' : 'Mentor hinzufügen'}
          </AddButton>
        )
      }
    >
      {!mentors || mentors.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'en' ? 'No mentors found' : 'Keine MentorInnen gefunden'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'en' 
                ? 'There are no mentors registered yet.' 
                : 'Es sind noch keine MentorInnen registriert.'}
            </p>
            {canManageMentors && (
              <AddButton onClick={() => navigate('/verwaltung/add-mentor')}>
                {language === 'en' ? 'Add First Mentor' : 'Erste MentorIn hinzufügen'}
              </AddButton>
            )}
          </div>
        </AdminCard>
      ) : (
        <ImprovedMentorList
          mentors={mentors}
          availableTraits={availableTraits}
          language={language}
          getInitials={getInitials}
          getMentorGroups={getMentorGroups}
          onEditMentor={handleEditMentor} // This now navigates to profile
        />
      )}

      {/* Trait Assignment Modal - for future use */}
      {selectedMentor && (
        <TraitAssignment
          mentor={selectedMentor}
          availableTraits={availableTraits}
          language={language}
          onClose={() => setSelectedMentor(null)}
          onUpdate={handleTraitUpdate}
          getInitials={getInitials}
        />
      )}
    </AdminPageLayout>
  );
};

export default VerwaltungAllMentors;