using Microsoft.AspNetCore.Mvc;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkingDaysController : AuthorizedControllerBase
{
    private readonly IWorkingDaysService _workingDaysService;
    private readonly ILogger<WorkingDaysController> _logger;

    public WorkingDaysController(
        IWorkingDaysService workingDaysService,
        ILogger<WorkingDaysController> logger)
    {
        _workingDaysService = workingDaysService;
        _logger = logger;
    }

    /// <summary>
    /// Get working days calculation for a specific month
    /// </summary>
    [HttpGet("{year}/{month}")]
    [RequiresPermission(Resource = "Forecast", Action = PermissionAction.Read)]
    public async Task<ActionResult<MonthWorkingDays>> GetMonthWorkingDays(int year, int month)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            if (month < 1 || month > 12)
            {
                return BadRequest(new { message = "Month must be between 1 and 12" });
            }

            if (year < 2000 || year > 2100)
            {
                return BadRequest(new { message = "Year must be between 2000 and 2100" });
            }

            var result = await _workingDaysService.CalculateMonthWorkingDaysAsync(
                tenantId.Value, year, month);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating working days for {Year}/{Month}", year, month);
            return StatusCode(500, new { message = "An error occurred while calculating working days" });
        }
    }

    /// <summary>
    /// Get working days calculation for a range of months
    /// </summary>
    [HttpGet("range")]
    [RequiresPermission(Resource = "Forecast", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<MonthWorkingDays>>> GetMonthRangeWorkingDays(
        [FromQuery] int startYear,
        [FromQuery] int startMonth,
        [FromQuery] int monthCount = 12)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            if (startMonth < 1 || startMonth > 12)
            {
                return BadRequest(new { message = "Start month must be between 1 and 12" });
            }

            if (startYear < 2000 || startYear > 2100)
            {
                return BadRequest(new { message = "Start year must be between 2000 and 2100" });
            }

            if (monthCount < 1 || monthCount > 36)
            {
                return BadRequest(new { message = "Month count must be between 1 and 36" });
            }

            var results = await _workingDaysService.CalculateMonthRangeWorkingDaysAsync(
                tenantId.Value, startYear, startMonth, monthCount);

            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating working days range starting {Year}/{Month}", startYear, startMonth);
            return StatusCode(500, new { message = "An error occurred while calculating working days range" });
        }
    }

    /// <summary>
    /// Get available hours for a month (quick calculation)
    /// </summary>
    [HttpGet("{year}/{month}/hours")]
    [RequiresPermission(Resource = "Forecast", Action = PermissionAction.Read)]
    public async Task<ActionResult<object>> GetMonthAvailableHours(int year, int month)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            if (month < 1 || month > 12)
            {
                return BadRequest(new { message = "Month must be between 1 and 12" });
            }

            var hours = await _workingDaysService.GetMonthAvailableHoursAsync(
                tenantId.Value, year, month);

            return Ok(new { year, month, availableHours = hours });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available hours for {Year}/{Month}", year, month);
            return StatusCode(500, new { message = "An error occurred while calculating available hours" });
        }
    }

    /// <summary>
    /// Calculate recommended forecast hours for a month with optional utilization
    /// </summary>
    [HttpGet("{year}/{month}/forecast-hours")]
    [RequiresPermission(Resource = "Forecast", Action = PermissionAction.Read)]
    public async Task<ActionResult<object>> GetRecommendedForecastHours(
        int year,
        int month,
        [FromQuery] decimal utilization = 1.0m)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
            {
                return BadRequest(new { message = "Invalid tenant context" });
            }

            if (month < 1 || month > 12)
            {
                return BadRequest(new { message = "Month must be between 1 and 12" });
            }

            if (utilization <= 0 || utilization > 1.5m)
            {
                return BadRequest(new { message = "Utilization must be between 0 and 1.5 (150%)" });
            }

            var hours = await _workingDaysService.CalculateForecastHoursAsync(
                tenantId.Value, year, month, utilization);

            return Ok(new
            {
                year,
                month,
                utilization,
                recommendedHours = hours
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating forecast hours for {Year}/{Month}", year, month);
            return StatusCode(500, new { message = "An error occurred while calculating forecast hours" });
        }
    }

    private Guid? GetCurrentTenantId()
    {
        // Check X-Tenant-Id header first (set by frontend when workspace selected)
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
            Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
        {
            // Verify user has access to this tenant
            var userTenantIds = User.FindAll("TenantId")
                .Select(c => Guid.TryParse(c.Value, out var tid) ? tid : Guid.Empty)
                .Where(id => id != Guid.Empty)
                .ToList();

            if (userTenantIds.Contains(parsedHeaderTenantId))
                return parsedHeaderTenantId;
        }

        // Fallback to first TenantId claim
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var parsedTenantId))
            return parsedTenantId;

        return null;
    }
}
