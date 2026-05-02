import { useState, useEffect, useCallback } from 'react';
import { 
  computeExamStatus, 
  ExamLifecycleDates, 
  ExamStatusResult,
  ExamLifecycleStatus,
  getStatusBadgeStyles,
  formatTimeRemaining,
  canPerformAction,
  validateExamLifecycleDates
} from '@shared/exam-lifecycle';

export function useExamStatus(dates: ExamLifecycleDates | null, refreshInterval = 1000): ExamStatusResult | null {
  const [status, setStatus] = useState<ExamStatusResult | null>(null);

  const updateStatus = useCallback(() => {
    if (!dates) {
      setStatus(null);
      return;
    }
    const result = computeExamStatus(dates, new Date());
    setStatus(result);
  }, [dates]);

  useEffect(() => {
    updateStatus();
    
    const interval = setInterval(updateStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [updateStatus, refreshInterval]);

  return status;
}

export function useExamStatusBatch(exams: Array<{ id: number; dates: ExamLifecycleDates }>, refreshInterval = 5000) {
  const [statuses, setStatuses] = useState<Map<number, ExamStatusResult>>(new Map());

  useEffect(() => {
    const updateAll = () => {
      const now = new Date();
      const newStatuses = new Map<number, ExamStatusResult>();
      exams.forEach(exam => {
        newStatuses.set(exam.id, computeExamStatus(exam.dates, now));
      });
      setStatuses(newStatuses);
    };

    updateAll();
    const interval = setInterval(updateAll, refreshInterval);
    return () => clearInterval(interval);
  }, [exams, refreshInterval]);

  return statuses;
}

export {
  computeExamStatus,
  validateExamLifecycleDates,
  canPerformAction,
  getStatusBadgeStyles,
  formatTimeRemaining,
  type ExamLifecycleDates,
  type ExamStatusResult,
  type ExamLifecycleStatus
};
