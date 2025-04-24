import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BoxIcon, PlusIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = <BoxIcon className="h-12 w-12" />,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="mt-4 bg-secondary text-white hover:bg-secondary-light"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
