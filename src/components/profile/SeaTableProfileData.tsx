import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from '@/hooks/usePermissions';
import { SeaTableRow, ColumnMetadata } from '@/types/seaTableTypes';
import { Badge } from "@/components/ui/badge";
import { User, Phone, BookOpen, Heart, Award, Globe } from 'lucide-react';

// Fields that should only be visible to superadmins
const SUPERADMIN_ONLY_FIELDS = ['Mentor_ID'];

// Fields that start with underscore should only be visible to superadmins
const isUnderscoreField = (fieldName: string): boolean => {
  return fieldName.startsWith('_');
};

// Check if a field should be visible to the current user
const isFieldVisible = (fieldName: string, permissions: ReturnType<typeof usePermissions>): boolean => {
  if (isUnderscoreField(fieldName)) {
    return permissions.canViewAdminData;
  }
  
  if (SUPERADMIN_ONLY_FIELDS.includes(fieldName)) {
    return permissions.canViewAdminData;
  }
  
  return true;
};

// Check if a field is admin-only (for styling)
const isAdminOnlyField = (fieldName: string): boolean => {
  return isUnderscoreField(fieldName) || SUPERADMIN_ONLY_FIELDS.includes(fieldName);
};

// Expandable text component
const ExpandableText: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const truncatedText = text.length > 100 ? text.substring(0, 100) + '...' : text;

  if (text.length <= 100) {
    return <span>{text}</span>;
  }

  return (
    <div>
      <span>{isExpanded ? text : truncatedText}</span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
};

// Format value function
const formatValue = (value: any, fieldName: string, columnType?: string): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 italic">Not specified</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400 italic">None</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {String(item)}
          </Badge>
        ))}
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {value ? "Yes" : "No"}
      </Badge>
    );
  }

  if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
    return (
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800 underline break-all"
      >
        {value}
      </a>
    );
  }

  if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
    return (
      <a 
        href={`mailto:${value}`} 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {value}
      </a>
    );
  }

  if (typeof value === 'string' && /^[+]?[\d\s\-\(\)]+$/.test(value) && value.length > 5) {
    return (
      <a 
        href={`tel:${value.replace(/\s/g, '')}`} 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {value}
      </a>
    );
  }

  if (columnType === 'date' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString();
    } catch {
      return String(value);
    }
  }

  if (typeof value === 'string' && value.length > 100) {
    return <ExpandableText text={value} />;
  }

  return String(value);
};

interface SeaTableProfileDataProps {
  data: SeaTableRow;
  isLoading: boolean;
  language: 'en' | 'de';
  userId?: string;
  canEdit?: boolean;
  columnMetadata?: ColumnMetadata;
}

export const SeaTableProfileData: React.FC<SeaTableProfileDataProps> = ({
  data,
  isLoading,
  language,
  userId,
  canEdit = false,
  columnMetadata
}) => {
  const permissions = usePermissions();
  const shouldShowViewComparison = permissions.canViewAdminData;
  
  const categorizedFields = useMemo(() => {
    if (!data) return {};

    const categories = {
      personal: [] as Array<{ key: string; value: any; type?: string }>,
      contact: [] as Array<{ key: string; value: any; type?: string }>,
      professional: [] as Array<{ key: string; value: any; type?: string }>,
      preferences: [] as Array<{ key: string; value: any; type?: string }>,
      administrative: [] as Array<{ key: string; value: any; type?: string }>,
      other: [] as Array<{ key: string; value: any; type?: string }>
    };

    Object.entries(data).forEach(([key, value]) => {
      if (!isFieldVisible(key, permissions)) {
        return;
      }

      const columnType = columnMetadata?.columns?.[key]?.type;
      const field = { key, value, type: columnType };

      if (['Vorname', 'Nachname', 'Anzeigename', 'Geburtsdatum', 'Geschlecht', 'Nationalitaet'].includes(key)) {
        categories.personal.push(field);
      } else if (['Email', 'Telefon', 'Stadt', 'Land', 'Postleitzahl', 'Adresse'].includes(key)) {
        categories.contact.push(field);
      } else if (['Beruf', 'Arbeitgeber', 'Branche', 'Erfahrung', 'Kompetenzen', 'Fachbereiche'].includes(key)) {
        categories.professional.push(field);
      } else if (['Sprachen', 'Verfügbarkeit', 'Präferenz_Format', 'Reisebereitschaft'].includes(key)) {
        categories.preferences.push(field);
      } else if (isAdminOnlyField(key)) {
        categories.administrative.push(field);
      } else {
        categories.other.push(field);
      }
    });

    return Object.fromEntries(
      Object.entries(categories).filter(([_, fields]) => fields.length > 0)
    );
  }, [data, columnMetadata, permissions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">
            {language === 'de' ? 'Keine Daten verfügbar' : 'No data available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryTitle = (category: string): string => {
    const titles = {
      personal: language === 'de' ? 'Persönliche Informationen' : 'Personal Information',
      contact: language === 'de' ? 'Kontaktinformationen' : 'Contact Information', 
      professional: language === 'de' ? 'Berufliche Informationen' : 'Professional Information',
      preferences: language === 'de' ? 'Präferenzen' : 'Preferences',
      administrative: language === 'de' ? 'Administrative Daten' : 'Administrative Data',
      other: language === 'de' ? 'Weitere Informationen' : 'Other Information'
    };
    return titles[category as keyof typeof titles] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      personal: User,
      contact: Phone,
      professional: BookOpen,
      preferences: Heart,
      administrative: Award,
      other: Globe
    };
    return icons[category as keyof typeof icons] || Globe;
  };

  return (
    <div className="space-y-6">
      {shouldShowViewComparison && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Award className="h-5 w-5" />
              {language === 'de' ? 'Admin-Ansicht' : 'Admin View'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 text-sm">
              {language === 'de' 
                ? 'Sie sehen administrative Felder, die für normale Benutzer nicht sichtbar sind.'
                : 'You are viewing administrative fields that are not visible to regular users.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {Object.entries(categorizedFields).map(([category, fields]) => {
        const IconComponent = getCategoryIcon(category);
        
        return (
          <Card key={category} className={isAdminOnlyField(category) ? "border-orange-200 bg-orange-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {getCategoryTitle(category)}
                {category === 'administrative' && (
                  <Badge variant="secondary" className="text-xs">
                    {language === 'de' ? 'Nur Admin' : 'Admin Only'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map(({ key, value, type }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {isAdminOnlyField(key) && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'de' ? 'Admin' : 'Admin'}
                        </Badge>
                      )}
                    </div>
                    <div className={`text-sm ${isAdminOnlyField(key) ? 'text-orange-800' : 'text-gray-900'}`}>
                      {formatValue(value, key, type)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};