/**
 * Work schedule configuration constants
 * Defines the standard work week and scheduling parameters
 */
export const WORK_SCHEDULE = {
  /** Number of weeks to display in calendar views */
  WEEKS_TO_SHOW: 2,

  /** Number of work days per week (Monday-Friday) */
  DAYS_PER_WEEK: 5,

  /** Total number of weekdays to display */
  get TOTAL_WEEKDAYS() {
    return this.WEEKS_TO_SHOW * this.DAYS_PER_WEEK;
  },

  /** Days of week (0 = Sunday, 6 = Saturday) */
  WEEKEND_DAYS: [0, 6] as const,

  /** First day of work week (1 = Monday) */
  FIRST_WORK_DAY: 1,

  /** Last day of work week (5 = Friday) */
  LAST_WORK_DAY: 5,
} as const;
