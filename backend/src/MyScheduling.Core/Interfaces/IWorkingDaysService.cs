namespace MyScheduling.Core.Interfaces;

/// <summary>
/// Represents working days calculation result for a month
/// </summary>
public class MonthWorkingDays
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalDays { get; set; }
    public int BusinessDays { get; set; }
    public int Weekends { get; set; }
    public int Holidays { get; set; }
    public decimal PtoDays { get; set; }
    public int NetWorkingDays { get; set; }
    public decimal AvailableHours { get; set; }
}

/// <summary>
/// Service for calculating working days and available hours per month
/// </summary>
public interface IWorkingDaysService
{
    /// <summary>
    /// Calculates working days and available hours for a specific month
    /// </summary>
    /// <param name="tenantId">Tenant for holiday and settings lookup</param>
    /// <param name="year">Calendar year</param>
    /// <param name="month">Month (1-12)</param>
    /// <returns>Working days calculation result</returns>
    Task<MonthWorkingDays> CalculateMonthWorkingDaysAsync(Guid tenantId, int year, int month);

    /// <summary>
    /// Calculates working days and available hours for a range of months
    /// </summary>
    /// <param name="tenantId">Tenant for holiday and settings lookup</param>
    /// <param name="startYear">Start year</param>
    /// <param name="startMonth">Start month (1-12)</param>
    /// <param name="monthCount">Number of months to calculate</param>
    /// <returns>List of working days calculations</returns>
    Task<List<MonthWorkingDays>> CalculateMonthRangeWorkingDaysAsync(
        Guid tenantId, int startYear, int startMonth, int monthCount);

    /// <summary>
    /// Gets total available hours for a month using tenant defaults
    /// </summary>
    /// <param name="tenantId">Tenant for settings lookup</param>
    /// <param name="year">Calendar year</param>
    /// <param name="month">Month (1-12)</param>
    /// <returns>Available working hours</returns>
    Task<decimal> GetMonthAvailableHoursAsync(Guid tenantId, int year, int month);

    /// <summary>
    /// Fills forecast hours based on working days calculation
    /// Returns the hours value for a month based on tenant settings
    /// </summary>
    /// <param name="tenantId">Tenant for settings lookup</param>
    /// <param name="year">Calendar year</param>
    /// <param name="month">Month (1-12)</param>
    /// <param name="utilizationPercent">Target utilization (0.0 to 1.0)</param>
    /// <returns>Calculated hours for the month</returns>
    Task<decimal> CalculateForecastHoursAsync(
        Guid tenantId, int year, int month, decimal utilizationPercent = 1.0m);
}
