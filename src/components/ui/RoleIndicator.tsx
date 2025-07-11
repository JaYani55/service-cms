import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, User, Shield, Users, Crown, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface RoleIndicatorProps {
  language: 'en' | 'de';
}

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({ language }) => {
  const { user, switchRole, getAvailableRoles } = useAuth();
  const availableRoles = getAvailableRoles();
  
  // Don't show if user has only one role or no roles
  if (!user || availableRoles.length <= 1) {
    return null;
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return Crown;
      case UserRole.COACH:
        return Briefcase;
      case UserRole.STAFF:
        return Users;
      case UserRole.MENTORINGMANAGEMENT:
        return Shield;
      case UserRole.MENTOR:
        return User;
      default:
        return User;
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return language === 'en' ? 'Super Admin' : 'Super Admin';
      case UserRole.COACH:
        return language === 'en' ? 'Coach' : 'Coach';
      case UserRole.STAFF:
        return language === 'en' ? 'Staff' : 'Mitarbeiter';
      case UserRole.MENTORINGMANAGEMENT:
        return language === 'en' ? 'Mentoring Management' : 'Mentoring Management';
      case UserRole.MENTOR:
        return language === 'en' ? 'Mentor' : 'Mentor';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case UserRole.COACH:
        return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
      case UserRole.STAFF:
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case UserRole.MENTORINGMANAGEMENT:
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case UserRole.MENTOR:
        return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const currentRole = user.role;
  const CurrentRoleIcon = getRoleIcon(currentRole);
  const currentRoleColor = getRoleColor(currentRole);

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 py-2 px-4"
         role="banner"
         aria-label={language === 'en' ? 'Role selector' : 'Rollenauswahl'}>
      <div className="container mx-auto">
        <div className="flex items-center justify-end">
          {/* All content grouped together on the right */}
          <div className="flex items-center gap-4">
            {/* Current role display */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 font-medium hidden sm:inline" id="current-role-label">
                {language === 'en' ? 'Active Role:' : 'Aktive Rolle:'}
              </span>
              <div className="flex items-center gap-2" role="status" aria-labelledby="current-role-label">
                <CurrentRoleIcon className="h-4 w-4 text-slate-600" aria-hidden="true" />
                <Badge 
                  variant="secondary" 
                  className={`${currentRoleColor} font-medium text-sm px-3 py-1`}
                >
                  {getRoleDisplayName(currentRole)}
                </Badge>
              </div>
            </div>

            {/* Role switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  aria-label={language === 'en' ? 'Switch to different role' : 'Zu anderer Rolle wechseln'}
                  aria-haspopup="menu"
                  aria-expanded={false}
                >
                  <ChevronDown className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span className="hidden sm:inline text-sm">
                    {language === 'en' ? 'Switch Role' : 'Rolle wechseln'}
                  </span>
                  <span className="sm:hidden text-sm">
                    {language === 'en' ? 'Switch' : 'Wechseln'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" role="menu">
                {availableRoles.map((role) => {
                  const RoleIcon = getRoleIcon(role);
                  const isActive = role === currentRole;
                  
                  return (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={`flex items-center gap-3 py-2 px-3 cursor-pointer ${
                        isActive ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                      }`}
                      disabled={isActive}
                      role="menuitem"
                      aria-current={isActive ? 'true' : 'false'}
                    >
                      <RoleIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="flex-1">{getRoleDisplayName(role)}</span>
                      {isActive && (
                        <Badge variant="default" className="text-xs px-2 py-0">
                          {language === 'en' ? 'Active' : 'Aktiv'}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};