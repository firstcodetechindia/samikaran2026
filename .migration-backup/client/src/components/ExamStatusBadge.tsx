import { useExamStatus, ExamLifecycleDates, getStatusBadgeStyles, formatTimeRemaining } from '@/hooks/use-exam-status';
import { Badge } from '@/components/ui/badge';
import { Clock, Radio } from 'lucide-react';

interface ExamStatusBadgeProps {
  dates: ExamLifecycleDates;
  showCountdown?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function ExamStatusBadge({ dates, showCountdown = false, size = 'default' }: ExamStatusBadgeProps) {
  const status = useExamStatus(dates, showCountdown ? 1000 : 5000);
  
  if (!status) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`${getStatusBadgeStyles(status.status)} ${sizeClasses[size]} font-medium border-0`}
        data-testid={`badge-exam-status-${status.status.toLowerCase()}`}
      >
        {status.status === 'LIVE' && <Radio className="w-3 h-3 mr-1 animate-pulse" />}
        {status.label}
      </Badge>
      
      {showCountdown && status.timeToNextStatus && status.timeToNextStatus > 0 && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeRemaining(status.timeToNextStatus)}
        </span>
      )}
    </div>
  );
}

interface StaticExamStatusBadgeProps {
  status: string;
  size?: 'sm' | 'default' | 'lg';
}

export function StaticExamStatusBadge({ status, size = 'default' }: StaticExamStatusBadgeProps) {
  const statusMap: Record<string, { label: string; styles: string }> = {
    'draft': { label: 'Draft', styles: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    'published': { label: 'Published', styles: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    'active': { label: 'Active', styles: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    'completed': { label: 'Completed', styles: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    'cancelled': { label: 'Cancelled', styles: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    'UPCOMING': { label: 'Upcoming', styles: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    'REGISTRATION_OPEN': { label: 'Registration Open', styles: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    'REGISTRATION_CLOSED': { label: 'Registration Closed', styles: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
    'LIVE': { label: 'Live', styles: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse' },
    'COMPLETED': { label: 'Completed', styles: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    'RESULT_PUBLISHED': { label: 'Results Published', styles: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  };

  const config = statusMap[status] || { label: status, styles: 'bg-gray-100 text-gray-700' };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.styles} ${sizeClasses[size]} font-medium border-0`}
      data-testid={`badge-exam-status-${status.toLowerCase()}`}
    >
      {status === 'LIVE' && <Radio className="w-3 h-3 mr-1 animate-pulse" />}
      {config.label}
    </Badge>
  );
}
