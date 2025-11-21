using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(MySchedulingDbContext context, ILogger<BookingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Verify that a user has access to a booking's tenant and has appropriate roles
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
            _logger.LogWarning("User {UserId} attempted to access booking from tenant {TenantId} without membership",
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
                _logger.LogWarning("User {UserId} lacks required roles {RequiredRoles} for booking action",
                    userId, string.Join(", ", requiredRoles));
                return (false, $"User does not have permission. Required role: {string.Join(" or ", requiredRoles)}", tenantMembership);
            }
        }

        return (true, null, tenantMembership);
    }

    // GET: api/bookings
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Booking>>> GetBookings(
        [FromQuery] Guid? personId = null,
        [FromQuery] Guid? spaceId = null,
        [FromQuery] Guid? officeId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] BookingStatus? status = null)
    {
        try
        {
            var query = _context.Bookings
                .AsNoTracking()
                .AsQueryable();

            if (personId.HasValue)
            {
                query = query.Where(b => b.PersonId == personId.Value);
            }

            if (spaceId.HasValue)
            {
                query = query.Where(b => b.SpaceId == spaceId.Value);
            }

            if (officeId.HasValue)
            {
                query = query.Where(b => b.Space.OfficeId == officeId.Value);
            }

            if (startDate.HasValue)
            {
                var utcStartDate = startDate.Value.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc)
                    : startDate.Value.ToUniversalTime();
                query = query.Where(b => b.EndDatetime >= utcStartDate);
            }

            if (endDate.HasValue)
            {
                var utcEndDate = endDate.Value.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc)
                    : endDate.Value.ToUniversalTime();
                query = query.Where(b => b.StartDatetime <= utcEndDate);
            }

            if (status.HasValue)
            {
                query = query.Where(b => b.Status == status.Value);
            }

            var bookings = await query
                .OrderBy(b => b.StartDatetime)
                .ToListAsync();

            return Ok(bookings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving bookings");
            return StatusCode(500, "An error occurred while retrieving bookings");
        }
    }

    // GET: api/bookings/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Booking>> GetBooking(Guid id)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Person)
                .Include(b => b.Space)
                    .ThenInclude(s => s.Office)
                .Include(b => b.CheckInEvents)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound($"Booking with ID {id} not found");
            }

            return Ok(booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving booking {BookingId}", id);
            return StatusCode(500, "An error occurred while retrieving the booking");
        }
    }

    // POST: api/bookings
    [HttpPost]
    public async Task<ActionResult<Booking>> CreateBooking(
        [FromQuery] Guid userId,
        Booking booking)
    {
        try
        {
            // Get person to verify tenant
            var person = await _context.People.FindAsync(booking.PersonId);
            if (person == null)
            {
                return NotFound("Person not found");
            }

            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                booking.TenantId,
                AppRole.Employee, AppRole.TeamLead, AppRole.ProjectManager, AppRole.ResourceManager, AppRole.OfficeManager, AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            // Users can only book for themselves unless they have manager roles
            if (person.UserId != userId)
            {
                var (canModify, modifyError, _) = await VerifyUserAccess(
                    userId,
                    booking.TenantId,
                    AppRole.OfficeManager, AppRole.ResourceManager, AppRole.TenantAdmin);

                if (!canModify)
                {
                    return StatusCode(403, "Users can only create bookings for themselves");
                }
            }

            // Check for space conflicts
            var hasConflict = await _context.Bookings
                .AnyAsync(b =>
                    b.SpaceId == booking.SpaceId &&
                    b.Id != booking.Id &&
                    (b.Status == BookingStatus.Reserved || b.Status == BookingStatus.CheckedIn) &&
                    ((booking.StartDatetime >= b.StartDatetime && booking.StartDatetime < b.EndDatetime) ||
                     (booking.EndDatetime > b.StartDatetime && booking.EndDatetime <= b.EndDatetime) ||
                     (booking.StartDatetime <= b.StartDatetime && booking.EndDatetime >= b.EndDatetime)));

            if (hasConflict)
            {
                return Conflict("This space is already booked for the requested time period");
            }

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking");
            return StatusCode(500, "An error occurred while creating the booking");
        }
    }

    // PUT: api/bookings/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBooking(
        Guid id,
        [FromQuery] Guid userId,
        Booking booking)
    {
        if (id != booking.Id)
        {
            return BadRequest("ID mismatch");
        }

        try
        {
            var existing = await _context.Bookings
                .Include(b => b.Person)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (existing == null)
            {
                return NotFound($"Booking with ID {id} not found");
            }

            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                existing.TenantId,
                AppRole.Employee, AppRole.TeamLead, AppRole.ProjectManager, AppRole.ResourceManager, AppRole.OfficeManager, AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            // Users can only update their own bookings unless they have manager roles
            if (existing.Person?.UserId != userId)
            {
                var (canModify, modifyError, _) = await VerifyUserAccess(
                    userId,
                    existing.TenantId,
                    AppRole.OfficeManager, AppRole.ResourceManager, AppRole.TenantAdmin);

                if (!canModify)
                {
                    return StatusCode(403, "Users can only update their own bookings");
                }
            }

            _context.Entry(booking).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await BookingExists(id))
                {
                    return NotFound($"Booking with ID {id} not found");
                }
                throw;
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating booking {BookingId}", id);
            return StatusCode(500, "An error occurred while updating the booking");
        }
    }

    // DELETE: api/bookings/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBooking(
        Guid id,
        [FromQuery] Guid userId)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Person)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound($"Booking with ID {id} not found");
            }

            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                booking.TenantId,
                AppRole.Employee, AppRole.TeamLead, AppRole.ProjectManager, AppRole.ResourceManager, AppRole.OfficeManager, AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            // Users can only delete their own bookings unless they have manager roles
            if (booking.Person?.UserId != userId)
            {
                var (canModify, modifyError, _) = await VerifyUserAccess(
                    userId,
                    booking.TenantId,
                    AppRole.OfficeManager, AppRole.ResourceManager, AppRole.TenantAdmin);

                if (!canModify)
                {
                    return StatusCode(403, "Users can only delete their own bookings");
                }
            }

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting booking {BookingId}", id);
            return StatusCode(500, "An error occurred while deleting the booking");
        }
    }

    // POST: api/bookings/{id}/checkin
    [HttpPost("{id}/checkin")]
    public async Task<IActionResult> CheckIn(Guid id, [FromBody] string method)
    {
        try
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound($"Booking with ID {id} not found");
            }

            booking.Status = BookingStatus.CheckedIn;

            var checkInEvent = new CheckInEvent
            {
                BookingId = id,
                Timestamp = DateTime.UtcNow,
                Method = method
            };

            _context.CheckInEvents.Add(checkInEvent);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking in booking {BookingId}", id);
            return StatusCode(500, "An error occurred while checking in");
        }
    }

    // GET: api/bookings/offices
    [HttpGet("offices")]
    public async Task<ActionResult<IEnumerable<Office>>> GetOffices([FromQuery] Guid? tenantId = null)
    {
        try
        {
            var query = _context.Offices
                .AsNoTracking()
                .AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(o => o.TenantId == tenantId.Value);
            }

            var offices = await query
                .OrderBy(o => o.Name)
                .ToListAsync();

            return Ok(offices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving offices");
            return StatusCode(500, "An error occurred while retrieving offices");
        }
    }

    // GET: api/bookings/spaces
    [HttpGet("spaces")]
    public async Task<ActionResult<IEnumerable<Space>>> GetSpaces(
        [FromQuery] Guid? officeId = null,
        [FromQuery] SpaceType? type = null)
    {
        try
        {
            var query = _context.Spaces
                .AsNoTracking()
                .AsQueryable();

            if (officeId.HasValue)
            {
                query = query.Where(s => s.OfficeId == officeId.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(s => s.Type == type.Value);
            }

            var spaces = await query
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(spaces);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving spaces");
            return StatusCode(500, "An error occurred while retrieving spaces");
        }
    }

    private async Task<bool> BookingExists(Guid id)
    {
        return await _context.Bookings.AnyAsync(e => e.Id == id);
    }
}
