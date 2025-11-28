using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Interfaces;

namespace MyScheduling.Api.Controllers;

public class CheckInRequest
{
    public string? Method { get; set; }
    public DateOnly? CheckInDate { get; set; }
}

public class CreateBookingRequest
{
    public Guid TenantId { get; set; }
    public Guid SpaceId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartDatetime { get; set; }
    public DateTime? EndDatetime { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Reserved;
    public bool IsPermanent { get; set; }
    public Guid? BookedByUserId { get; set; }
    public DateTime? BookedAt { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class BookingsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<BookingsController> _logger;
    private readonly IAuthorizationService _authService;

    public BookingsController(
        MySchedulingDbContext context,
        ILogger<BookingsController> logger,
        IAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }


    // GET: api/bookings
    [HttpGet]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<Booking>>> GetBookings(
        [FromQuery] Guid? userId = null,
        [FromQuery] Guid? spaceId = null,
        [FromQuery] Guid? officeId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] BookingStatus? status = null)
    {
        try
        {
            var query = _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Space)
                    .ThenInclude(s => s.Office)
                .AsNoTracking()
                .AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(b => b.UserId == userId.Value);
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
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Read)]
    public async Task<ActionResult<Booking>> GetBooking(Guid id)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.User)
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
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Create)]
    public async Task<ActionResult<Booking>> CreateBooking([FromBody] CreateBookingRequest request)
    {
        try
        {
            if (request.UserId == Guid.Empty)
            {
                return BadRequest("UserId is required");
            }

            if (request.SpaceId == Guid.Empty)
            {
                return BadRequest("SpaceId is required");
            }

            if (request.TenantId == Guid.Empty)
            {
                return BadRequest("TenantId is required");
            }

            // Verify the space exists
            var space = await _context.Spaces.FindAsync(request.SpaceId);
            if (space == null)
            {
                return BadRequest($"Space with ID {request.SpaceId} not found");
            }

            // Verify the user exists
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return BadRequest($"User with ID {request.UserId} not found");
            }

            // Convert DateTimes to UTC for PostgreSQL compatibility
            var startDatetimeUtc = request.StartDatetime.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(request.StartDatetime, DateTimeKind.Utc)
                : request.StartDatetime.ToUniversalTime();

            DateTime? endDatetimeUtc = null;
            if (request.EndDatetime.HasValue)
            {
                endDatetimeUtc = request.EndDatetime.Value.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(request.EndDatetime.Value, DateTimeKind.Utc)
                    : request.EndDatetime.Value.ToUniversalTime();
            }

            // Check for space conflicts - handle permanent bookings (null EndDatetime)
            var hasConflict = await _context.Bookings
                .AnyAsync(b =>
                    b.SpaceId == request.SpaceId &&
                    (b.Status == BookingStatus.Reserved || b.Status == BookingStatus.CheckedIn) &&
                    (
                        // Existing booking is permanent - conflicts with any future booking
                        (b.IsPermanent && startDatetimeUtc >= b.StartDatetime) ||
                        // New booking is permanent - conflicts with any existing active booking
                        (request.IsPermanent && (b.EndDatetime == null || b.EndDatetime > startDatetimeUtc)) ||
                        // Both have end dates - standard overlap check
                        (!b.IsPermanent && !request.IsPermanent && b.EndDatetime.HasValue && endDatetimeUtc.HasValue &&
                         ((startDatetimeUtc >= b.StartDatetime && startDatetimeUtc < b.EndDatetime) ||
                          (endDatetimeUtc > b.StartDatetime && endDatetimeUtc <= b.EndDatetime) ||
                          (startDatetimeUtc <= b.StartDatetime && endDatetimeUtc >= b.EndDatetime)))
                    ));

            if (hasConflict)
            {
                return Conflict("This space is already booked for the requested time period");
            }

            // Create the booking entity from the request
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TenantId = request.TenantId,
                SpaceId = request.SpaceId,
                UserId = request.UserId,
                StartDatetime = startDatetimeUtc,
                EndDatetime = endDatetimeUtc,
                Status = request.Status,
                IsPermanent = request.IsPermanent,
                BookedByUserId = request.BookedByUserId,
                BookedAt = request.BookedAt ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Reload with navigation properties for response
            var createdBooking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Space)
                    .ThenInclude(s => s.Office)
                .FirstOrDefaultAsync(b => b.Id == booking.Id);

            return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, createdBooking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking");
            return StatusCode(500, "An error occurred while creating the booking");
        }
    }

    // PUT: api/bookings/{id}
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Update)]
    public async Task<IActionResult> UpdateBooking(Guid id, Booking booking)
    {
        if (id != booking.Id)
        {
            return BadRequest("ID mismatch");
        }

        try
        {

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

    // DELETE: api/bookings/{id} (Soft Delete)
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Delete)]
    public async Task<IActionResult> DeleteBooking(Guid id, [FromQuery] string? reason = null)
    {
        try
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound($"Booking with ID {id} not found");
            }

            booking.IsDeleted = true;
            booking.DeletedAt = DateTime.UtcNow;
            booking.DeletedByUserId = GetCurrentUserId();
            booking.DeletionReason = reason;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Booking {BookingId} soft-deleted by user {UserId}", id, booking.DeletedByUserId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft-deleting booking {BookingId}", id);
            return StatusCode(500, "An error occurred while deleting the booking");
        }
    }

    // DELETE: api/bookings/{id}/hard (Hard Delete - Platform Admin Only)
    [HttpDelete("{id}/hard")]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.HardDelete)]
    public async Task<IActionResult> HardDeleteBooking(Guid id)
    {
        try
        {
            var booking = await _context.Bookings
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound($"Booking with ID {id} not found");
            }

            var archive = new DataArchive
            {
                Id = Guid.NewGuid(),
                TenantId = booking.TenantId,
                EntityType = "Booking",
                EntityId = booking.Id,
                EntitySnapshot = System.Text.Json.JsonSerializer.Serialize(booking),
                ArchivedAt = DateTime.UtcNow,
                ArchivedByUserId = GetCurrentUserId(),
                Status = DataArchiveStatus.PermanentlyDeleted,
                PermanentlyDeletedAt = DateTime.UtcNow,
                PermanentlyDeletedByUserId = GetCurrentUserId(),
                CreatedAt = DateTime.UtcNow
            };

            _context.DataArchives.Add(archive);
            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            _logger.LogWarning("Booking {BookingId} HARD DELETED by user {UserId}", id, GetCurrentUserId());

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error hard-deleting booking {BookingId}", id);
            return StatusCode(500, "An error occurred while permanently deleting the booking");
        }
    }

    // POST: api/bookings/{id}/restore (Restore Soft-Deleted)
    [HttpPost("{id}/restore")]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Restore)]
    public async Task<IActionResult> RestoreBooking(Guid id)
    {
        try
        {
            var booking = await _context.Bookings
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(b => b.Id == id && b.IsDeleted);

            if (booking == null)
            {
                return NotFound($"Soft-deleted booking with ID {id} not found");
            }

            booking.IsDeleted = false;
            booking.DeletedAt = null;
            booking.DeletedByUserId = null;
            booking.DeletionReason = null;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Booking {BookingId} restored by user {UserId}", id, GetCurrentUserId());

            return Ok(booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring booking {BookingId}", id);
            return StatusCode(500, "An error occurred while restoring the booking");
        }
    }

    // POST: api/bookings/{id}/checkin
    [HttpPost("{id}/checkin")]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Update)]
    public async Task<IActionResult> CheckIn(Guid id, [FromBody] CheckInRequest request)
    {
        try
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound($"Booking with ID {id} not found");
            }

            var checkInDate = request.CheckInDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

            // Check if already checked in for this date
            var existingCheckIn = await _context.CheckInEvents
                .FirstOrDefaultAsync(c => c.BookingId == id && c.CheckInDate == checkInDate);

            if (existingCheckIn != null)
            {
                return Conflict($"Already checked in for {checkInDate:yyyy-MM-dd}");
            }

            var checkInEvent = new CheckInEvent
            {
                BookingId = id,
                CheckInDate = checkInDate,
                Timestamp = DateTime.UtcNow,
                Method = request.Method ?? "web",
                Status = CheckInStatus.CheckedIn,
                ProcessedByUserId = GetCurrentUserId()
            };

            _context.CheckInEvents.Add(checkInEvent);
            await _context.SaveChangesAsync();

            return Ok(checkInEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking in booking {BookingId}", id);
            return StatusCode(500, "An error occurred while checking in");
        }
    }

    // POST: api/bookings/{id}/checkout
    [HttpPost("{id}/checkout")]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Update)]
    public async Task<IActionResult> CheckOut(Guid id, [FromBody] CheckInRequest request)
    {
        try
        {
            var checkInDate = request.CheckInDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

            var checkInEvent = await _context.CheckInEvents
                .FirstOrDefaultAsync(c => c.BookingId == id && c.CheckInDate == checkInDate);

            if (checkInEvent == null)
            {
                return NotFound($"No check-in found for {checkInDate:yyyy-MM-dd}");
            }

            if (checkInEvent.Status != CheckInStatus.CheckedIn)
            {
                return BadRequest($"Cannot check out - current status is {checkInEvent.Status}");
            }

            checkInEvent.Status = CheckInStatus.CheckedOut;
            await _context.SaveChangesAsync();

            return Ok(checkInEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking out booking {BookingId}", id);
            return StatusCode(500, "An error occurred while checking out");
        }
    }

    // GET: api/bookings/{id}/checkins
    [HttpGet("{id}/checkins")]
    [RequiresPermission(Resource = "Booking", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<CheckInEvent>>> GetCheckIns(Guid id)
    {
        try
        {
            var checkIns = await _context.CheckInEvents
                .Where(c => c.BookingId == id)
                .OrderBy(c => c.CheckInDate)
                .ToListAsync();

            return Ok(checkIns);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving check-ins for booking {BookingId}", id);
            return StatusCode(500, "An error occurred while retrieving check-ins");
        }
    }

    // GET: api/bookings/offices
    [HttpGet("offices")]
    [RequiresPermission(Resource = "Office", Action = PermissionAction.Read)]
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
    [RequiresPermission(Resource = "Space", Action = PermissionAction.Read)]
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
