import React from "react";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/types/event";
import { useTheme } from "@/contexts/ThemeContext";
import { UserCheck } from "lucide-react";

interface StaffStatusBadgeProps {
  event: Event;
  userId: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  fullWidth?: boolean;
}

export const StaffStatusBadge = ({ 
  event, 
  userId, 
  size = "default",
  className = "",
  fullWidth = false
}: StaffStatusBadgeProps) => {
  const { language } = useTheme();

  // Only show if user is staff for this event
  const isStaff = event?.staff_members?.includes(userId);
  if (!isStaff) return null;

  const sizeClasses = {
    sm: `px-2 py-1 text-xs gap-1 ${fullWidth ? "w-full justify-center" : ""}`,
    default: `px-3 py-1.5 text-sm gap-1.5 ${fullWidth ? "w-full justify-center" : ""}`,
    lg: `px-4 py-2 text-base gap-2 ${fullWidth ? "w-full justify-center" : ""}`
  };
  const iconSize = {
    sm: 12,
    default: 14,
    lg: 16
  }[size];

  return (
    <Badge 
      variant="outline" 
      className={`bg-green-100/80 dark:bg-green-900/30 text-green-900 dark:text-green-400 border-green-500/30 ${sizeClasses[size]} ${className}`}
    >
      <UserCheck size={iconSize} />
      {language === "en" ? "You are Staff" : "Du bist Staff"}
    </Badge>
  );
};