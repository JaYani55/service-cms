import React from "react";
import { Search, CircleX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

interface MentorSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language: "en" | "de";
}

export const MentorSearch: React.FC<MentorSearchProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  language 
}) => {
  const { canViewMentorProfiles } = usePermissions();

  return (
    <div className="relative mb-4">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={language === 'en' ? 'Search mentors...' : 'MentorInnen suchen...'}
        className="pl-9"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={!canViewMentorProfiles}
      />
      {searchQuery && canViewMentorProfiles && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => setSearchQuery('')}
        >
          <CircleX className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};