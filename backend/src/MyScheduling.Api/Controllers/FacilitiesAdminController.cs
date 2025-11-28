using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Infrastructure.Services;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FacilitiesAdminController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly IFacilitiesExcelService _excelService;

    public FacilitiesAdminController(MySchedulingDbContext context, IFacilitiesExcelService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    #region Floors CRUD

    [HttpGet("floors")]
    public async Task<ActionResult<IEnumerable<Floor>>> GetFloors([FromQuery] Guid tenantId, [FromQuery] Guid? officeId = null)
    {
        var query = _context.Floors
            .Include(f => f.Office)
            .Where(f => f.TenantId == tenantId && !f.IsDeleted);

        if (officeId.HasValue)
        {
            query = query.Where(f => f.OfficeId == officeId.Value);
        }

        return Ok(await query.OrderBy(f => f.Office.Name).ThenBy(f => f.Level).ToListAsync());
    }

    [HttpGet("floors/{id}")]
    public async Task<ActionResult<Floor>> GetFloor(Guid id, [FromQuery] Guid tenantId)
    {
        var floor = await _context.Floors
            .Include(f => f.Office)
            .Include(f => f.Zones)
            .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId && !f.IsDeleted);

        if (floor == null) return NotFound();
        return Ok(floor);
    }

    [HttpPost("floors")]
    public async Task<ActionResult<Floor>> CreateFloor([FromQuery] Guid tenantId, [FromBody] CreateFloorRequest request)
    {
        var floor = new Floor
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            OfficeId = request.OfficeId,
            Name = request.Name,
            Level = request.Level,
            SquareFootage = request.SquareFootage,
            FloorPlanUrl = request.FloorPlanUrl,
            IsActive = request.IsActive
        };

        _context.Floors.Add(floor);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFloor), new { id = floor.Id, tenantId }, floor);
    }

    [HttpPut("floors/{id}")]
    public async Task<ActionResult<Floor>> UpdateFloor(Guid id, [FromQuery] Guid tenantId, [FromBody] UpdateFloorRequest request)
    {
        var floor = await _context.Floors.FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId && !f.IsDeleted);
        if (floor == null) return NotFound();

        floor.Name = request.Name;
        floor.Level = request.Level;
        floor.SquareFootage = request.SquareFootage;
        floor.FloorPlanUrl = request.FloorPlanUrl;
        floor.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return Ok(floor);
    }

    [HttpDelete("floors/{id}")]
    public async Task<ActionResult> DeleteFloor(Guid id, [FromQuery] Guid tenantId)
    {
        var floor = await _context.Floors.FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId && !f.IsDeleted);
        if (floor == null) return NotFound();

        floor.IsDeleted = true;
        floor.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    #endregion

    #region Zones CRUD

    [HttpGet("zones")]
    public async Task<ActionResult<IEnumerable<Zone>>> GetZones([FromQuery] Guid tenantId, [FromQuery] Guid? floorId = null, [FromQuery] Guid? officeId = null)
    {
        var query = _context.Zones
            .Include(z => z.Floor)
            .ThenInclude(f => f.Office)
            .Where(z => z.TenantId == tenantId && !z.IsDeleted);

        if (floorId.HasValue)
        {
            query = query.Where(z => z.FloorId == floorId.Value);
        }

        if (officeId.HasValue)
        {
            query = query.Where(z => z.Floor.OfficeId == officeId.Value);
        }

        return Ok(await query.OrderBy(z => z.Floor.Office.Name).ThenBy(z => z.Floor.Name).ThenBy(z => z.Name).ToListAsync());
    }

    [HttpGet("zones/{id}")]
    public async Task<ActionResult<Zone>> GetZone(Guid id, [FromQuery] Guid tenantId)
    {
        var zone = await _context.Zones
            .Include(z => z.Floor)
            .ThenInclude(f => f.Office)
            .FirstOrDefaultAsync(z => z.Id == id && z.TenantId == tenantId && !z.IsDeleted);

        if (zone == null) return NotFound();
        return Ok(zone);
    }

    [HttpPost("zones")]
    public async Task<ActionResult<Zone>> CreateZone([FromQuery] Guid tenantId, [FromBody] CreateZoneRequest request)
    {
        var zone = new Zone
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FloorId = request.FloorId,
            Name = request.Name,
            Description = request.Description,
            Color = request.Color,
            IsActive = request.IsActive
        };

        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetZone), new { id = zone.Id, tenantId }, zone);
    }

    [HttpPut("zones/{id}")]
    public async Task<ActionResult<Zone>> UpdateZone(Guid id, [FromQuery] Guid tenantId, [FromBody] UpdateZoneRequest request)
    {
        var zone = await _context.Zones.FirstOrDefaultAsync(z => z.Id == id && z.TenantId == tenantId && !z.IsDeleted);
        if (zone == null) return NotFound();

        zone.Name = request.Name;
        zone.Description = request.Description;
        zone.Color = request.Color;
        zone.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return Ok(zone);
    }

    [HttpDelete("zones/{id}")]
    public async Task<ActionResult> DeleteZone(Guid id, [FromQuery] Guid tenantId)
    {
        var zone = await _context.Zones.FirstOrDefaultAsync(z => z.Id == id && z.TenantId == tenantId && !z.IsDeleted);
        if (zone == null) return NotFound();

        zone.IsDeleted = true;
        zone.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    #endregion

    #region Space Assignments CRUD

    [HttpGet("assignments")]
    public async Task<ActionResult<IEnumerable<SpaceAssignment>>> GetSpaceAssignments([FromQuery] Guid tenantId, [FromQuery] Guid? spaceId = null, [FromQuery] Guid? userId = null)
    {
        var query = _context.SpaceAssignments
            .Include(a => a.Space)
            .ThenInclude(s => s.Office)
            .Include(a => a.User)
            .Where(a => a.TenantId == tenantId && !a.IsDeleted);

        if (spaceId.HasValue)
        {
            query = query.Where(a => a.SpaceId == spaceId.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        return Ok(await query.OrderBy(a => a.Space.Office.Name).ThenBy(a => a.Space.Name).ToListAsync());
    }

    [HttpGet("assignments/{id}")]
    public async Task<ActionResult<SpaceAssignment>> GetSpaceAssignment(Guid id, [FromQuery] Guid tenantId)
    {
        var assignment = await _context.SpaceAssignments
            .Include(a => a.Space)
            .ThenInclude(s => s.Office)
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);

        if (assignment == null) return NotFound();
        return Ok(assignment);
    }

    [HttpPost("assignments")]
    public async Task<ActionResult<SpaceAssignment>> CreateSpaceAssignment([FromQuery] Guid tenantId, [FromBody] CreateSpaceAssignmentRequest request)
    {
        var assignment = new SpaceAssignment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SpaceId = request.SpaceId,
            UserId = request.UserId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Type = request.Type,
            Status = SpaceAssignmentStatus.Active,
            Notes = request.Notes
        };

        _context.SpaceAssignments.Add(assignment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSpaceAssignment), new { id = assignment.Id, tenantId }, assignment);
    }

    [HttpPut("assignments/{id}")]
    public async Task<ActionResult<SpaceAssignment>> UpdateSpaceAssignment(Guid id, [FromQuery] Guid tenantId, [FromBody] UpdateSpaceAssignmentRequest request)
    {
        var assignment = await _context.SpaceAssignments.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);
        if (assignment == null) return NotFound();

        assignment.StartDate = request.StartDate;
        assignment.EndDate = request.EndDate;
        assignment.Type = request.Type;
        assignment.Status = request.Status;
        assignment.Notes = request.Notes;

        await _context.SaveChangesAsync();
        return Ok(assignment);
    }

    [HttpDelete("assignments/{id}")]
    public async Task<ActionResult> DeleteSpaceAssignment(Guid id, [FromQuery] Guid tenantId)
    {
        var assignment = await _context.SpaceAssignments.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);
        if (assignment == null) return NotFound();

        assignment.IsDeleted = true;
        assignment.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    #endregion

    #region Booking Rules CRUD

    [HttpGet("booking-rules")]
    public async Task<ActionResult<IEnumerable<BookingRule>>> GetBookingRules([FromQuery] Guid tenantId, [FromQuery] Guid? officeId = null)
    {
        var query = _context.BookingRules
            .Include(r => r.Office)
            .Include(r => r.Space)
            .Where(r => r.TenantId == tenantId && !r.IsDeleted);

        if (officeId.HasValue)
        {
            query = query.Where(r => r.OfficeId == officeId.Value || r.OfficeId == null);
        }

        return Ok(await query.OrderBy(r => r.Priority).ThenBy(r => r.Name).ToListAsync());
    }

    [HttpGet("booking-rules/{id}")]
    public async Task<ActionResult<BookingRule>> GetBookingRule(Guid id, [FromQuery] Guid tenantId)
    {
        var rule = await _context.BookingRules
            .Include(r => r.Office)
            .Include(r => r.Space)
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);

        if (rule == null) return NotFound();
        return Ok(rule);
    }

    [HttpPost("booking-rules")]
    public async Task<ActionResult<BookingRule>> CreateBookingRule([FromQuery] Guid tenantId, [FromBody] CreateBookingRuleRequest request)
    {
        var rule = new BookingRule
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            OfficeId = request.OfficeId,
            SpaceId = request.SpaceId,
            SpaceType = request.SpaceType,
            MinDurationMinutes = request.MinDurationMinutes,
            MaxDurationMinutes = request.MaxDurationMinutes,
            MinAdvanceBookingMinutes = request.MinAdvanceBookingMinutes,
            MaxAdvanceBookingDays = request.MaxAdvanceBookingDays,
            EarliestStartTime = request.EarliestStartTime,
            LatestEndTime = request.LatestEndTime,
            AllowedDaysOfWeek = request.AllowedDaysOfWeek,
            AllowRecurring = request.AllowRecurring,
            MaxRecurringWeeks = request.MaxRecurringWeeks,
            RequiresApproval = request.RequiresApproval,
            AutoApproveForRoles = request.AutoApproveForRoles,
            AutoApproveRoles = request.AutoApproveRoles,
            MaxBookingsPerUserPerDay = request.MaxBookingsPerUserPerDay,
            MaxBookingsPerUserPerWeek = request.MaxBookingsPerUserPerWeek,
            IsActive = request.IsActive,
            Priority = request.Priority
        };

        _context.BookingRules.Add(rule);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBookingRule), new { id = rule.Id, tenantId }, rule);
    }

    [HttpPut("booking-rules/{id}")]
    public async Task<ActionResult<BookingRule>> UpdateBookingRule(Guid id, [FromQuery] Guid tenantId, [FromBody] UpdateBookingRuleRequest request)
    {
        var rule = await _context.BookingRules.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
        if (rule == null) return NotFound();

        rule.Name = request.Name;
        rule.Description = request.Description;
        rule.OfficeId = request.OfficeId;
        rule.SpaceId = request.SpaceId;
        rule.SpaceType = request.SpaceType;
        rule.MinDurationMinutes = request.MinDurationMinutes;
        rule.MaxDurationMinutes = request.MaxDurationMinutes;
        rule.MinAdvanceBookingMinutes = request.MinAdvanceBookingMinutes;
        rule.MaxAdvanceBookingDays = request.MaxAdvanceBookingDays;
        rule.EarliestStartTime = request.EarliestStartTime;
        rule.LatestEndTime = request.LatestEndTime;
        rule.AllowedDaysOfWeek = request.AllowedDaysOfWeek;
        rule.AllowRecurring = request.AllowRecurring;
        rule.MaxRecurringWeeks = request.MaxRecurringWeeks;
        rule.RequiresApproval = request.RequiresApproval;
        rule.AutoApproveForRoles = request.AutoApproveForRoles;
        rule.AutoApproveRoles = request.AutoApproveRoles;
        rule.MaxBookingsPerUserPerDay = request.MaxBookingsPerUserPerDay;
        rule.MaxBookingsPerUserPerWeek = request.MaxBookingsPerUserPerWeek;
        rule.IsActive = request.IsActive;
        rule.Priority = request.Priority;

        await _context.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpDelete("booking-rules/{id}")]
    public async Task<ActionResult> DeleteBookingRule(Guid id, [FromQuery] Guid tenantId)
    {
        var rule = await _context.BookingRules.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
        if (rule == null) return NotFound();

        rule.IsDeleted = true;
        rule.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    #endregion

    #region Excel Export Endpoints

    [HttpGet("export/offices")]
    public async Task<IActionResult> ExportOfficesToExcel([FromQuery] Guid tenantId)
    {
        var bytes = await _excelService.ExportOfficesToExcelAsync(tenantId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Offices.xlsx");
    }

    [HttpGet("export/spaces")]
    public async Task<IActionResult> ExportSpacesToExcel([FromQuery] Guid tenantId, [FromQuery] Guid? officeId = null)
    {
        var bytes = await _excelService.ExportSpacesToExcelAsync(tenantId, officeId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Spaces.xlsx");
    }

    [HttpGet("export/floors")]
    public async Task<IActionResult> ExportFloorsToExcel([FromQuery] Guid tenantId, [FromQuery] Guid? officeId = null)
    {
        var bytes = await _excelService.ExportFloorsToExcelAsync(tenantId, officeId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Floors.xlsx");
    }

    [HttpGet("export/zones")]
    public async Task<IActionResult> ExportZonesToExcel([FromQuery] Guid tenantId, [FromQuery] Guid? officeId = null)
    {
        var bytes = await _excelService.ExportZonesToExcelAsync(tenantId, officeId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Zones.xlsx");
    }

    [HttpGet("export/assignments")]
    public async Task<IActionResult> ExportSpaceAssignmentsToExcel([FromQuery] Guid tenantId)
    {
        var bytes = await _excelService.ExportSpaceAssignmentsToExcelAsync(tenantId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "SpaceAssignments.xlsx");
    }

    [HttpGet("export/booking-rules")]
    public async Task<IActionResult> ExportBookingRulesToExcel([FromQuery] Guid tenantId)
    {
        var bytes = await _excelService.ExportBookingRulesToExcelAsync(tenantId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BookingRules.xlsx");
    }

    #endregion

    #region Excel Import Endpoints

    [HttpPost("import/offices")]
    public async Task<ActionResult<ImportResult>> ImportOfficesFromExcel([FromQuery] Guid tenantId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        using var stream = file.OpenReadStream();
        var result = await _excelService.ImportOfficesFromExcelAsync(tenantId, stream);
        return Ok(result);
    }

    [HttpPost("import/spaces")]
    public async Task<ActionResult<ImportResult>> ImportSpacesFromExcel([FromQuery] Guid tenantId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        using var stream = file.OpenReadStream();
        var result = await _excelService.ImportSpacesFromExcelAsync(tenantId, stream);
        return Ok(result);
    }

    [HttpPost("import/floors")]
    public async Task<ActionResult<ImportResult>> ImportFloorsFromExcel([FromQuery] Guid tenantId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        using var stream = file.OpenReadStream();
        var result = await _excelService.ImportFloorsFromExcelAsync(tenantId, stream);
        return Ok(result);
    }

    [HttpPost("import/zones")]
    public async Task<ActionResult<ImportResult>> ImportZonesFromExcel([FromQuery] Guid tenantId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        using var stream = file.OpenReadStream();
        var result = await _excelService.ImportZonesFromExcelAsync(tenantId, stream);
        return Ok(result);
    }

    [HttpPost("import/assignments")]
    public async Task<ActionResult<ImportResult>> ImportSpaceAssignmentsFromExcel([FromQuery] Guid tenantId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        using var stream = file.OpenReadStream();
        var result = await _excelService.ImportSpaceAssignmentsFromExcelAsync(tenantId, stream);
        return Ok(result);
    }

    #endregion

    #region Excel Template Endpoints

    [HttpGet("templates/offices")]
    public IActionResult GetOfficesTemplate()
    {
        var bytes = _excelService.GetOfficesTemplate();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "OfficesTemplate.xlsx");
    }

    [HttpGet("templates/spaces")]
    public IActionResult GetSpacesTemplate()
    {
        var bytes = _excelService.GetSpacesTemplate();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "SpacesTemplate.xlsx");
    }

    [HttpGet("templates/floors")]
    public IActionResult GetFloorsTemplate()
    {
        var bytes = _excelService.GetFloorsTemplate();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "FloorsTemplate.xlsx");
    }

    [HttpGet("templates/zones")]
    public IActionResult GetZonesTemplate()
    {
        var bytes = _excelService.GetZonesTemplate();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ZonesTemplate.xlsx");
    }

    [HttpGet("templates/assignments")]
    public IActionResult GetSpaceAssignmentsTemplate()
    {
        var bytes = _excelService.GetSpaceAssignmentsTemplate();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "SpaceAssignmentsTemplate.xlsx");
    }

    #endregion
}

#region Request DTOs

public record CreateFloorRequest(Guid OfficeId, string Name, int Level, decimal? SquareFootage, string? FloorPlanUrl, bool IsActive = true);
public record UpdateFloorRequest(string Name, int Level, decimal? SquareFootage, string? FloorPlanUrl, bool IsActive);

public record CreateZoneRequest(Guid FloorId, string Name, string? Description, string? Color, bool IsActive = true);
public record UpdateZoneRequest(string Name, string? Description, string? Color, bool IsActive);

public record CreateSpaceAssignmentRequest(Guid SpaceId, Guid UserId, DateOnly StartDate, DateOnly? EndDate, SpaceAssignmentType Type, string? Notes);
public record UpdateSpaceAssignmentRequest(DateOnly StartDate, DateOnly? EndDate, SpaceAssignmentType Type, SpaceAssignmentStatus Status, string? Notes);

public record CreateBookingRuleRequest(
    string Name,
    string? Description,
    Guid? OfficeId,
    Guid? SpaceId,
    SpaceType? SpaceType,
    int? MinDurationMinutes,
    int? MaxDurationMinutes,
    int? MinAdvanceBookingMinutes,
    int? MaxAdvanceBookingDays,
    TimeOnly? EarliestStartTime,
    TimeOnly? LatestEndTime,
    string? AllowedDaysOfWeek,
    bool AllowRecurring,
    int? MaxRecurringWeeks,
    bool RequiresApproval,
    bool AutoApproveForRoles,
    string? AutoApproveRoles,
    int? MaxBookingsPerUserPerDay,
    int? MaxBookingsPerUserPerWeek,
    bool IsActive,
    int Priority);

public record UpdateBookingRuleRequest(
    string Name,
    string? Description,
    Guid? OfficeId,
    Guid? SpaceId,
    SpaceType? SpaceType,
    int? MinDurationMinutes,
    int? MaxDurationMinutes,
    int? MinAdvanceBookingMinutes,
    int? MaxAdvanceBookingDays,
    TimeOnly? EarliestStartTime,
    TimeOnly? LatestEndTime,
    string? AllowedDaysOfWeek,
    bool AllowRecurring,
    int? MaxRecurringWeeks,
    bool RequiresApproval,
    bool AutoApproveForRoles,
    string? AutoApproveRoles,
    int? MaxBookingsPerUserPerDay,
    int? MaxBookingsPerUserPerWeek,
    bool IsActive,
    int Priority);

#endregion
