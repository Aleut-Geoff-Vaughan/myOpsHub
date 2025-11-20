using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using System.Text.Json;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WbsController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<WbsController> _logger;

    public WbsController(MySchedulingDbContext context, ILogger<WbsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/wbs
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WbsElement>>> GetWbsElements(
        [FromQuery] Guid? projectId = null,
        [FromQuery] Guid? ownerId = null,
        [FromQuery] WbsType? type = null,
        [FromQuery] WbsApprovalStatus? approvalStatus = null,
        [FromQuery] bool includeHistory = false)
    {
        try
        {
            var query = _context.WbsElements
                .Include(w => w.Project)
                .Include(w => w.Owner)
                .Include(w => w.Approver)
                .AsQueryable();

            if (projectId.HasValue)
            {
                query = query.Where(w => w.ProjectId == projectId.Value);
            }

            if (ownerId.HasValue)
            {
                query = query.Where(w => w.OwnerUserId == ownerId.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(w => w.Type == type.Value);
            }

            if (approvalStatus.HasValue)
            {
                query = query.Where(w => w.ApprovalStatus == approvalStatus.Value);
            }

            if (includeHistory)
            {
                query = query.Include(w => w.ChangeHistory)
                    .ThenInclude(h => h.ChangedBy);
            }

            var wbsElements = await query
                .OrderBy(w => w.Code)
                .ToListAsync();

            return Ok(wbsElements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving WBS elements");
            return StatusCode(500, "An error occurred while retrieving WBS elements");
        }
    }

    // GET: api/wbs/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<WbsElement>> GetWbsElement(Guid id)
    {
        try
        {
            var wbsElement = await _context.WbsElements
                .Include(w => w.Project)
                .Include(w => w.Owner)
                .Include(w => w.Approver)
                .Include(w => w.ChangeHistory)
                    .ThenInclude(h => h.ChangedBy)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (wbsElement == null)
            {
                return NotFound($"WBS element with ID {id} not found");
            }

            return Ok(wbsElement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving WBS element {WbsId}", id);
            return StatusCode(500, "An error occurred while retrieving the WBS element");
        }
    }

    // GET: api/wbs/pending-approval
    [HttpGet("pending-approval")]
    public async Task<ActionResult<IEnumerable<WbsElement>>> GetPendingApprovals(
        [FromQuery] Guid? approverId = null)
    {
        try
        {
            var query = _context.WbsElements
                .Include(w => w.Project)
                .Include(w => w.Owner)
                .Include(w => w.Approver)
                .Where(w => w.ApprovalStatus == WbsApprovalStatus.PendingApproval);

            if (approverId.HasValue)
            {
                query = query.Where(w => w.ApproverUserId == approverId.Value);
            }

            var pendingWbs = await query
                .OrderBy(w => w.CreatedAt)
                .ToListAsync();

            return Ok(pendingWbs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending approvals");
            return StatusCode(500, "An error occurred while retrieving pending approvals");
        }
    }

    // GET: api/wbs/{id}/history
    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<WbsChangeHistory>>> GetWbsHistory(Guid id)
    {
        try
        {
            var history = await _context.Set<WbsChangeHistory>()
                .Include(h => h.ChangedBy)
                .Where(h => h.WbsElementId == id)
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync();

            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving WBS history for {WbsId}", id);
            return StatusCode(500, "An error occurred while retrieving WBS history");
        }
    }

    // POST: api/wbs
    [HttpPost]
    public async Task<ActionResult<WbsElement>> CreateWbsElement([FromBody] CreateWbsRequest request)
    {
        try
        {
            // Validate project exists
            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null)
            {
                return NotFound($"Project with ID {request.ProjectId} not found");
            }

            // Check for duplicate code within project
            var existingWbs = await _context.WbsElements
                .AnyAsync(w => w.ProjectId == request.ProjectId && w.Code == request.Code);

            if (existingWbs)
            {
                return Conflict($"WBS code {request.Code} already exists in this project");
            }

            var wbsElement = new WbsElement
            {
                Id = Guid.NewGuid(),
                TenantId = project.TenantId,
                ProjectId = request.ProjectId,
                Code = request.Code,
                Description = request.Description,
                ValidFrom = request.ValidFrom,
                ValidTo = request.ValidTo,
                StartDate = request.ValidFrom, // Legacy field
                EndDate = request.ValidTo,     // Legacy field
                Type = request.Type,
                Status = WbsStatus.Draft,
                IsBillable = request.Type == WbsType.Billable, // Legacy field
                ApprovalStatus = WbsApprovalStatus.Draft,
                OwnerUserId = request.OwnerUserId,
                ApproverUserId = request.ApproverUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.WbsElements.Add(wbsElement);

            // Create change history
            var history = new WbsChangeHistory
            {
                Id = Guid.NewGuid(),
                WbsElementId = wbsElement.Id,
                ChangedByUserId = request.CreatedByUserId ?? Guid.Empty,
                ChangedAt = DateTime.UtcNow,
                ChangeType = "Created",
                NewValues = JsonSerializer.Serialize(wbsElement),
                Notes = "WBS element created",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<WbsChangeHistory>().Add(history);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetWbsElement), new { id = wbsElement.Id }, wbsElement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating WBS element");
            return StatusCode(500, "An error occurred while creating the WBS element");
        }
    }

    // PUT: api/wbs/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWbsElement(Guid id, [FromBody] UpdateWbsRequest request)
    {
        try
        {
            var wbsElement = await _context.WbsElements.FindAsync(id);
            if (wbsElement == null)
            {
                return NotFound($"WBS element with ID {id} not found");
            }

            // Can only update Draft or Rejected WBS
            if (wbsElement.ApprovalStatus != WbsApprovalStatus.Draft &&
                wbsElement.ApprovalStatus != WbsApprovalStatus.Rejected)
            {
                return BadRequest($"Cannot update WBS in {wbsElement.ApprovalStatus} status");
            }

            // Snapshot old values
            var oldValues = JsonSerializer.Serialize(wbsElement);

            // Update fields
            wbsElement.Description = request.Description ?? wbsElement.Description;
            wbsElement.ValidFrom = request.ValidFrom ?? wbsElement.ValidFrom;
            wbsElement.ValidTo = request.ValidTo;
            wbsElement.StartDate = request.ValidFrom ?? wbsElement.StartDate; // Legacy
            wbsElement.EndDate = request.ValidTo; // Legacy
            wbsElement.Type = request.Type ?? wbsElement.Type;
            wbsElement.IsBillable = (request.Type ?? wbsElement.Type) == WbsType.Billable; // Legacy
            wbsElement.OwnerUserId = request.OwnerUserId ?? wbsElement.OwnerUserId;
            wbsElement.ApproverUserId = request.ApproverUserId ?? wbsElement.ApproverUserId;
            wbsElement.UpdatedAt = DateTime.UtcNow;

            // Create change history
            var history = new WbsChangeHistory
            {
                Id = Guid.NewGuid(),
                WbsElementId = wbsElement.Id,
                ChangedByUserId = request.UpdatedByUserId ?? Guid.Empty,
                ChangedAt = DateTime.UtcNow,
                ChangeType = "Updated",
                OldValues = oldValues,
                NewValues = JsonSerializer.Serialize(wbsElement),
                Notes = request.Notes ?? "WBS element updated",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<WbsChangeHistory>().Add(history);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating WBS element {WbsId}", id);
            return StatusCode(500, "An error occurred while updating the WBS element");
        }
    }

    // POST: api/wbs/{id}/submit
    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitForApproval(Guid id, [FromBody] WorkflowRequest request)
    {
        try
        {
            var wbsElement = await _context.WbsElements.FindAsync(id);
            if (wbsElement == null)
            {
                return NotFound($"WBS element with ID {id} not found");
            }

            if (wbsElement.ApprovalStatus != WbsApprovalStatus.Draft &&
                wbsElement.ApprovalStatus != WbsApprovalStatus.Rejected)
            {
                return BadRequest($"Cannot submit WBS in {wbsElement.ApprovalStatus} status");
            }

            if (wbsElement.ApproverUserId == null)
            {
                return BadRequest("Approver must be assigned before submitting");
            }

            wbsElement.ApprovalStatus = WbsApprovalStatus.PendingApproval;
            wbsElement.UpdatedAt = DateTime.UtcNow;

            // Create change history
            var history = new WbsChangeHistory
            {
                Id = Guid.NewGuid(),
                WbsElementId = wbsElement.Id,
                ChangedByUserId = request.UserId,
                ChangedAt = DateTime.UtcNow,
                ChangeType = "StatusChanged",
                OldValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.Draft }),
                NewValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.PendingApproval }),
                Notes = request.Notes ?? "Submitted for approval",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<WbsChangeHistory>().Add(history);
            await _context.SaveChangesAsync();

            _logger.LogInformation("WBS {WbsId} submitted for approval by user {UserId}", id, request.UserId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting WBS {WbsId} for approval", id);
            return StatusCode(500, "An error occurred while submitting the WBS for approval");
        }
    }

    // POST: api/wbs/{id}/approve
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveWbs(Guid id, [FromBody] WorkflowRequest request)
    {
        try
        {
            var wbsElement = await _context.WbsElements.FindAsync(id);
            if (wbsElement == null)
            {
                return NotFound($"WBS element with ID {id} not found");
            }

            if (wbsElement.ApprovalStatus != WbsApprovalStatus.PendingApproval)
            {
                return BadRequest($"Cannot approve WBS in {wbsElement.ApprovalStatus} status");
            }

            // Verify approver
            if (wbsElement.ApproverUserId != request.UserId)
            {
                return BadRequest("Only the assigned approver can approve this WBS");
            }

            wbsElement.ApprovalStatus = WbsApprovalStatus.Approved;
            wbsElement.Status = WbsStatus.Active;
            wbsElement.ApprovedAt = DateTime.UtcNow;
            wbsElement.ApprovalNotes = request.Notes;
            wbsElement.UpdatedAt = DateTime.UtcNow;

            // Create change history
            var history = new WbsChangeHistory
            {
                Id = Guid.NewGuid(),
                WbsElementId = wbsElement.Id,
                ChangedByUserId = request.UserId,
                ChangedAt = DateTime.UtcNow,
                ChangeType = "StatusChanged",
                OldValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.PendingApproval }),
                NewValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.Approved }),
                Notes = request.Notes ?? "Approved",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<WbsChangeHistory>().Add(history);
            await _context.SaveChangesAsync();

            _logger.LogInformation("WBS {WbsId} approved by user {UserId}", id, request.UserId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving WBS {WbsId}", id);
            return StatusCode(500, "An error occurred while approving the WBS");
        }
    }

    // POST: api/wbs/{id}/reject
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectWbs(Guid id, [FromBody] WorkflowRequest request)
    {
        try
        {
            var wbsElement = await _context.WbsElements.FindAsync(id);
            if (wbsElement == null)
            {
                return NotFound($"WBS element with ID {id} not found");
            }

            if (wbsElement.ApprovalStatus != WbsApprovalStatus.PendingApproval)
            {
                return BadRequest($"Cannot reject WBS in {wbsElement.ApprovalStatus} status");
            }

            // Verify approver
            if (wbsElement.ApproverUserId != request.UserId)
            {
                return BadRequest("Only the assigned approver can reject this WBS");
            }

            if (string.IsNullOrWhiteSpace(request.Notes))
            {
                return BadRequest("Rejection reason is required");
            }

            wbsElement.ApprovalStatus = WbsApprovalStatus.Rejected;
            wbsElement.ApprovalNotes = request.Notes;
            wbsElement.UpdatedAt = DateTime.UtcNow;

            // Create change history
            var history = new WbsChangeHistory
            {
                Id = Guid.NewGuid(),
                WbsElementId = wbsElement.Id,
                ChangedByUserId = request.UserId,
                ChangedAt = DateTime.UtcNow,
                ChangeType = "StatusChanged",
                OldValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.PendingApproval }),
                NewValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.Rejected }),
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<WbsChangeHistory>().Add(history);
            await _context.SaveChangesAsync();

            _logger.LogInformation("WBS {WbsId} rejected by user {UserId}", id, request.UserId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting WBS {WbsId}", id);
            return StatusCode(500, "An error occurred while rejecting the WBS");
        }
    }

    // POST: api/wbs/{id}/suspend
    [HttpPost("{id}/suspend")]
    public async Task<IActionResult> SuspendWbs(Guid id, [FromBody] WorkflowRequest request)
    {
        try
        {
            var wbsElement = await _context.WbsElements.FindAsync(id);
            if (wbsElement == null)
            {
                return NotFound($"WBS element with ID {id} not found");
            }

            if (wbsElement.ApprovalStatus != WbsApprovalStatus.Approved)
            {
                return BadRequest($"Can only suspend approved WBS elements");
            }

            var oldStatus = wbsElement.ApprovalStatus;
            wbsElement.ApprovalStatus = WbsApprovalStatus.Suspended;
            wbsElement.Status = WbsStatus.Draft; // Revert to draft
            wbsElement.UpdatedAt = DateTime.UtcNow;

            // Create change history
            var history = new WbsChangeHistory
            {
                Id = Guid.NewGuid(),
                WbsElementId = wbsElement.Id,
                ChangedByUserId = request.UserId,
                ChangedAt = DateTime.UtcNow,
                ChangeType = "StatusChanged",
                OldValues = JsonSerializer.Serialize(new { ApprovalStatus = oldStatus }),
                NewValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.Suspended }),
                Notes = request.Notes ?? "Suspended",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<WbsChangeHistory>().Add(history);
            await _context.SaveChangesAsync();

            _logger.LogInformation("WBS {WbsId} suspended by user {UserId}", id, request.UserId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error suspending WBS {WbsId}", id);
            return StatusCode(500, "An error occurred while suspending the WBS");
        }
    }

    // POST: api/wbs/{id}/close
    [HttpPost("{id}/close")]
    public async Task<IActionResult> CloseWbs(Guid id, [FromBody] WorkflowRequest request)
    {
        try
        {
            var wbsElement = await _context.WbsElements.FindAsync(id);
            if (wbsElement == null)
            {
                return NotFound($"WBS element with ID {id} not found");
            }

            var oldStatus = wbsElement.ApprovalStatus;
            wbsElement.ApprovalStatus = WbsApprovalStatus.Closed;
            wbsElement.Status = WbsStatus.Closed;
            wbsElement.UpdatedAt = DateTime.UtcNow;

            // Create change history
            var history = new WbsChangeHistory
            {
                Id = Guid.NewGuid(),
                WbsElementId = wbsElement.Id,
                ChangedByUserId = request.UserId,
                ChangedAt = DateTime.UtcNow,
                ChangeType = "StatusChanged",
                OldValues = JsonSerializer.Serialize(new { ApprovalStatus = oldStatus, Status = wbsElement.Status }),
                NewValues = JsonSerializer.Serialize(new { ApprovalStatus = WbsApprovalStatus.Closed, Status = WbsStatus.Closed }),
                Notes = request.Notes ?? "Closed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<WbsChangeHistory>().Add(history);
            await _context.SaveChangesAsync();

            _logger.LogInformation("WBS {WbsId} closed by user {UserId}", id, request.UserId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing WBS {WbsId}", id);
            return StatusCode(500, "An error occurred while closing the WBS");
        }
    }
}

// Request DTOs
public class CreateWbsRequest
{
    public Guid ProjectId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public WbsType Type { get; set; }
    public Guid? OwnerUserId { get; set; }
    public Guid? ApproverUserId { get; set; }
    public Guid? CreatedByUserId { get; set; }
}

public class UpdateWbsRequest
{
    public string? Description { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public WbsType? Type { get; set; }
    public Guid? OwnerUserId { get; set; }
    public Guid? ApproverUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public string? Notes { get; set; }
}

public class WorkflowRequest
{
    public Guid UserId { get; set; }
    public string? Notes { get; set; }
}
