import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from '@/hooks/usePermissions'; // Add this import
import { useProfileData } from "@/hooks/useProfileData";
import { useSeatableMentors } from "@/hooks/useSeatableMentors";
import { User, Settings, ChevronRight } from "lucide-react";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { SeaTableProfileData } from "@/components/profile/SeaTableProfileData";
import { ColumnMetadata } from "@/types/seaTableTypes";

const Me = () => {
  const { language } = useTheme();
  const { user: currentUser } = useAuth();
  const permissions = usePermissions(); // Use centralized permissions

  // Get profile data for the current user (no URL parameter, so it uses current user)
  const {
    isLoading,
    user,
    seatableMentorData,
    canEdit,
  } = useProfileData(language);

  // Get metadata for SeaTable display
  const seatableMentorsOptions = useMemo(() => ({}), []);
  const { getTableMetadata } = useSeatableMentors(seatableMentorsOptions);
  const [columnMetadata, setColumnMetadata] = React.useState<ColumnMetadata | undefined>();

  React.useEffect(() => {
    if (getTableMetadata) {
      const fetchMetadata = async () => {
        try {
          const metadata = await getTableMetadata('Neue_MentorInnen');
          setColumnMetadata(metadata);
        } catch (error) {
          console.error('Error fetching column metadata:', error);
        }
      };
      fetchMetadata();
    }
  }, [getTableMetadata]);

  if (!currentUser) {
    return null;
  }

  const tiles = [
    {
      title: language === "en" ? "My Settings" : "Meine Einstellungen",
      description: language === "en" ? "Manage your preferences and application settings" : "Verwalte deine Präferenzen und Anwendungseinstellungen",
      icon: Settings,
      href: "/settings",
    }
  ];

  const getDisplayUsername = (user: any, language: 'en' | 'de') => {
    if (user?.Username) {
      return user.Username;
    }

    if (seatableMentorData?.Vorname && seatableMentorData?.Nachname) {
      return `${seatableMentorData.Vorname} ${seatableMentorData.Nachname}`;
    }

    if (seatableMentorData?.Anzeigename) {
      return seatableMentorData.Anzeigename;
    }

    return language === 'en' ? 'Unknown User' : 'Unbekannter Benutzer';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <span lang={language === "en" ? "en" : "de"}>
          {language === "en" ? "My Profile" : "Mein Profil"}
        </span>
      </h1>

      {/* Profile Section */}
      <div className="space-y-6">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="space-y-6">
            {/* Profile Header - Remove ProfilePhoto */}
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                {/* Remove the ProfilePhoto component entirely */}
                <div>
                  <h2 className="text-2xl font-bold">
                    {getDisplayUsername(user, language)}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentUser.email}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </Card>

            {/* SeaTable Data or Not Found Message */}
            {seatableMentorData ? (
              <SeaTableProfileData
                data={seatableMentorData}
                isLoading={false}
                language={language}
                userId={currentUser.id}
                canEdit={canEdit}
                columnMetadata={columnMetadata}
              />
            ) : (
              <Card className="p-6 text-center">
                <div className="space-y-4">
                  <User className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {language === "en" ? "User isn't in SeaTable yet" : "Benutzer ist noch nicht in SeaTable"}
                    </h3>
                    <p className="text-muted-foreground">
                      {language === "en" 
                        ? "Your mentor profile data hasn't been added to SeaTable yet. Please contact an administrator if you believe this is an error."
                        : "Ihre Mentor-Profildaten wurden noch nicht zu SeaTable hinzugefügt. Bitte wenden Sie sich an einen Administrator, wenn Sie glauben, dass dies ein Fehler ist."}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          <span lang={language === "en" ? "en" : "de"}>
            {language === "en" ? "Quick Actions" : "Schnellaktionen"}
          </span>
        </h2>

        <ul className="grid md:grid-cols-2 gap-6 list-none">
          {tiles.map((tile) => (
            <li key={tile.href}>
              <Link to={tile.href}>
                <Card className="h-full p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <tile.icon className="h-6 w-6 text-primary" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mt-4">{tile.title}</h3>
                  <p className="text-muted-foreground mt-2 flex-grow">{tile.description}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Me;