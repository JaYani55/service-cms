import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../contexts/ThemeContext";

interface Coach {
  user_id: string;
  Username: string;
}

interface CoachComboboxProps {
  value: string;
  onChange: (value: string, displayName: string) => void;
  disabled?: boolean;
}

export function CoachCombobox({ value, onChange, disabled = false }: CoachComboboxProps) {
  const { language } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [coaches, setCoaches] = React.useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = React.useState<Coach | null>(null);
  
  // Load coaches when popover opens
  React.useEffect(() => {
    if (open) {
      loadCoaches();
    }
  }, [open]);
  
  // Load selected coach when value changes
  React.useEffect(() => {
    if (value) {
      loadCoachById(value);
    } else {
      setSelectedCoach(null);
    }
  }, [value]);
  
  // Function to load all coaches
  const loadCoaches = async () => {
    setLoading(true);
    try {
      console.log("Starting coach loading process");
      
      // Step 1: Get the role_id for 'coach' from the roles table
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'coach')
        .single();

      if (roleError) {
        console.error("Error fetching coach role:", roleError);
        setLoading(false);
        return;
      }

      if (!roleData) {
        console.log("No coach role found in database");
        setCoaches([]);
        setLoading(false);
        return;
      }

      const coachRoleId = roleData.id;
      console.log(`Found coach role ID: ${coachRoleId}`);
      
      // Step 2: Get all users with the coach role using role_id
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', coachRoleId); // Use role_id instead of role_name

      if (userRolesError) {
        console.error("Error fetching users with coach role:", userRolesError);
        setLoading(false);
        return;
      }

      if (!userRolesData?.length) {
        console.log("No coaches found in user_roles table");
        setCoaches([]);
        setLoading(false);
        return;
      }

      console.log(`Found ${userRolesData.length} users with coach role`);
      
      // Step 3: Get user profiles for these coaches
      const coachUserIds = userRolesData.map(item => item.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profile')
        .select('user_id, Username')
        .in('user_id', coachUserIds)
        .order('Username');

      if (profilesError) {
        console.error("Error loading coach profiles:", profilesError);
        setLoading(false);
        return;
      }

      const transformedData = profiles.map(profile => ({
        user_id: profile.user_id,
        Username: profile.Username || 'Unknown'
      }));

      console.log(`Successfully loaded ${transformedData.length} coaches`);
      setCoaches(transformedData);
    } catch (err) {
      console.error("Exception loading coaches:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load a specific coach by ID
  const loadCoachById = async (id: string) => {
    try {
      console.log("Loading coach by ID:", id);
      
      // Step 1: Get the role_id for 'coach'
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'coach')
        .single();

      if (roleError || !roleData) {
        console.error("Error fetching coach role:", roleError);
        return;
      }

      const coachRoleId = roleData.id;
      console.log("Coach role ID:", coachRoleId);
      
      // Step 2: Check if this user has coach role - WITHOUT .single()
      const { data: roleCheck, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', id)
        .eq('role_id', coachRoleId);

      if (roleCheckError) {
        console.error("Error checking user role:", roleCheckError);
        return;
      }

      // Check if any rows were returned
      if (!roleCheck || roleCheck.length === 0) {
        console.log("User is not a coach or has no role assigned");
        return;
      }

      console.log("User confirmed as coach, fetching profile...");

      // Step 3: Get their profile - Also remove .single() here for consistency
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('user_id, Username')
        .eq('user_id', id);

      if (profileError) {
        console.error("Error loading coach profile:", profileError);
        return;
      }

      // Check if profile exists
      if (!profileData || profileData.length === 0) {
        console.log("No profile found for user");
        return;
      }

      const profile = profileData[0]; // Get the first (and should be only) result

      if (profile) {
        console.log("Coach loaded successfully:", profile);
        setSelectedCoach({
          user_id: profile.user_id,
          Username: profile.Username || 'Unknown'
        });
      }
    } catch (err) {
      console.error("Exception loading coach by ID:", err);
    }
  };
  
  // Filter coaches based on search text
  const filteredCoaches = React.useMemo(() => {
    if (!searchText) return coaches;
    
    const text = searchText.toLowerCase().trim();
    return coaches.filter(coach => 
      coach.Username.toLowerCase().includes(text)
    );
  }, [coaches, searchText]);
  
  // Handle coach selection
  const selectCoach = (coach: Coach) => {
    onChange(coach.user_id, coach.Username);
    setSelectedCoach(coach);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedCoach ? selectedCoach.Username : (language === "en" ? "Select coach /staff..." : "Coach /Mitarbeiter auswählen...")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex items-center border-b p-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-70" />
            <Input
              placeholder={language === "en" ? "Search..." : "Suchen..."}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <p>{language === "en" ? "Loading..." : "Wird geladen..."}</p>
            </div>
          ) : (
            <ScrollArea className="h-72">
              <div className="p-1">
                {filteredCoaches.length === 0 ? (
                  <div className="text-center p-4 text-sm text-muted-foreground">
                    {language === "en" ? "No coaches found" : "Keine Coaches gefunden"}
                  </div>
                ) : (
                  filteredCoaches.map((coach) => (
                    <div
                      key={coach.user_id}
                      className={`
                        flex items-center px-2 py-1 rounded-sm text-sm cursor-pointer
                        ${value === coach.user_id ? 'bg-primary/10' : 'hover:bg-muted'}
                      `}
                      onClick={() => selectCoach(coach)}
                    >
                      {value === coach.user_id && (
                        <Check className="mr-2 h-4 w-4 text-primary" />
                      )}
                      <span className={value === coach.user_id ? "ml-6" : "ml-8"}>
                        {coach.Username}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}