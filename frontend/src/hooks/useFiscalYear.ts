import { useMemo, useState, useCallback } from 'react';
import { useTenantSettings } from './useTenantSettings';

export type CalendarMode = 'fiscal' | 'calendar';

export interface FiscalYearConfig {
  startMonth: number; // 1-12
  prefix: string; // e.g., "FY"
}

export interface MonthInfo {
  year: number;
  month: number; // 1-12
  label: string; // e.g., "Jan 25" or "Oct 25"
  fiscalLabel: string; // e.g., "FY25 Q1" or "Jan"
  fiscalYear: number;
  fiscalQuarter: number;
  fiscalMonth: number; // 1-12 within fiscal year
  isFirstOfFiscalYear: boolean;
  isFirstOfQuarter: boolean;
}

/**
 * Calculates fiscal year information for a given date
 */
export function getFiscalYear(date: Date, startMonth: number): number {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (startMonth === 1) {
    // Calendar year
    return year;
  }

  // Fiscal year is labeled by the year it ends in
  // e.g., FY2025 for Oct 2024 - Sep 2025 (startMonth = 10)
  if (month >= startMonth) {
    return year + 1;
  }
  return year;
}

/**
 * Calculates fiscal quarter (1-4) for a given month
 */
export function getFiscalQuarter(month: number, startMonth: number): number {
  // Calculate how many months from fiscal year start
  const fiscalMonth = getFiscalMonth(month, startMonth);
  return Math.ceil(fiscalMonth / 3);
}

/**
 * Calculates fiscal month (1-12) within the fiscal year
 */
export function getFiscalMonth(month: number, startMonth: number): number {
  if (startMonth === 1) {
    return month;
  }

  if (month >= startMonth) {
    return month - startMonth + 1;
  }
  return month + (12 - startMonth + 1);
}

/**
 * Generates an array of month info for a given range
 */
export function generateMonthRange(
  startDate: Date,
  monthCount: number,
  config: FiscalYearConfig
): MonthInfo[] {
  const months: MonthInfo[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  for (let i = 0; i < monthCount; i++) {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const fiscalYear = getFiscalYear(currentDate, config.startMonth);
    const fiscalQuarter = getFiscalQuarter(month, config.startMonth);
    const fiscalMonth = getFiscalMonth(month, config.startMonth);

    months.push({
      year,
      month,
      label: `${monthNames[month - 1]} ${String(year).slice(-2)}`,
      fiscalLabel: config.startMonth === 1
        ? monthNames[month - 1]
        : `${config.prefix}${String(fiscalYear).slice(-2)} M${fiscalMonth}`,
      fiscalYear,
      fiscalQuarter,
      fiscalMonth,
      isFirstOfFiscalYear: fiscalMonth === 1,
      isFirstOfQuarter: fiscalMonth % 3 === 1,
    });

    // Move to next month
    currentDate = new Date(year, month, 1);
  }

  return months;
}

/**
 * Formats a fiscal year label
 */
export function formatFiscalYear(
  fiscalYear: number,
  prefix: string,
  startMonth: number
): string {
  if (startMonth === 1) {
    return `Calendar Year ${fiscalYear}`;
  }
  return `${prefix}${fiscalYear}`;
}

/**
 * Gets the start date of a fiscal year
 */
export function getFiscalYearStartDate(fiscalYear: number, startMonth: number): Date {
  if (startMonth === 1) {
    return new Date(fiscalYear, 0, 1); // January 1st
  }
  // Fiscal year starts in the previous calendar year
  return new Date(fiscalYear - 1, startMonth - 1, 1);
}

/**
 * Gets the end date of a fiscal year
 */
export function getFiscalYearEndDate(fiscalYear: number, startMonth: number): Date {
  if (startMonth === 1) {
    return new Date(fiscalYear, 11, 31); // December 31st
  }
  // Fiscal year ends in September (if startMonth is October) of the labeled year
  return new Date(fiscalYear, startMonth - 2, new Date(fiscalYear, startMonth - 1, 0).getDate());
}

/**
 * Hook for fiscal year utilities with tenant settings
 */
export function useFiscalYear() {
  const { data: settings } = useTenantSettings();
  const [mode, setMode] = useState<CalendarMode>('fiscal');

  const config: FiscalYearConfig = useMemo(() => ({
    startMonth: settings?.fiscalYearStartMonth || 10,
    prefix: settings?.fiscalYearPrefix || 'FY',
  }), [settings?.fiscalYearStartMonth, settings?.fiscalYearPrefix]);

  const isCalendarYear = config.startMonth === 1;

  const currentFiscalYear = useMemo(() => {
    return getFiscalYear(new Date(), config.startMonth);
  }, [config.startMonth]);

  const toggleMode = useCallback(() => {
    setMode(m => m === 'fiscal' ? 'calendar' : 'fiscal');
  }, []);

  const getMonthRange = useCallback((startDate: Date, monthCount: number) => {
    return generateMonthRange(startDate, monthCount, config);
  }, [config]);

  const formatYear = useCallback((fiscalYear: number) => {
    return formatFiscalYear(fiscalYear, config.prefix, config.startMonth);
  }, [config]);

  const getMonthLabel = useCallback((year: number, month: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (mode === 'calendar' || isCalendarYear) {
      return `${monthNames[month - 1]} ${String(year).slice(-2)}`;
    }

    const date = new Date(year, month - 1, 1);
    const fy = getFiscalYear(date, config.startMonth);
    const fm = getFiscalMonth(month, config.startMonth);
    return `${config.prefix}${String(fy).slice(-2)} M${fm}`;
  }, [mode, isCalendarYear, config]);

  const getYearLabel = useCallback((year: number, month: number) => {
    if (mode === 'calendar' || isCalendarYear) {
      return String(year);
    }

    const date = new Date(year, month - 1, 1);
    const fy = getFiscalYear(date, config.startMonth);
    return `${config.prefix}${fy}`;
  }, [mode, isCalendarYear, config]);

  return {
    config,
    mode,
    setMode,
    toggleMode,
    isCalendarYear,
    currentFiscalYear,
    getMonthRange,
    formatYear,
    getMonthLabel,
    getYearLabel,
    // Expose utility functions
    getFiscalYear: (date: Date) => getFiscalYear(date, config.startMonth),
    getFiscalQuarter: (month: number) => getFiscalQuarter(month, config.startMonth),
    getFiscalMonth: (month: number) => getFiscalMonth(month, config.startMonth),
    getFiscalYearStartDate: (fy: number) => getFiscalYearStartDate(fy, config.startMonth),
    getFiscalYearEndDate: (fy: number) => getFiscalYearEndDate(fy, config.startMonth),
  };
}
