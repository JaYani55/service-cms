import React from 'react';
import { Loader2 } from "lucide-react";

export const ProfileSkeleton = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};