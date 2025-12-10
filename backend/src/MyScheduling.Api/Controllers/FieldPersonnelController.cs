using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Field Personnel and FSO Management API
/// </summary>
[ApiController]
[Route("api/field-personnel")]
public class FieldPersonnelController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<FieldPersonnelController> _logger;

    public FieldPersonnelController(MySchedulingDbContext context, ILogger<FieldPersonnelController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ==================== FIELD ASSIGNMENTS ====================

    /// <summary>
    /// Get all field assignments
    /// </summary>
    [HttpGet("assignments")]
    [RequiresPermission(Resource = "FieldAssignment", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<FieldAssignment>>> GetAssignments(
        [FromQuery] Guid? userId = null,
        [FromQuery] Guid? clientSiteId = null,
        [FromQuery] FieldAssignmentStatus? status = null)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.FieldAssignments
                .Include(f => f.User)
                .Include(f => f.ClientSiteOffice)
                .Include(f => f.ApprovedBy)
                .Where(f => f.TenantId == tenantId.Value)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(f => f.UserId == userId.Value);
            }

            if (clientSiteId.HasValue)
            {
                query = query.Where(f => f.ClientSiteOfficeId == clientSiteId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(f => f.Status == status.Value);
            }

            var assignments = await query
                .OrderByDescending(f => f.StartDate)
                .ToListAsync();

            return Ok(assignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving field assignments");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Get assignment by ID
    /// </summary>
    [HttpGet("assignments/{id}")]
    [RequiresPermission(Resource = "FieldAssignment", Action = PermissionAction.Read)]
    public async Task<ActionResult<FieldAssignment>> GetAssignment(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var assignment = await _context.FieldAssignments
                .Include(f => f.User)
                .Include(f => f.ClientSiteOffice)
                .Include(f => f.ApprovedBy)
                .Include(f => f.ClearanceVerifiedBy)
                .Where(f => f.Id == id && f.TenantId == tenantId.Value)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (assignment == null)
                return NotFound();

            return Ok(assignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving assignment");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Create field assignment
    /// </summary>
    [HttpPost("assignments")]
    [RequiresPermission(Resource = "FieldAssignment", Action = PermissionAction.Create)]
    public async Task<ActionResult<FieldAssignment>> CreateAssignment([FromBody] FieldAssignment assignment)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            assignment.Id = Guid.NewGuid();
            assignment.TenantId = tenantId.Value;
            assignment.Status = FieldAssignmentStatus.Pending;

            _context.FieldAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAssignment), new { id = assignment.Id }, assignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating assignment");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Update field assignment
    /// </summary>
    [HttpPut("assignments/{id}")]
    [RequiresPermission(Resource = "FieldAssignment", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateAssignment(Guid id, [FromBody] FieldAssignment assignment)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var existing = await _context.FieldAssignments
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (existing == null)
                return NotFound();

            existing.ClientSiteOfficeId = assignment.ClientSiteOfficeId;
            existing.StartDate = assignment.StartDate;
            existing.EndDate = assignment.EndDate;
            existing.ProjectName = assignment.ProjectName;
            existing.TaskDescription = assignment.TaskDescription;
            existing.ContractNumber = assignment.ContractNumber;
            existing.BillRate = assignment.BillRate;
            existing.ExpectedHoursPerWeek = assignment.ExpectedHoursPerWeek;
            existing.Notes = assignment.Notes;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating assignment");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Approve field assignment
    /// </summary>
    [HttpPost("assignments/{id}/approve")]
    [RequiresPermission(Resource = "FieldAssignment", Action = PermissionAction.Manage)]
    public async Task<ActionResult> ApproveAssignment(Guid id, [FromBody] FieldApprovalRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var userId = GetCurrentUserId();
            if (!tenantId.HasValue || !userId.HasValue)
                return BadRequest(new { message = "Invalid context" });

            var assignment = await _context.FieldAssignments
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (assignment == null)
                return NotFound();

            assignment.Status = FieldAssignmentStatus.Active;
            assignment.ApprovedByUserId = userId;
            assignment.ApprovedAt = DateTime.UtcNow;
            assignment.ApprovalNotes = request.Notes;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Assignment approved" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving assignment");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Verify clearance for assignment
    /// </summary>
    [HttpPost("assignments/{id}/verify-clearance")]
    [RequiresPermission(Resource = "FieldAssignment", Action = PermissionAction.Manage)]
    public async Task<ActionResult> VerifyClearance(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var userId = GetCurrentUserId();
            if (!tenantId.HasValue || !userId.HasValue)
                return BadRequest(new { message = "Invalid context" });

            var assignment = await _context.FieldAssignments
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (assignment == null)
                return NotFound();

            assignment.ClearanceVerified = true;
            assignment.ClearanceVerifiedDate = DateOnly.FromDateTime(DateTime.UtcNow);
            assignment.ClearanceVerifiedByUserId = userId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Clearance verified" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying clearance");
            return StatusCode(500, "An error occurred");
        }
    }

    // ==================== CLIENT SITE DETAILS ====================

    /// <summary>
    /// Get client site details
    /// </summary>
    [HttpGet("client-sites")]
    [RequiresPermission(Resource = "ClientSite", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<ClientSiteDetail>>> GetClientSites()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var sites = await _context.ClientSiteDetails
                .Include(c => c.Office)
                .Include(c => c.AssignedFso)
                .Where(c => c.TenantId == tenantId.Value)
                .AsNoTracking()
                .ToListAsync();

            return Ok(sites);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving client sites");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Create or update client site details
    /// </summary>
    [HttpPut("client-sites/{officeId}")]
    [RequiresPermission(Resource = "ClientSite", Action = PermissionAction.Manage)]
    public async Task<ActionResult<ClientSiteDetail>> UpsertClientSite(Guid officeId, [FromBody] ClientSiteDetail detail)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var existing = await _context.ClientSiteDetails
                .FirstOrDefaultAsync(c => c.OfficeId == officeId && c.TenantId == tenantId.Value);

            if (existing == null)
            {
                detail.Id = Guid.NewGuid();
                detail.TenantId = tenantId.Value;
                detail.OfficeId = officeId;
                _context.ClientSiteDetails.Add(detail);
            }
            else
            {
                existing.ClientName = detail.ClientName;
                existing.ContractNumber = detail.ContractNumber;
                existing.TaskOrderNumber = detail.TaskOrderNumber;
                existing.ClientPocName = detail.ClientPocName;
                existing.ClientPocEmail = detail.ClientPocEmail;
                existing.ClientPocPhone = detail.ClientPocPhone;
                existing.RequiredClearance = detail.RequiredClearance;
                existing.RequiresBadge = detail.RequiresBadge;
                existing.BadgeType = detail.BadgeType;
                existing.BadgeInstructions = detail.BadgeInstructions;
                existing.HasScif = detail.HasScif;
                existing.ScifAccessInstructions = detail.ScifAccessInstructions;
                existing.SecurityPocName = detail.SecurityPocName;
                existing.SecurityPocEmail = detail.SecurityPocEmail;
                existing.SecurityPocPhone = detail.SecurityPocPhone;
                existing.SiteHours = detail.SiteHours;
                existing.AccessInstructions = detail.AccessInstructions;
                existing.CheckInProcedure = detail.CheckInProcedure;
                existing.EscortRequirements = detail.EscortRequirements;
                existing.NetworkAccess = detail.NetworkAccess;
                existing.ItSupportContact = detail.ItSupportContact;
                existing.ApprovedDevices = detail.ApprovedDevices;
                existing.AssignedFsoUserId = detail.AssignedFsoUserId;
                existing.CustomAttributes = detail.CustomAttributes;
            }

            await _context.SaveChangesAsync();
            return Ok(existing ?? detail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting client site");
            return StatusCode(500, "An error occurred");
        }
    }

    // ==================== EMPLOYEE CLEARANCES ====================

    /// <summary>
    /// Get employee clearances
    /// </summary>
    [HttpGet("clearances")]
    [RequiresPermission(Resource = "Clearance", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<EmployeeClearance>>> GetClearances(
        [FromQuery] Guid? userId = null,
        [FromQuery] SecurityClearanceLevel? level = null,
        [FromQuery] ClearanceStatus? status = null)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.EmployeeClearances
                .Include(c => c.User)
                .Include(c => c.VerifiedBy)
                .Where(c => c.TenantId == tenantId.Value)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(c => c.UserId == userId.Value);
            }

            if (level.HasValue)
            {
                query = query.Where(c => c.Level == level.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            var clearances = await query
                .OrderBy(c => c.User.DisplayName)
                .ToListAsync();

            return Ok(clearances);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving clearances");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Create or update clearance record
    /// </summary>
    [HttpPost("clearances")]
    [RequiresPermission(Resource = "Clearance", Action = PermissionAction.Manage)]
    public async Task<ActionResult<EmployeeClearance>> UpsertClearance([FromBody] EmployeeClearance clearance)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var currentUserId = GetCurrentUserId();
            if (!tenantId.HasValue || !currentUserId.HasValue)
                return BadRequest(new { message = "Invalid context" });

            var existing = await _context.EmployeeClearances
                .FirstOrDefaultAsync(c => c.UserId == clearance.UserId && c.TenantId == tenantId.Value);

            if (existing == null)
            {
                clearance.Id = Guid.NewGuid();
                clearance.TenantId = tenantId.Value;
                clearance.VerifiedByUserId = currentUserId;
                clearance.VerifiedAt = DateTime.UtcNow;
                _context.EmployeeClearances.Add(clearance);
            }
            else
            {
                existing.Level = clearance.Level;
                existing.Status = clearance.Status;
                existing.InvestigationType = clearance.InvestigationType;
                existing.InvestigationDate = clearance.InvestigationDate;
                existing.GrantedDate = clearance.GrantedDate;
                existing.ExpirationDate = clearance.ExpirationDate;
                existing.ReinvestigationDate = clearance.ReinvestigationDate;
                existing.HasPolygraph = clearance.HasPolygraph;
                existing.PolygraphType = clearance.PolygraphType;
                existing.PolygraphDate = clearance.PolygraphDate;
                existing.PolygraphExpirationDate = clearance.PolygraphExpirationDate;
                existing.HasSciAccess = clearance.HasSciAccess;
                existing.SciCompartments = clearance.SciCompartments;
                existing.SciAccessDate = clearance.SciAccessDate;
                existing.SponsoringAgency = clearance.SponsoringAgency;
                existing.ContractorCode = clearance.ContractorCode;
                existing.Notes = clearance.Notes;
                existing.VerifiedByUserId = currentUserId;
                existing.VerifiedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(existing ?? clearance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting clearance");
            return StatusCode(500, "An error occurred");
        }
    }

    // ==================== FOREIGN TRAVEL ====================

    /// <summary>
    /// Get foreign travel records
    /// </summary>
    [HttpGet("foreign-travel")]
    [RequiresPermission(Resource = "ForeignTravel", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<ForeignTravelRecord>>> GetForeignTravel(
        [FromQuery] Guid? userId = null,
        [FromQuery] ForeignTravelStatus? status = null)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.ForeignTravelRecords
                .Include(f => f.User)
                .Include(f => f.ApprovedBy)
                .Where(f => f.TenantId == tenantId.Value)
                .AsNoTracking();

            if (userId.HasValue)
            {
                query = query.Where(f => f.UserId == userId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(f => f.Status == status.Value);
            }

            var records = await query
                .OrderByDescending(f => f.DepartureDate)
                .ToListAsync();

            return Ok(records);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving foreign travel");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Submit foreign travel request
    /// </summary>
    [HttpPost("foreign-travel")]
    [RequiresPermission(Resource = "ForeignTravel", Action = PermissionAction.Create)]
    public async Task<ActionResult<ForeignTravelRecord>> SubmitForeignTravel([FromBody] ForeignTravelRecord record)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var userId = GetCurrentUserId();
            if (!tenantId.HasValue || !userId.HasValue)
                return BadRequest(new { message = "Invalid context" });

            record.Id = Guid.NewGuid();
            record.TenantId = tenantId.Value;
            record.UserId = userId.Value;
            record.Status = ForeignTravelStatus.Pending;

            _context.ForeignTravelRecords.Add(record);
            await _context.SaveChangesAsync();

            return Ok(record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting foreign travel");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Approve foreign travel
    /// </summary>
    [HttpPost("foreign-travel/{id}/approve")]
    [RequiresPermission(Resource = "ForeignTravel", Action = PermissionAction.Manage)]
    public async Task<ActionResult> ApproveForeignTravel(Guid id, [FromBody] FieldApprovalRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var userId = GetCurrentUserId();
            if (!tenantId.HasValue || !userId.HasValue)
                return BadRequest(new { message = "Invalid context" });

            var record = await _context.ForeignTravelRecords
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (record == null)
                return NotFound();

            record.Status = ForeignTravelStatus.Approved;
            record.FsoApproved = true;
            record.ApprovedByUserId = userId;
            record.ApprovedAt = DateTime.UtcNow;
            record.ApprovalNotes = request.Notes;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Travel approved" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving travel");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Record pre-travel briefing
    /// </summary>
    [HttpPost("foreign-travel/{id}/briefing")]
    [RequiresPermission(Resource = "ForeignTravel", Action = PermissionAction.Manage)]
    public async Task<ActionResult> RecordBriefing(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var userId = GetCurrentUserId();
            if (!tenantId.HasValue || !userId.HasValue)
                return BadRequest(new { message = "Invalid context" });

            var record = await _context.ForeignTravelRecords
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (record == null)
                return NotFound();

            record.BriefingCompleted = true;
            record.BriefingDate = DateOnly.FromDateTime(DateTime.UtcNow);
            record.BriefedByUserId = userId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Briefing recorded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording briefing");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Record post-travel debriefing
    /// </summary>
    [HttpPost("foreign-travel/{id}/debrief")]
    [RequiresPermission(Resource = "ForeignTravel", Action = PermissionAction.Manage)]
    public async Task<ActionResult> RecordDebriefing(Guid id, [FromBody] DebriefRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var userId = GetCurrentUserId();
            if (!tenantId.HasValue || !userId.HasValue)
                return BadRequest(new { message = "Invalid context" });

            var record = await _context.ForeignTravelRecords
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (record == null)
                return NotFound();

            record.Status = ForeignTravelStatus.Completed;
            record.DebriefingCompleted = true;
            record.DebriefingDate = DateOnly.FromDateTime(DateTime.UtcNow);
            record.DebriefedByUserId = userId;
            record.DebriefingNotes = request.Notes;
            record.ForeignContactsReported = request.ForeignContactsReported;
            record.ForeignContacts = request.ForeignContacts;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Debriefing recorded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording debriefing");
            return StatusCode(500, "An error occurred");
        }
    }

    // ==================== SCIF ACCESS ====================

    /// <summary>
    /// Get SCIF access logs
    /// </summary>
    [HttpGet("scif-access")]
    [RequiresPermission(Resource = "ScifAccess", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<ScifAccessLog>>> GetScifAccessLogs(
        [FromQuery] Guid? officeId = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] int days = 30)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var since = DateTime.UtcNow.AddDays(-days);

            var query = _context.ScifAccessLogs
                .Include(s => s.User)
                .Include(s => s.Office)
                .Include(s => s.Escort)
                .Where(s => s.TenantId == tenantId.Value && s.AccessTime >= since)
                .AsNoTracking();

            if (officeId.HasValue)
            {
                query = query.Where(s => s.OfficeId == officeId.Value);
            }

            if (userId.HasValue)
            {
                query = query.Where(s => s.UserId == userId.Value);
            }

            var logs = await query
                .OrderByDescending(s => s.AccessTime)
                .ToListAsync();

            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving SCIF access logs");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Log SCIF access
    /// </summary>
    [HttpPost("scif-access")]
    [RequiresPermission(Resource = "ScifAccess", Action = PermissionAction.Create)]
    public async Task<ActionResult<ScifAccessLog>> LogScifAccess([FromBody] ScifAccessLog log)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            log.Id = Guid.NewGuid();
            log.TenantId = tenantId.Value;
            log.AccessTime = DateTime.UtcNow;

            _context.ScifAccessLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(log);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging SCIF access");
            return StatusCode(500, "An error occurred");
        }
    }

    /// <summary>
    /// Record SCIF exit
    /// </summary>
    [HttpPost("scif-access/{id}/exit")]
    [RequiresPermission(Resource = "ScifAccess", Action = PermissionAction.Update)]
    public async Task<ActionResult> RecordScifExit(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var log = await _context.ScifAccessLogs
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId.Value);

            if (log == null)
                return NotFound();

            log.ExitTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Exit recorded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording SCIF exit");
            return StatusCode(500, "An error occurred");
        }
    }

    // ==================== HELPER METHODS ====================

    private Guid? GetCurrentTenantId()
    {
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
            Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
        {
            var userTenantIds = User.FindAll("TenantId")
                .Select(c => Guid.TryParse(c.Value, out var tid) ? tid : Guid.Empty)
                .Where(id => id != Guid.Empty)
                .ToList();
            if (userTenantIds.Contains(parsedHeaderTenantId))
                return parsedHeaderTenantId;
        }

        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var parsedTenantId))
            return parsedTenantId;

        return null;
    }

    private new Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value ?? User.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            return userId;
        return null;
    }
}

public class FieldApprovalRequest
{
    public string? Notes { get; set; }
}

public class DebriefRequest
{
    public string? Notes { get; set; }
    public bool ForeignContactsReported { get; set; }
    public string? ForeignContacts { get; set; }
}
