import { useQuery } from '@tanstack/react-query';
import { workingDaysService } from '../services/workingDaysService';
import type { MonthWorkingDays } from '../types/forecast';

// Get working days for a specific month
export function useMonthWorkingDays(year: number, month: number) {
  return useQuery<MonthWorkingDays, Error>({
    queryKey: ['workingDays', year, month],
    queryFn: () => workingDaysService.getMonthWorkingDays(year, month),
    enabled: year > 0 && month >= 1 && month <= 12,
    staleTime: 30 * 60 * 1000, // 30 minutes - working days don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

// Get working days for a range of months
export function useMonthRangeWorkingDays(
  startYear: number,
  startMonth: number,
  monthCount: number
) {
  return useQuery<MonthWorkingDays[], Error>({
    queryKey: ['workingDays', 'range', startYear, startMonth, monthCount],
    queryFn: () => workingDaysService.getMonthRangeWorkingDays(startYear, startMonth, monthCount),
    enabled: startYear > 0 && startMonth >= 1 && startMonth <= 12 && monthCount > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Get available hours for a month
export function useMonthAvailableHours(year: number, month: number) {
  return useQuery<number, Error>({
    queryKey: ['workingDays', 'hours', year, month],
    queryFn: () => workingDaysService.getMonthAvailableHours(year, month),
    enabled: year > 0 && month >= 1 && month <= 12,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
