using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HolidaysController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<HolidaysController> _logger;

    public HolidaysController(MySchedulingDbContext context, ILogger<HolidaysController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Verify that a user has access to a tenant and has appropriate roles
    /// </summary>
    private async Task<(bool isAuthorized, string? errorMessage, TenantMembership? membership)>
        VerifyUserAccess(Guid userId, Guid tenantId, params AppRole[] requiredRoles)
    {
        var user = await _context.Users
            .Include(u => u.TenantMemberships)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return (false, "User not found", null);
        }

        var tenantMembership = user.TenantMemberships
            .FirstOrDefault(tm => tm.TenantId == tenantId && tm.IsActive);

        if (tenantMembership == null)
        {
            _logger.LogWarning("User {UserId} attempted to access holidays from tenant {TenantId} without membership",
                userId, tenantId);
            return (false, "User does not have access to this tenant", null);
        }

        // System admins bypass role checks
        if (user.IsSystemAdmin)
        {
            return (true, null, tenantMembership);
        }

        // Check if user has any of the required roles
        if (requiredRoles.Length > 0)
        {
            var hasRole = tenantMembership.Roles.Any(r => requiredRoles.Contains(r));
            if (!hasRole)
            {
                _logger.LogWarning("User {UserId} lacks required roles {RequiredRoles} for holiday management",
                    userId, string.Join(", ", requiredRoles));
                return (false, $"User does not have permission. Required role: {string.Join(" or ", requiredRoles)}", tenantMembership);
            }
        }

        return (true, null, tenantMembership);
    }

    // GET: api/holidays
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompanyHoliday>>> GetHolidays(
        [FromQuery] Guid tenantId,
        [FromQuery] int? year = null,
        [FromQuery] HolidayType? type = null,
        [FromQuery] bool? isObserved = null)
    {
        try
        {
            var query = _context.CompanyHolidays
                .AsNoTracking()
                .Where(h => h.TenantId == tenantId);

            if (year.HasValue)
            {
                query = query.Where(h => h.HolidayDate.Year == year.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(h => h.Type == type.Value);
            }

            if (isObserved.HasValue)
            {
                query = query.Where(h => h.IsObserved == isObserved.Value);
            }

            var holidays = await query
                .OrderBy(h => h.HolidayDate)
                .ToListAsync();

            return Ok(holidays);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving holidays for tenant {TenantId}", tenantId);
            return StatusCode(500, "An error occurred while retrieving holidays");
        }
    }

    // GET: api/holidays/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyHoliday>> GetHoliday(Guid id)
    {
        try
        {
            var holiday = await _context.CompanyHolidays
                .FirstOrDefaultAsync(h => h.Id == id);

            if (holiday == null)
            {
                return NotFound($"Holiday with ID {id} not found");
            }

            return Ok(holiday);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving holiday {HolidayId}", id);
            return StatusCode(500, "An error occurred while retrieving the holiday");
        }
    }

    // POST: api/holidays
    [HttpPost]
    public async Task<ActionResult<CompanyHoliday>> CreateHoliday(
        [FromQuery] Guid userId,
        CompanyHoliday holiday)
    {
        try
        {
            // Verify user access - only admins can manage holidays
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                holiday.TenantId,
                AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            _context.CompanyHolidays.Add(holiday);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHoliday), new { id = holiday.Id }, holiday);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating holiday");
            return StatusCode(500, "An error occurred while creating the holiday");
        }
    }

    // PUT: api/holidays/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHoliday(
        Guid id,
        [FromQuery] Guid userId,
        CompanyHoliday holiday)
    {
        if (id != holiday.Id)
        {
            return BadRequest("ID mismatch");
        }

        try
        {
            var existing = await _context.CompanyHolidays.FindAsync(id);
            if (existing == null)
            {
                return NotFound($"Holiday with ID {id} not found");
            }

            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                existing.TenantId,
                AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            _context.Entry(existing).CurrentValues.SetValues(holiday);
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating holiday {HolidayId}", id);
            return StatusCode(500, "An error occurred while updating the holiday");
        }
    }

    // DELETE: api/holidays/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHoliday(
        Guid id,
        [FromQuery] Guid userId)
    {
        try
        {
            var holiday = await _context.CompanyHolidays.FindAsync(id);
            if (holiday == null)
            {
                return NotFound($"Holiday with ID {id} not found");
            }

            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                holiday.TenantId,
                AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            _context.CompanyHolidays.Remove(holiday);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting holiday {HolidayId}", id);
            return StatusCode(500, "An error occurred while deleting the holiday");
        }
    }
}
