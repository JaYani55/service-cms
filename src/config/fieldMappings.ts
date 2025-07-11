/**
 * This configuration file defines mappings between our application's
 * internal field names and SeaTable's field names.
 * 
 * When SeaTable schema changes, we only need to update this file,
 * not the components that use the data.
 */

export const FIELD_MAPPINGS = {
  // Basic identity
  id: 'Mentor_ID',
  firstName: 'Vorname',
  lastName: 'Nachname',
  
  // Profile content
  profilePicture: 'Profilbild',
  quote: 'Zitat',
  description: 'Beschreibung',
  
  // Contact information
  email: 'E-Mail-Adresse',
  phone: 'Tel_Festnetz',
  mobile: 'Tel_Mobil',
  address: 'Adresse',
  postalCode: 'PLZ',
  city: 'Ort',
  country: 'Land',
  
  // Professional information
  position: 'Position',
  company: 'Arbeitgeber',
  education: 'Ausbildung',
  industry: 'Branche',
  
  // Skills and abilities
  expertise: 'Fachbereiche',
  languages: 'Sprachen',
  skills: 'Skills',
  competencies: 'Kompetenzen',
  
  // Availability
  availability: 'Zeitliche_Verfuegbarkeit',
  travelAvailability: 'Reisebereitschaft',
  location: 'Einsatzort',
  
  // Contract information
  contractType: 'Vertragsart',
  mentorAgreement: 'MentorInVereinbarung',
  mentorSince: 'Mentor_seit',
  status: 'Status',
  
  // Disability information
  hasVisibleDisability: 'has_visible_disability',
  hasNonVisibleDisability: 'has_non_visible_disability',
  disabilityDetails: 'Beeintraechtigungen',
  supportNeeds: 'Besondere_Unterstuetzung',
  travelRequirements: 'Reisebesonderheiten'
};

// Helper function to get field data with fallback
export const getField = (data: any, fieldKey: keyof typeof FIELD_MAPPINGS, fallback?: any) => {
  if (!data) return fallback;
  const fieldName = FIELD_MAPPINGS[fieldKey];
  return data[fieldName] !== undefined ? data[fieldName] : fallback;
};

// Helper to map SeaTable field categories for organized display
export const FIELD_CATEGORIES = {
  personal: {
    title: { en: 'Personal Information', de: 'Persönliche Informationen' },
    fields: [
      FIELD_MAPPINGS.firstName, 
      FIELD_MAPPINGS.lastName, 
      // Add other fields here
    ]
  },
  // Define other categories using the mapped field names
};