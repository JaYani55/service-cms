import { Button } from "@/components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePermissions } from '@/hooks/usePermissions'; // Add this import
import { Moon, Sun, Menu, Calendar, Users, User, List, X, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../shared/Logo";

const Navbar = () => {
  const { logout, user } = useAuth();
  const { theme, language, toggleTheme, toggleLanguage } = useTheme();
  const { canAccessVerwaltung } = usePermissions(); // Use centralized permission
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: Users, label: language === "en" ? "Events" : "Veranstaltungen", href: "/events" },
    { icon: Calendar, label: language === "en" ? "Calendar" : "Kalender", href: "/calendar" },
    { icon: List, label: language === "en" ? "List" : "Liste", href: "/list" },
    { icon: User, label: language === "en" ? "Me" : "Ich", href: "/me" },
  ];

  // Use centralized permission instead of role checks
  if (canAccessVerwaltung) {
    menuItems.push({
      icon: Settings,
      label: language === "en" ? "Administration" : "Verwaltung",
      href: "/verwaltung"
    });
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const ukFlagUrl = "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/gb.svg";
  const germanFlagUrl = "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/de.svg";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link to="/events">
              <Logo />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`nav-button${location.pathname === item.href || location.pathname.startsWith(`${item.href}/`) ? " nav-button-active" : ""}`}
              >
                <div className="flex items-center space-x-1">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 border transition-colors"
              aria-label={language === "en" ? "Switch to German" : "Switch to English"}
            >
              {language === "en" ? (
                <>
                  <img src={germanFlagUrl} alt="German flag" className="h-4 w-6 object-cover rounded-sm" />
                  <span className="font-semibold">DE</span>
                </>
              ) : (
                <>
                  <img src={ukFlagUrl} alt="UK flag" className="h-4 w-6 object-cover rounded-sm" />
                  <span className="font-semibold">EN</span>
                </>
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-900 focus:outline-none"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user && (
              <Button
                onClick={logout}
                variant="ghost"
                className="hidden md:flex px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                {language === "en" ? "Logout" : "Abmelden"}
              </Button>
            )}

            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 pb-4 animate-in fade-in slide-in-from-top border-t">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center px-3 py-3 rounded-md text-base font-medium ${
                  location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-2" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center px-3 py-3 rounded-md text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>{language === "en" ? "Logout" : "Abmelden"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
