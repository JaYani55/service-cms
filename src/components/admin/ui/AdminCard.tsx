import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AdminCardProps {
  title?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  icon: Icon,
  iconColor = 'from-blue-500 to-blue-600',
  actions,
  children,
  className,
  clickable = false,
  onClick
}) => {
  // Keyboard accessibility: handle Enter/Space
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300',
        'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800',
        clickable && 'cursor-pointer hover:scale-[1.02] transform',
        className
      )}
      onClick={clickable ? onClick : undefined}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      aria-label={clickable && title ? title : undefined}
      onKeyDown={handleKeyDown}
    >
      {(title || Icon || actions) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${iconColor} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              )}
              {title && (
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </CardTitle>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn('pt-0', !title && !Icon && !actions && 'pt-6')}>
        {children}
      </CardContent>
    </Card>
  );
};