export type ExamLifecycleStatus = 
  | 'UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'LIVE'
  | 'COMPLETED'
  | 'RESULT_PUBLISHED';

export interface ExamLifecycleDates {
  registrationOpenDate: Date | string | null;
  registrationCloseDate: Date | string | null;
  startTime: Date | string;
  endTime: Date | string;
  resultDeclarationDate: Date | string | null;
}

export interface ExamStatusResult {
  status: ExamLifecycleStatus;
  label: string;
  color: string;
  canRegister: boolean;
  canAttempt: boolean;
  canEditDates: boolean;
  canViewResult: boolean;
  nextStatusChange: Date | null;
  timeToNextStatus: number | null;
}

const STATUS_CONFIG: Record<ExamLifecycleStatus, { label: string; color: string }> = {
  UPCOMING: { label: 'Upcoming', color: 'slate' },
  REGISTRATION_OPEN: { label: 'Registration Open', color: 'green' },
  REGISTRATION_CLOSED: { label: 'Registration Closed', color: 'amber' },
  LIVE: { label: 'Live', color: 'red' },
  COMPLETED: { label: 'Completed', color: 'blue' },
  RESULT_PUBLISHED: { label: 'Results Published', color: 'purple' },
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function computeExamStatus(
  dates: ExamLifecycleDates,
  serverTime: Date = new Date()
): ExamStatusResult {
  const now = serverTime.getTime();
  
  const regOpen = toDate(dates.registrationOpenDate);
  const regClose = toDate(dates.registrationCloseDate);
  const examStart = toDate(dates.startTime);
  const examEnd = toDate(dates.endTime);
  const resultPublish = toDate(dates.resultDeclarationDate);

  // If exam dates are invalid, return a default status
  if (!examStart || !examEnd) {
    return {
      status: 'UPCOMING',
      label: 'Draft',
      color: 'slate',
      canRegister: false,
      canAttempt: false,
      canEditDates: true,
      canViewResult: false,
      nextStatusChange: null,
      timeToNextStatus: null,
    };
  }

  let status: ExamLifecycleStatus;
  let nextStatusChange: Date | null = null;

  // Check if we have both registration dates (they come as a pair per validation)
  const hasRegistrationPeriod = regOpen && regClose;

  if (hasRegistrationPeriod) {
    // Full lifecycle with registration period
    if (now < regOpen.getTime()) {
      status = 'UPCOMING';
      nextStatusChange = regOpen;
    } else if (now >= regOpen.getTime() && now < regClose.getTime()) {
      status = 'REGISTRATION_OPEN';
      nextStatusChange = regClose;
    } else if (now >= regClose.getTime() && now < examStart.getTime()) {
      status = 'REGISTRATION_CLOSED';
      nextStatusChange = examStart;
    } else if (now >= examStart.getTime() && now <= examEnd.getTime()) {
      status = 'LIVE';
      nextStatusChange = examEnd;
    } else if (now > examEnd.getTime() && (!resultPublish || now < resultPublish.getTime())) {
      status = 'COMPLETED';
      nextStatusChange = resultPublish;
    } else if (resultPublish && now >= resultPublish.getTime()) {
      status = 'RESULT_PUBLISHED';
      nextStatusChange = null;
    } else {
      status = 'COMPLETED';
      nextStatusChange = resultPublish;
    }
  } else {
    // Simplified lifecycle without registration dates
    if (now < examStart.getTime()) {
      status = 'UPCOMING';
      nextStatusChange = examStart;
    } else if (now >= examStart.getTime() && now <= examEnd.getTime()) {
      status = 'LIVE';
      nextStatusChange = examEnd;
    } else if (now > examEnd.getTime() && (!resultPublish || now < resultPublish.getTime())) {
      status = 'COMPLETED';
      nextStatusChange = resultPublish;
    } else if (resultPublish && now >= resultPublish.getTime()) {
      status = 'RESULT_PUBLISHED';
      nextStatusChange = null;
    } else {
      status = 'COMPLETED';
      nextStatusChange = resultPublish;
    }
  }

  const config = STATUS_CONFIG[status];
  const timeToNextStatus = nextStatusChange ? nextStatusChange.getTime() - now : null;

  // canRegister only if we have registration period and status is REGISTRATION_OPEN
  const canRegister = hasRegistrationPeriod && status === 'REGISTRATION_OPEN';

  return {
    status,
    label: config.label,
    color: config.color,
    canRegister,
    canAttempt: status === 'LIVE',
    canEditDates: status === 'UPCOMING' || status === 'REGISTRATION_OPEN',
    canViewResult: status === 'RESULT_PUBLISHED',
    nextStatusChange,
    timeToNextStatus,
  };
}

export interface DateValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateExamLifecycleDates(dates: ExamLifecycleDates): DateValidationResult {
  const errors: string[] = [];

  const regOpen = toDate(dates.registrationOpenDate);
  const regClose = toDate(dates.registrationCloseDate);
  const examStart = toDate(dates.startTime);
  const examEnd = toDate(dates.endTime);
  const resultPublish = toDate(dates.resultDeclarationDate);

  // Required fields
  if (!examStart) {
    errors.push('Exam start time is required');
  }
  if (!examEnd) {
    errors.push('Exam end time is required');
  }

  // Exam start must be before exam end
  if (examStart && examEnd && examStart >= examEnd) {
    errors.push('Exam start time must be before exam end time');
  }

  // Registration dates must come as a pair (both or neither)
  if ((regOpen && !regClose) || (!regOpen && regClose)) {
    errors.push('Both registration open and close dates must be provided together');
  }

  // Registration open must be before registration close
  if (regOpen && regClose && regOpen >= regClose) {
    errors.push('Registration open date must be before registration close date');
  }

  // Registration close must be before or at exam start
  if (regClose && examStart && regClose > examStart) {
    errors.push('Registration must close before or at exam start time');
  }

  // Registration open must be before exam start (implicit via regClose ≤ examStart)
  if (regOpen && examStart && regOpen >= examStart) {
    errors.push('Registration open date must be before exam start time');
  }

  // Result declaration must be after exam end
  if (resultPublish && examEnd && resultPublish < examEnd) {
    errors.push('Result declaration date must be after exam end time');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function canPerformAction(
  action: 'register' | 'attempt' | 'edit_dates' | 'view_result' | 'publish_result',
  dates: ExamLifecycleDates,
  serverTime: Date = new Date()
): { allowed: boolean; reason?: string } {
  const { status, canRegister, canAttempt, canEditDates, canViewResult } = computeExamStatus(dates, serverTime);

  switch (action) {
    case 'register':
      if (!canRegister) {
        if (status === 'UPCOMING') return { allowed: false, reason: 'Registration has not started yet' };
        if (status === 'REGISTRATION_CLOSED') return { allowed: false, reason: 'Registration is closed' };
        if (status === 'LIVE') return { allowed: false, reason: 'Exam is in progress, registration is closed' };
        if (status === 'COMPLETED' || status === 'RESULT_PUBLISHED') return { allowed: false, reason: 'Exam has ended' };
      }
      return { allowed: canRegister };

    case 'attempt':
      if (!canAttempt) {
        if (status === 'UPCOMING' || status === 'REGISTRATION_OPEN' || status === 'REGISTRATION_CLOSED') {
          return { allowed: false, reason: 'Exam is not live yet' };
        }
        if (status === 'COMPLETED' || status === 'RESULT_PUBLISHED') {
          return { allowed: false, reason: 'Exam has ended' };
        }
      }
      return { allowed: canAttempt };

    case 'edit_dates':
      if (!canEditDates) {
        return { allowed: false, reason: 'Cannot modify dates after exam goes live' };
      }
      return { allowed: true };

    case 'view_result':
      if (!canViewResult) {
        return { allowed: false, reason: 'Results have not been published yet' };
      }
      return { allowed: true };

    case 'publish_result':
      if (status !== 'COMPLETED' && status !== 'RESULT_PUBLISHED') {
        return { allowed: false, reason: 'Can only publish results after exam has ended' };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

export function getStatusBadgeStyles(status: ExamLifecycleStatus): string {
  const styles: Record<ExamLifecycleStatus, string> = {
    UPCOMING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    REGISTRATION_OPEN: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    REGISTRATION_CLOSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    LIVE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse',
    COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    RESULT_PUBLISHED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  };
  return styles[status];
}

export function formatTimeRemaining(milliseconds: number | null): string {
  if (!milliseconds || milliseconds <= 0) return '';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
