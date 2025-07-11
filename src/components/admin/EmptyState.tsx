import React from "react";
import { Users } from "lucide-react";

interface EmptyStateProps {
  type: "mentorList" | "groupMembers";
  searchQuery?: string;
  language: "en" | "de";
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  searchQuery = "", 
  language 
}) => {
  if (type === "mentorList") {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery 
          ? language === 'en' 
            ? 'No mentors match your search' 
            : 'Keine MentorInnen entsprechen Ihrer Suche'
          : language === 'en' 
            ? 'No mentors available' 
            : 'Keine MentorInnen verfügbar'
        }
      </div>
    );
  }

  if (type === "groupMembers") {
    return (
      <div className="text-center py-8 px-4 text-muted-foreground text-sm border-2 border-dashed border-primary/20 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-3">
        <Users className="h-8 w-8 opacity-70" />
        <p>
          {language === 'en' 
            ? 'Drop mentors here to assign them this trait' 
            : 'MentorInnen hier ablegen, um ihnen diese Eigenschaft zuzuordnen'}
        </p>
      </div>
    );
  }

  return null;
};