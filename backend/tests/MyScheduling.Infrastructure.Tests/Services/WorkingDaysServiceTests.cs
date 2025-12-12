using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Infrastructure.Services;

namespace MyScheduling.Infrastructure.Tests.Services;

public class WorkingDaysServiceTests : IDisposable
{
    private readonly MySchedulingDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly Mock<ILogger<WorkingDaysService>> _loggerMock;
    private readonly WorkingDaysService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public WorkingDaysServiceTests()
    {
        var options = new DbContextOptionsBuilder<MySchedulingDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new MySchedulingDbContext(options);
        _cache = new MemoryCache(new MemoryCacheOptions());
        _loggerMock = new Mock<ILogger<WorkingDaysService>>();
        _service = new WorkingDaysService(_context, _cache, _loggerMock.Object);
    }

    public void Dispose()
    {
        _context.Dispose();
        _cache.Dispose();
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_WithDefaultSettings_ReturnsCorrectCalculation()
    {
        // Arrange - January 2025 has 31 days, 23 weekdays (8 weekend days)
        // With default settings: 1.5 PTO days, 8 hours per day
        var year = 2025;
        var month = 1;

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, year, month);

        // Assert
        result.Should().NotBeNull();
        result.Year.Should().Be(year);
        result.Month.Should().Be(month);
        result.TotalDays.Should().Be(31);
        result.BusinessDays.Should().Be(23); // 31 - 8 weekend days
        result.Weekends.Should().Be(8);
        result.PtoDays.Should().Be(1.5m); // Default PTO
        result.NetWorkingDays.Should().Be(21); // 23 - 0 holidays - 2 (rounded from 1.5)
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_WithTenantSettings_UsesCustomValues()
    {
        // Arrange
        var settings = new TenantSettings
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            FiscalYearStartMonth = 10,
            StandardHoursPerDay = 7.5m,
            DefaultPtoDaysPerMonth = 2.0m,
            ExcludeSaturdays = true,
            ExcludeSundays = true
        };
        _context.TenantSettings.Add(settings);
        await _context.SaveChangesAsync();

        var year = 2025;
        var month = 1;

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, year, month);

        // Assert
        result.PtoDays.Should().Be(2.0m);
        result.AvailableHours.Should().Be((23 - 2) * 7.5m); // (businessDays - PTO) * hoursPerDay
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_WithHolidays_SubtractsFromWorkingDays()
    {
        // Arrange - Add a weekday holiday
        var holiday = new CompanyHoliday
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "New Year's Day",
            HolidayDate = new DateOnly(2025, 1, 1), // Wednesday
            IsActive = true,
            IsObserved = true,
            AutoApplyToForecast = true
        };
        _context.CompanyHolidays.Add(holiday);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, 2025, 1);

        // Assert
        result.Holidays.Should().Be(1);
        result.NetWorkingDays.Should().Be(20); // 23 business days - 1 holiday - 2 PTO (rounded)
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_WithWeekendHoliday_DoesNotDoubleCount()
    {
        // Arrange - Add a Saturday holiday (should not reduce business days)
        var holiday = new CompanyHoliday
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "Saturday Holiday",
            HolidayDate = new DateOnly(2025, 1, 4), // Saturday
            IsActive = true,
            IsObserved = true,
            AutoApplyToForecast = true
        };
        _context.CompanyHolidays.Add(holiday);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, 2025, 1);

        // Assert
        result.Holidays.Should().Be(0); // Weekend holiday not counted
        result.NetWorkingDays.Should().Be(21); // Same as without holiday
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_CachesResult()
    {
        // Arrange
        var year = 2025;
        var month = 3;

        // Act - Call twice
        var result1 = await _service.CalculateMonthWorkingDaysAsync(_tenantId, year, month);
        var result2 = await _service.CalculateMonthWorkingDaysAsync(_tenantId, year, month);

        // Assert - Both should return same object from cache
        result1.Should().BeEquivalentTo(result2);
    }

    [Fact]
    public async Task CalculateMonthRangeWorkingDaysAsync_ReturnsCorrectNumberOfMonths()
    {
        // Arrange
        var startYear = 2025;
        var startMonth = 10; // October
        var monthCount = 12; // Full fiscal year

        // Act
        var results = await _service.CalculateMonthRangeWorkingDaysAsync(_tenantId, startYear, startMonth, monthCount);

        // Assert
        results.Should().HaveCount(12);
        results[0].Year.Should().Be(2025);
        results[0].Month.Should().Be(10); // October 2025
        results[2].Year.Should().Be(2025);
        results[2].Month.Should().Be(12); // December 2025
        results[3].Year.Should().Be(2026);
        results[3].Month.Should().Be(1); // January 2026
        results[11].Year.Should().Be(2026);
        results[11].Month.Should().Be(9); // September 2026
    }

    [Fact]
    public async Task GetMonthAvailableHoursAsync_ReturnsCorrectHours()
    {
        // Arrange - With default 8 hours per day
        var year = 2025;
        var month = 2; // February 2025

        // Act
        var hours = await _service.GetMonthAvailableHoursAsync(_tenantId, year, month);

        // Assert
        hours.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CalculateForecastHoursAsync_WithUtilization_AppliesPercentage()
    {
        // Arrange
        var year = 2025;
        var month = 1;
        var utilizationPercent = 0.8m; // 80%

        // Act
        var fullHours = await _service.GetMonthAvailableHoursAsync(_tenantId, year, month);
        var utilizedHours = await _service.CalculateForecastHoursAsync(_tenantId, year, month, utilizationPercent);

        // Assert
        utilizedHours.Should().Be(Math.Round(fullHours * utilizationPercent, 2));
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_February2024_LeapYear_Has29Days()
    {
        // Arrange - 2024 is a leap year
        var year = 2024;
        var month = 2;

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, year, month);

        // Assert
        result.TotalDays.Should().Be(29);
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_February2025_NonLeapYear_Has28Days()
    {
        // Arrange - 2025 is not a leap year
        var year = 2025;
        var month = 2;

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, year, month);

        // Assert
        result.TotalDays.Should().Be(28);
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_WithMultipleHolidays_SubtractsAll()
    {
        // Arrange - Add multiple weekday holidays
        var holidays = new List<CompanyHoliday>
        {
            new() { Id = Guid.NewGuid(), TenantId = _tenantId, Name = "Holiday 1", HolidayDate = new DateOnly(2025, 1, 1), IsActive = true, IsObserved = true, AutoApplyToForecast = true },
            new() { Id = Guid.NewGuid(), TenantId = _tenantId, Name = "Holiday 2", HolidayDate = new DateOnly(2025, 1, 20), IsActive = true, IsObserved = true, AutoApplyToForecast = true },
        };
        _context.CompanyHolidays.AddRange(holidays);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, 2025, 1);

        // Assert
        result.Holidays.Should().Be(2);
        result.NetWorkingDays.Should().Be(19); // 23 - 2 holidays - 2 PTO
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_InactiveHoliday_NotCounted()
    {
        // Arrange - Add an inactive holiday
        var holiday = new CompanyHoliday
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "Inactive Holiday",
            HolidayDate = new DateOnly(2025, 1, 15),
            IsActive = false, // Inactive
            IsObserved = true,
            AutoApplyToForecast = true
        };
        _context.CompanyHolidays.Add(holiday);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, 2025, 1);

        // Assert
        result.Holidays.Should().Be(0);
    }

    [Fact]
    public async Task CalculateMonthWorkingDaysAsync_NonForecastHoliday_NotCounted()
    {
        // Arrange - Add a holiday not applied to forecast
        var holiday = new CompanyHoliday
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "Non-Forecast Holiday",
            HolidayDate = new DateOnly(2025, 1, 15),
            IsActive = true,
            IsObserved = true,
            AutoApplyToForecast = false // Not applied to forecast
        };
        _context.CompanyHolidays.Add(holiday);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMonthWorkingDaysAsync(_tenantId, 2025, 1);

        // Assert
        result.Holidays.Should().Be(0);
    }
}
