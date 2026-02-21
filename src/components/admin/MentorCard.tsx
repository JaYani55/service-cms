import React from "react";
import { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps } from "@hello-pangea/dnd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from '@/hooks/usePermissions';

interface MentorCardProps {
  mentor: {
    id: string;
    name: string;
    profilePic?: string;
    email?: string;
  };
  groupCount: number;
  language: "en" | "de";
  isDragging?: boolean;
  getInitials: (name: string) => string;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  draggableProps?: DraggableProvidedDraggableProps;
  innerRef?: (element: HTMLElement | null) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  language,
  isDragging,
  getInitials,
  dragHandleProps,
  draggableProps,
  innerRef
}) => {
  const navigate = useNavigate();
  const { canViewMentorProfiles } = usePermissions();
  
  return (
    <div className="flex gap-2 mb-2 items-stretch">
      {/* Draggable mentor card */}
      <div className="flex-grow">
        <div
          ref={innerRef}
          {...draggableProps}
          {...dragHandleProps}
          className={`p-3 h-full border rounded-md bg-card flex items-center justify-between gap-3 transition-all
            ${isDragging ? 'shadow-lg ring-2 ring-primary/30 scale-[1.02]' : 'hover:shadow-sm hover:border-primary/20'}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={mentor.profilePic} />
              <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{mentor.name}</p>
              {mentor.email && (
                <p className="text-xs text-muted-foreground truncate">{mentor.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile button outside draggable */}
      {canViewMentorProfiles && (
        <Button
          variant="outline"
          size="sm"
          className="h-auto flex-shrink-0"
          onClick={() => navigate(`/profile/${mentor.id}`)}
        >
          <User className="h-4 w-4 mr-1" />
          {language === 'en' ? 'Assign via profile' : 'Über Profil zuweisen'}
        </Button>
      )}
    </div>
  );
};