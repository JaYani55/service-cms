import React from "react";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/types/event";
import { useTheme } from "@/contexts/ThemeContext";
import { ShieldCheck } from "lucide-react";

interface AssignedStaffBadgeProps {
  event: Event;
  userId: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const AssignedStaffBadge = ({ 
  event, 
  userId, 
  size = "default",
  className = ""
}: AssignedStaffBadgeProps) => {
  const { language } = useTheme();
  
  const isAssignedStaff = event?.staff_members?.includes(userId);
  
  if (!isAssignedStaff) {
    return null;
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    default: "px-3 py-1.5 text-sm gap-1.5", 
    lg: "px-4 py-2 text-base gap-2"
  };

  const iconSize = {
    sm: 12,
    default: 14,
    lg: 16
  }[size];

  return (
    <Badge 
      variant="outline" 
      className={`bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border-indigo-500/30 ${sizeClasses[size]} ${className}`}
    >
      <ShieldCheck size={iconSize} />
      {language === "en" ? "Assigned Staff" : "Zugewiesene Mitarbeiter"}
    </Badge>
  );
};