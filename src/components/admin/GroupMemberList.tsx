import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Loader2, X } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { usePermissions } from '@/hooks/usePermissions';

interface Mentor {
  id: string;
  name: string;
  profilePic?: string;
  email?: string;
}

interface GroupMemberListProps {
  groupId: number;
  mentors: Mentor[];
  groupMembers: string[];
  isLoading: boolean;
  language: "en" | "de";
  getInitials: (name: string) => string;
  onRemoveMentor: (mentorId: string, groupId: number) => void;
}

export const GroupMemberList: React.FC<GroupMemberListProps> = ({
  groupId,
  mentors,
  groupMembers,
  isLoading,
  language,
  getInitials,
  onRemoveMentor
}) => {
  const { canManageTraits } = usePermissions();
  const droppableId = `group-${groupId}`;
  
  if (!canManageTraits) {
    return (
      <div className="p-4 min-h-[120px] max-h-[300px] overflow-y-auto bg-muted/20">
        {groupMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {language === 'en' ? 'No members assigned' : 'Keine Mitglieder zugewiesen'}
          </div>
        ) : (
          <div className="grid gap-1">
            {mentors
              .filter(mentor => groupMembers.includes(mentor.id))
              .map((mentor) => (
                <div
                  key={mentor.id}
                  className="py-1 px-2 flex items-center gap-3 bg-muted/30 rounded"
                >
                  <p className="text-sm">{mentor.name}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>
    );
  }
  
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`p-4 min-h-[120px] max-h-[300px] overflow-y-auto transition-colors
            ${snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-card'}`}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : groupMembers.length === 0 ? (
            <EmptyState 
              type="groupMembers" 
              language={language} 
            />
          ) : (
            <div className="grid gap-1">
              {mentors
                .filter(mentor => groupMembers.includes(mentor.id))
                .map((mentor, index) => (
                  <Draggable 
                    key={`${droppableId}-mentor-${mentor.id}`} 
                    draggableId={`${droppableId}-mentor-${mentor.id}`} 
                    index={index}
                    isDragDisabled={!canManageTraits}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`py-1 px-2 flex items-center justify-between gap-3 bg-transparent
                          transition-all rounded group hover:bg-muted/50
                          ${snapshot.isDragging ? 'shadow-sm bg-muted/70' : ''}`}
                      >
                        <p className="text-sm">{mentor.name}</p>
                        {canManageTraits && (
                          <X 
                            className="h-3.5 w-3.5 opacity-0 group-hover:opacity-80 cursor-pointer text-muted-foreground hover:text-destructive transition-opacity"
                            onClick={() => onRemoveMentor(mentor.id, groupId)}
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))
              }
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};