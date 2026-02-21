import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { User, Settings, Construction, ChevronRight } from "lucide-react";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { SeaTableDataUnavailable } from "@/components/profile/SeaTableDataUnavailable";

const Me = () => {
  const { language } = useTheme();
  const { user: currentUser } = useAuth();

  // Get profile data for the current user (no URL parameter, so it uses current user)
  const {
    isLoading,
    user,
  } = useProfileData(language);

  const displayUsername = useMemo(() => {
    const username = typeof user?.Username === 'string' && user.Username.trim().length > 0
      ? user.Username
      : null;

    if (username) {
      return username;
    }

    return language === 'en' ? 'Unknown User' : 'Unbekannter Benutzer';
  }, [language, user?.Username]);

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
            {/* Profile Header */}
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {displayUsername}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentUser.email}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {currentUser.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Profile Data Under Construction Notice */}
            <SeaTableDataUnavailable 
              language={language} 
              userId={user?.id} 
            />
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