import { Calendar, Settings, Users, User, List, LogOut, HelpCircle, Moon, Sun, ChevronUp, Globe, FileText } from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { usePermissions } from "@/hooks/usePermissions"
import Logo from "@/components/shared/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function AppSidebar() {
  const { logout, user } = useAuth()
  const { theme, language, toggleTheme, toggleLanguage } = useTheme()
  const { canAccessVerwaltung } = usePermissions()
  const location = useLocation()

  const items = [
    {
      title: language === "en" ? "Events" : "Veranstaltungen",
      url: "/events",
      icon: Users,
    },
    {
      title: language === "en" ? "Calendar" : "Kalender",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: language === "en" ? "List" : "Liste",
      url: "/list",
      icon: List,
    },
    {
      title: language === "en" ? "Me" : "Ich",
      url: "/me",
      icon: User,
    },
  ]

  if (canAccessVerwaltung) {
    items.push(
      {
        title: language === "en" ? "Pages" : "Seiten",
        url: "/pages",
        icon: FileText,
      },
      {
        title: language === "en" ? "Administration" : "Verwaltung",
        url: "/verwaltung",
        icon: Settings,
      }
    )
  }

  const ukFlagUrl = "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/gb.svg"
  const germanFlagUrl = "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/de.svg"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-center py-4">
           <Link to="/events" className="flex items-center justify-center w-full">
              <div className="scale-90 origin-left">
                <Logo />
              </div>
           </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>{language === 'en' ? 'Settings' : 'Einstellungen'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={language === 'en' ? 'Info' : 'Info'}>
                  <Link to="/Info">
                    <HelpCircle />
                    <span>{language === 'en' ? 'Info' : 'Info'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleLanguage} tooltip={language === 'en' ? 'Switch Language' : 'Sprache wechseln'}>
                  <div className="flex items-center justify-center w-4 h-4">
                    {language === 'en' ? (
                       <img src={germanFlagUrl} alt="DE" className="w-full h-auto object-cover rounded-[2px]" />
                    ) : (
                       <img src={ukFlagUrl} alt="EN" className="w-full h-auto object-cover rounded-[2px]" />
                    )}
                  </div>
                  <span>{language === 'en' ? 'Switch to German' : 'Zu Englisch wechseln'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleTheme} tooltip={language === 'en' ? 'Toggle Theme' : 'Design wechseln'}>
                  {theme === 'dark' ? <Sun /> : <Moon />}
                  <span>{theme === 'dark' ? (language === 'en' ? 'Light Mode' : 'Heller Modus') : (language === 'en' ? 'Dark Mode' : 'Dunkler Modus')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip={language === 'en' ? 'Logout' : 'Abmelden'}>
                  <LogOut />
                  <span>{language === 'en' ? 'Logout' : 'Abmelden'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <User className="size-8" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.email}</span>
                    <span className="truncate text-xs text-muted-foreground">{language === 'en' ? 'User' : 'Benutzer'}</span>
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={toggleLanguage}>
                    {language === "en" ? (
                        <div className="flex items-center gap-2 w-full">
                            <img src={germanFlagUrl} alt="German flag" className="h-4 w-6 object-cover rounded-sm" />
                            <span>Switch to German</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <img src={ukFlagUrl} alt="UK flag" className="h-4 w-6 object-cover rounded-sm" />
                            <span>Switch to English</span>
                        </div>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                    {theme === "dark" ? (
                        <div className="flex items-center gap-2 w-full">
                            <Sun className="h-4 w-4" />
                            <span>Light Mode</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <Moon className="h-4 w-4" />
                            <span>Dark Mode</span>
                        </div>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/Info" className="flex items-center gap-2 w-full">
                        <HelpCircle className="h-4 w-4" />
                        <span>Info</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{language === "en" ? "Logout" : "Abmelden"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
