import { WORK_SCHEDULE } from '../constants/workSchedule';

/**
 * Date range for two-week work schedule
 */
export interface DateRange {
  /** Start date (Monday of current week) */
  start: Date;
  /** End date (Friday of next week) */
  end: Date;
  /** ISO date string for start */
  startDate: string;
  /** ISO date string for end */
  endDate: string;
}

/**
 * Get Monday-Friday date range for specified number of weeks
 * Defaults to Monday of current week through Friday of next week
 *
 * @param referenceDate - Date to calculate range from (defaults to today)
 * @param weeks - Number of weeks to include (defaults to 2)
 * @returns Date range object with start/end dates
 */
export function getTwoWeekRange(
  referenceDate: Date = new Date(),
  weeks: number = WORK_SCHEDULE.WEEKS_TO_SHOW
): DateRange {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  // Get Monday of current week
  const dayOfWeek = start.getDay();
  const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  start.setDate(diff);

  // Calculate end date (last Friday)
  const totalDays = weeks * WORK_SCHEDULE.DAYS_PER_WEEK + (weeks - 1) * 2; // weekdays + weekends
  const end = new Date(start);
  end.setDate(end.getDate() + totalDays - 1);

  return {
    start,
    end,
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/**
 * Generate array of weekday dates for specified number of weeks
 * Skips weekends (Saturday/Sunday)
 *
 * @param startDate - Starting date (should be a Monday)
 * @param weeks - Number of weeks to generate (defaults to 2)
 * @returns Array of Date objects for weekdays only
 */
export function getWeekdays(
  startDate: Date,
  weeks: number = WORK_SCHEDULE.WEEKS_TO_SHOW
): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);

  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < WORK_SCHEDULE.DAYS_PER_WEEK; day++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    // Skip weekend (Saturday + Sunday)
    current.setDate(current.getDate() + 2);
  }

  return days;
}

/**
 * Check if a date is today
 *
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 *
 * @param date - Date to check
 * @returns True if date is before today
 */
export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date is a weekend
 *
 * @param date - Date to check
 * @returns True if date is Saturday or Sunday
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return WORK_SCHEDULE.WEEKEND_DAYS.includes(day);
}

/**
 * Get Monday of the week for a given date
 *
 * @param date - Reference date
 * @returns Monday of that week
 */
export function getMondayOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get all weekdays (Monday-Friday) for the current week only
 *
 * @param referenceDate - Date to calculate from (defaults to today)
 * @returns Array of Date objects for current week's weekdays
 */
export function getCurrentWeekdays(referenceDate: Date = new Date()): Date[] {
  const monday = getMondayOfWeek(referenceDate);
  return getWeekdays(monday, 1);
}

/**
 * Get all weekdays in a calendar month (including partial weeks)
 * Extends to include full weeks at start and end
 *
 * @param referenceDate - Date in the month to display (defaults to today)
 * @returns Array of Date objects for all weekdays in the month view
 */
export function getMonthWeekdays(referenceDate: Date = new Date()): Date[] {
  const days: Date[] = [];

  // Get first day of the month
  const firstOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);

  // Get last day of the month
  const lastOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

  // Start from Monday of the week containing the first day
  const startDate = getMondayOfWeek(firstOfMonth);

  // End on Friday of the week containing the last day
  const endMonday = getMondayOfWeek(lastOfMonth);
  const endDate = new Date(endMonday);
  endDate.setDate(endDate.getDate() + 4); // Friday of that week

  // Generate all weekdays between start and end
  const current = new Date(startDate);
  while (current <= endDate) {
    if (!isWeekend(current)) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Get the month name and year for a date
 *
 * @param date - Date to format
 * @returns Formatted string like "November 2025"
 */
export function getMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
