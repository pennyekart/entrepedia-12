import { CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VerifiedBadge({ className, size = 'sm' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle 
            className={cn(
              sizeClasses[size],
              'text-primary fill-primary/20 inline-block ml-1 shrink-0',
              className
            )} 
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Profile</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to check if user is verified (has real email, not phone.local)
export function isUserVerified(email?: string | null): boolean {
  if (!email) return false;
  return !email.includes('@phone.local');
}