using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Infrastructure.Services;

public class WorkingDaysService : IWorkingDaysService
{
    private readonly MySchedulingDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<WorkingDaysService> _logger;

    private const int CACHE_DURATION_MINUTES = 30;
    private const string CACHE_PREFIX = "WorkingDays_";

    public WorkingDaysService(
        MySchedulingDbContext context,
        IMemoryCache cache,
        ILogger<WorkingDaysService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<MonthWorkingDays> CalculateMonthWorkingDaysAsync(Guid tenantId, int year, int month)
    {
        var cacheKey = $"{CACHE_PREFIX}{tenantId}_{year}_{month}";

        if (_cache.TryGetValue(cacheKey, out MonthWorkingDays? cachedResult) && cachedResult != null)
        {
            return cachedResult;
        }

        var result = await CalculateMonthWorkingDaysInternalAsync(tenantId, year, month);

        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(CACHE_DURATION_MINUTES));

        return result;
    }

    public async Task<List<MonthWorkingDays>> CalculateMonthRangeWorkingDaysAsync(
        Guid tenantId, int startYear, int startMonth, int monthCount)
    {
        var results = new List<MonthWorkingDays>();
        var currentYear = startYear;
        var currentMonth = startMonth;

        for (int i = 0; i < monthCount; i++)
        {
            results.Add(await CalculateMonthWorkingDaysAsync(tenantId, currentYear, currentMonth));

            // Move to next month
            currentMonth++;
            if (currentMonth > 12)
            {
                currentMonth = 1;
                currentYear++;
            }
        }

        return results;
    }

    public async Task<decimal> GetMonthAvailableHoursAsync(Guid tenantId, int year, int month)
    {
        var monthData = await CalculateMonthWorkingDaysAsync(tenantId, year, month);
        return monthData.AvailableHours;
    }

    public async Task<decimal> CalculateForecastHoursAsync(
        Guid tenantId, int year, int month, decimal utilizationPercent = 1.0m)
    {
        var monthData = await CalculateMonthWorkingDaysAsync(tenantId, year, month);
        return Math.Round(monthData.AvailableHours * utilizationPercent, 2);
    }

    private async Task<MonthWorkingDays> CalculateMonthWorkingDaysInternalAsync(Guid tenantId, int year, int month)
    {
        // Get tenant settings
        var settings = await GetTenantSettingsAsync(tenantId);

        // Calculate basic month info
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var firstDayOfMonth = new DateOnly(year, month, 1);
        var lastDayOfMonth = new DateOnly(year, month, daysInMonth);

        // Count weekends
        int weekends = 0;
        int businessDays = 0;

        for (int day = 1; day <= daysInMonth; day++)
        {
            var date = new DateOnly(year, month, day);
            var dayOfWeek = date.DayOfWeek;

            bool isWeekend = false;
            if (settings.ExcludeSaturdays && dayOfWeek == DayOfWeek.Saturday)
            {
                isWeekend = true;
            }
            if (settings.ExcludeSundays && dayOfWeek == DayOfWeek.Sunday)
            {
                isWeekend = true;
            }

            if (isWeekend)
            {
                weekends++;
            }
            else
            {
                businessDays++;
            }
        }

        // Get holidays for this month
        var holidays = await GetHolidaysForMonthAsync(tenantId, year, month);
        var holidayCount = holidays.Count;

        // Subtract holidays that fall on weekdays (don't double-count weekend holidays)
        var weekdayHolidays = holidays.Count(h =>
        {
            var dayOfWeek = h.HolidayDate.DayOfWeek;
            bool isWeekend = (settings.ExcludeSaturdays && dayOfWeek == DayOfWeek.Saturday) ||
                            (settings.ExcludeSundays && dayOfWeek == DayOfWeek.Sunday);
            return !isWeekend;
        });

        // Calculate net working days
        var netWorkingDays = businessDays - weekdayHolidays - (int)Math.Round(settings.DefaultPtoDaysPerMonth);
        if (netWorkingDays < 0) netWorkingDays = 0;

        // Calculate available hours
        var availableHours = netWorkingDays * settings.StandardHoursPerDay;

        return new MonthWorkingDays
        {
            Year = year,
            Month = month,
            TotalDays = daysInMonth,
            BusinessDays = businessDays,
            Weekends = weekends,
            Holidays = weekdayHolidays,
            PtoDays = settings.DefaultPtoDaysPerMonth,
            NetWorkingDays = netWorkingDays,
            AvailableHours = availableHours
        };
    }

    private async Task<TenantSettings> GetTenantSettingsAsync(Guid tenantId)
    {
        var cacheKey = $"{CACHE_PREFIX}Settings_{tenantId}";

        if (_cache.TryGetValue(cacheKey, out TenantSettings? cachedSettings) && cachedSettings != null)
        {
            return cachedSettings;
        }

        var settings = await _context.TenantSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        if (settings == null)
        {
            // Return defaults
            settings = new TenantSettings
            {
                FiscalYearStartMonth = 10,
                DefaultPtoDaysPerMonth = 1.5m,
                StandardHoursPerDay = 8.0m,
                ExcludeSaturdays = true,
                ExcludeSundays = true
            };
        }

        _cache.Set(cacheKey, settings, TimeSpan.FromMinutes(CACHE_DURATION_MINUTES));

        return settings;
    }

    private async Task<List<CompanyHoliday>> GetHolidaysForMonthAsync(Guid tenantId, int year, int month)
    {
        var cacheKey = $"{CACHE_PREFIX}Holidays_{tenantId}_{year}_{month}";

        if (_cache.TryGetValue(cacheKey, out List<CompanyHoliday>? cachedHolidays) && cachedHolidays != null)
        {
            return cachedHolidays;
        }

        var firstDay = new DateOnly(year, month, 1);
        var lastDay = new DateOnly(year, month, DateTime.DaysInMonth(year, month));

        var holidays = await _context.CompanyHolidays
            .AsNoTracking()
            .Where(h => h.TenantId == tenantId)
            .Where(h => h.IsActive && h.IsObserved)
            .Where(h => h.HolidayDate >= firstDay && h.HolidayDate <= lastDay)
            .Where(h => h.AutoApplyToForecast) // Only count holidays that should affect forecasting
            .ToListAsync();

        _cache.Set(cacheKey, holidays, TimeSpan.FromMinutes(CACHE_DURATION_MINUTES));

        return holidays;
    }
}
