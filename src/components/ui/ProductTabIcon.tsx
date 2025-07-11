import React from 'react';
import { LucideProps } from 'lucide-react';

export const PillarIcon: React.FC<LucideProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  strokeWidth = 2,
  ...props 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="4" y="5" width="16" height="3" rx="1" />
      <rect x="4" y="16" width="16" height="3" rx="1" />
      <path d="M6 8v8" />
      <path d="M18 8v8" />
      <path d="M12 8v8" />
    </svg>
  );
};