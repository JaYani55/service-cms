import React from "react";
import { GroupMemberList } from "./GroupMemberList";
import { usePermissions } from '@/hooks/usePermissions';

interface Mentor {
  id: string;
  name: string;
  profilePic?: string;
  email?: string;
}

interface MentorGroup {
  id: number;
  group_name: string;
  description: string | null;
  user_in_group: string[];
}

interface GroupCardProps {
  group: MentorGroup;
  mentors: Mentor[];
  updatingGroups: Record<number, boolean>;
  language: "en" | "de";
  getInitials: (name: string) => string;
  onRemoveMentor: (mentorId: string, groupId: number) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  mentors,
  updatingGroups,
  language,
  getInitials,
  onRemoveMentor
}) => {
  const { canManageTraits } = usePermissions();

  return (
    <GroupMemberList
      groupId={group.id}
      mentors={mentors}
      groupMembers={group.user_in_group}
      isLoading={updatingGroups[group.id]}
      language={language}
      getInitials={getInitials}
      onRemoveMentor={canManageTraits ? onRemoveMentor : () => {}}
    />
  );
};