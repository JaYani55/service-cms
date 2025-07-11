import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Settings, 
  Users, 
  UserPlus, 
  UserCheck, 
  Tags, 
  BarChart3, 
  Plus,
  ChevronRight
} from 'lucide-react';
import { AdminCard } from '@/components/admin/ui/AdminCard'; // Add this import

// Define a unified type for all admin cards
type AdminCardType = {
  title: string;
  description: string;
  icon: React.ForwardRefExoticComponent<any>;
  href: string;
  permission: keyof ReturnType<typeof usePermissions>;
  color: string;
};

const Verwaltung = () => {
  const { language } = useTheme();
  const { user } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!permissions.canAccessVerwaltung) {
      navigate('/');
    } else {
      setMounted(true);
    }
  }, [permissions.canAccessVerwaltung, navigate]);

  if (!mounted) return null;

  // Mentor Administration Cards
  const mentorCards: AdminCardType[] = [
    {
      title: language === 'de' ? 'Alle MentorInnen' : 'All Mentors',
      description: language === 'de' 
        ? 'Übersicht und Verwaltung aller registrierten MentorInnen' 
        : 'Overview and management of all registered mentors',
      icon: Users,
      href: '/verwaltung/all-mentors',
      permission: 'canViewMentorProfiles',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: language === 'de' ? 'MentorIn hinzufügen' : 'Add Mentor',
      description: language === 'de' 
        ? 'Neue MentorIn-Profile erstellen und konfigurieren' 
        : 'Create and configure new mentor profiles',
      icon: UserPlus,
      href: '/verwaltung/add-mentor',
      permission: 'canManageMentors',
      color: 'from-green-500 to-green-600',
    },
    {
      title: language === 'de' ? 'Eigenschaften verwalten' : 'Manage Traits',
      description: language === 'de' 
        ? 'Mentor-Eigenschaften und Kategorien definieren' 
        : 'Define mentor traits and categories',
      icon: Tags,
      href: '/verwaltung/trait',
      permission: 'canManageTraits',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: language === 'de' ? 'Eigenschaften zuweisen' : 'Assign Traits',
      description: language === 'de' 
        ? 'Eigenschaften zu MentorInnen zuordnen und verwalten' 
        : 'Assign and manage traits to mentors',
      icon: UserCheck,
      href: '/verwaltung/traitsmentorassign',
      permission: 'canManageTraits',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  // Product Administration Cards
  const productCards: AdminCardType[] = [
    {
      title: language === 'de' ? 'Alle Produkte' : 'All Products',
      description: language === 'de' 
        ? 'Übersicht und Verwaltung aller verfügbaren Produkte' 
        : 'Overview and management of all available products',
      icon: BarChart3,
      href: '/verwaltung/all-products',
      permission: 'canManageProducts',
      color: 'from-teal-500 to-teal-600',
    },
    {
      title: language === 'de' ? 'Neues Produkt' : 'Create Product',
      description: language === 'de' 
        ? 'Neue Produkte erstellen und konfigurieren' 
        : 'Create and configure new products',
      icon: Plus,
      href: '/verwaltung/create-product',
      permission: 'canManageProducts',
      color: 'from-green-700 to-green-900', // darkish green gradient
    },
  ];

  // Filter cards based on permissions
  const visibleMentorCards = mentorCards.filter(card => permissions[card.permission]);
  const visibleProductCards = productCards.filter(card => permissions[card.permission]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {language === 'de' ? 'Verwaltung' : 'Administration'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                {language === 'de' 
                  ? 'Zentrale Verwaltung für MentorInnen und Produkte' 
                  : 'Central management for mentors and products'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {/* Mentor Administration Section */}
          {visibleMentorCards.length > 0 && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {language === 'de' ? 'MentorInnen-Verwaltung' : 'Mentor Administration'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'de' 
                    ? 'Profile, Eigenschaften und Zuordnungen verwalten' 
                    : 'Manage profiles, traits and assignments'
                  }
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {visibleMentorCards.map((card) => (
                  <AdminCard
                    key={card.href}
                    title={card.title}
                    icon={card.icon}
                    iconColor={card.color}
                    clickable={true}
                    onClick={() => {
                      if (card.href === '/verwaltung/create-product') {
                        navigate(card.href, { state: { from: '/verwaltung' } });
                      } else {
                        navigate(card.href);
                      }
                    }}
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {card.description}
                    </div>
                  </AdminCard>
                ))}
              </div>
            </div>
          )}

          {/* Product Administration Section */}
          {visibleProductCards.length > 0 && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {language === 'de' ? 'Produkt-Verwaltung' : 'Product Administration'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'de' 
                    ? 'Produkte erstellen, bearbeiten und verwalten' 
                    : 'Create, edit and manage products'
                  }
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {visibleProductCards.map((card) => (
                  <AdminCard
                    key={card.href}
                    title={card.title}
                    icon={card.icon}
                    iconColor={card.color}
                    clickable={true}
                    onClick={() => {
                      if (card.href === '/verwaltung/create-product') {
                        navigate(card.href, { state: { from: '/verwaltung' } });
                      } else {
                        navigate(card.href);
                      }
                    }}
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {card.description}
                    </div>
                  </AdminCard>
                ))}
              </div>
            </div>
          )}

          {/* No Access Message */}
          {visibleMentorCards.length === 0 && visibleProductCards.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-6">
                <Settings className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {language === 'de' ? 'Keine Verwaltungstools verfügbar' : 'No Administration Tools Available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {language === 'de' 
                  ? 'Sie haben derzeit keine Berechtigung für Verwaltungstools. Wenden Sie sich an Ihren Administrator.' 
                  : 'You currently do not have permission for any administration tools. Please contact your administrator.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verwaltung;