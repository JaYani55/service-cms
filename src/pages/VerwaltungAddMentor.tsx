import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { UserPlus } from 'lucide-react';

// Import consistent admin components
import { AdminPageLayout } from '@/components/admin/ui';
import { BackButton } from '@/components/admin/ui';
import { Card, CardContent } from "@/components/ui/card";
import { SeaTableDataUnavailable } from '@/components/profile/SeaTableDataUnavailable';

const VerwaltungAddMentor = () => {
  const { language } = useTheme();
  const permissions = usePermissions();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!permissions.canManageMentors) {
      navigate('/verwaltung');
    }
  }, [permissions.canManageMentors, navigate]);

  if (!permissions.canManageMentors) {
    return null;
  }

  return (
    <AdminPageLayout
      title={language === 'en' ? 'Add New Mentor' : 'Neue MentorIn hinzufügen'}
      description={language === 'en' 
        ? 'Create a new mentor profile and add them to the platform' 
        : 'Neues MentorInnen-Profil erstellen und zur Plattform hinzufügen'}
      icon={UserPlus}
      actions={
        <BackButton 
          label={language === 'en' ? 'Back to Mentors' : 'Zurück zu MentorInnen'}
          onClick={() => navigate('/verwaltung/all-mentors')}
        />
      }
    >
      <SeaTableDataUnavailable />
    </AdminPageLayout>
  );
};

export default VerwaltungAddMentor;