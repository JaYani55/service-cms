import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, Plus, Trash2, Edit, Save, X, ArrowLeft } from 'lucide-react';

interface BaseButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void; // Updated to accept optional event parameter
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
}

const getSizeStyles = (size?: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm h-8';
    case 'lg':
      return 'px-6 py-3 text-lg h-12';
    default:
      return 'px-4 py-2 text-base h-10';
  }
};

const getIconSize = (size?: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'h-3 w-3';
    case 'lg':
      return 'h-5 w-5';
    default:
      return 'h-4 w-4';
  }
};

// Add/Create Button - Always green gradient
export const AddButton: React.FC<BaseButtonProps & { icon?: LucideIcon }> = ({ 
  children, 
  icon: Icon = Plus, 
  className,
  size = 'md',
  disabled,
  loading,
  ...props 
}) => (
  <Button
    className={cn(
      'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
      'text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300',
      'transform hover:scale-105 active:scale-95 border-0',
      getSizeStyles(size),
      disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      ) : (
        <Icon className={cn(getIconSize(size))} />
      )}
      {children}
    </div>
  </Button>
);

// Delete Button - Always red gradient
export const DeleteButton: React.FC<BaseButtonProps> = ({ 
  children, 
  className,
  size = 'md',
  disabled,
  loading,
  ...props 
}) => (
  <Button
    className={cn(
      'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
      'text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300',
      'transform hover:scale-105 active:scale-95 border-0',
      getSizeStyles(size),
      disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      ) : (
        <Trash2 className={cn(getIconSize(size))} />
      )}
      {children}
    </div>
  </Button>
);

// Edit Button - Always blue gradient
export const EditButton: React.FC<BaseButtonProps> = ({ 
  children, 
  className,
  size = 'md',
  disabled,
  loading,
  ...props 
}) => (
  <Button
    className={cn(
      'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      'text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300',
      'transform hover:scale-105 active:scale-95 border-0',
      getSizeStyles(size),
      disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      ) : (
        <Edit className={cn(getIconSize(size))} />
      )}
      {children}
    </div>
  </Button>
);

// Save Button - Always green with save icon
export const SaveButton: React.FC<BaseButtonProps> = ({ 
  children, 
  className,
  size = 'md',
  disabled,
  loading,
  ...props 
}) => (
  <Button
    className={cn(
      'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
      'text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300',
      'transform hover:scale-105 active:scale-95 border-0',
      getSizeStyles(size),
      disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      ) : (
        <Save className={cn(getIconSize(size))} />
      )}
      {children}
    </div>
  </Button>
);

// Cancel/Close Button - Always gray
export const CancelButton: React.FC<BaseButtonProps> = ({ 
  children, 
  className,
  size = 'md',
  disabled,
  loading,
  ...props 
}) => (
  <Button
    variant="outline"
    className={cn(
      'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium',
      'transition-all duration-300 transform hover:scale-105 active:scale-95',
      getSizeStyles(size),
      disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
      ) : (
        <X className={cn(getIconSize(size))} />
      )}
      {children}
    </div>
  </Button>
);

// Back Button - Always with arrow
export const BackButton: React.FC<Omit<BaseButtonProps, 'children'> & { label: string }> = ({ 
  label, 
  className,
  size = 'md',
  disabled,
  loading,
  ...props 
}) => (
  <Button
    variant="ghost"
    className={cn(
      'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium',
      'transition-all duration-300',
      getSizeStyles(size),
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
      ) : (
        <ArrowLeft className={cn(getIconSize(size))} />
      )}
      {label}
    </div>
  </Button>
);