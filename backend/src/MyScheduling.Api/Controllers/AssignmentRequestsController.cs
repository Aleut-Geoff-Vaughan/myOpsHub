using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssignmentRequestsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<AssignmentRequestsController> _logger;
    private readonly IWorkflowNotificationService _notificationService;

    public AssignmentRequestsController(
        MySchedulingDbContext context,
        ILogger<AssignmentRequestsController> logger,
        IWorkflowNotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    [HttpGet]
    [RequiresPermission(Resource = "AssignmentRequest", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<AssignmentRequest>>> GetAll(
        [FromQuery] Guid? tenantId = null,
        [FromQuery] AssignmentRequestStatus? status = null,
        [FromQuery] Guid? forUserId = null,
        [FromQuery] Guid? approverGroupId = null)
    {
        var query = _context.AssignmentRequests
            .Include(r => r.RequestedByUser)
            .Include(r => r.RequestedForUser)
            .Include(r => r.WbsElement)
                .ThenInclude(w => w!.Project)
            .Include(r => r.ApproverGroup)
            .AsNoTracking()
            .AsQueryable();

        if (tenantId.HasValue)
        {
            query = query.Where(r => r.TenantId == tenantId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        if (forUserId.HasValue)
        {
            query = query.Where(r => r.RequestedForUserId == forUserId.Value || r.RequestedByUserId == forUserId.Value);
        }

        if (approverGroupId.HasValue)
        {
            query = query.Where(r => r.ApproverGroupId == approverGroupId.Value);
        }

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(requests);
    }

    [HttpGet("{id}")]
    [RequiresPermission(Resource = "AssignmentRequest", Action = PermissionAction.Read)]
    public async Task<ActionResult<AssignmentRequest>> Get(Guid id)
    {
        var request = await _context.AssignmentRequests
            .Include(r => r.RequestedByUser)
            .Include(r => r.RequestedForUser)
            .Include(r => r.WbsElement)
                .ThenInclude(w => w!.Project)
            .Include(r => r.Assignment)
            .Include(r => r.ApproverGroup)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
        {
            return NotFound();
        }

        return Ok(request);
    }

    [HttpPost]
    [RequiresPermission(Resource = "AssignmentRequest", Action = PermissionAction.Create)]
    public async Task<ActionResult<AssignmentRequest>> Create([FromBody] CreateAssignmentRequestDto request)
    {
        if (request.ProjectId == Guid.Empty)
        {
            return BadRequest("ProjectId is required.");
        }

        var currentUserId = GetCurrentUserId();
        var requestedForUserId = request.RequestedForUserId ?? currentUserId;

        var tenantId = request.TenantId ??
                       await _context.TenantMemberships
                           .Where(tm => tm.UserId == requestedForUserId && tm.IsActive)
                           .Select(tm => tm.TenantId)
                           .FirstOrDefaultAsync();

        if (tenantId == Guid.Empty)
        {
            return BadRequest("TenantId is required and user must be a member of the tenant.");
        }

        if (!HasAccessToTenant(tenantId))
        {
            return Forbid();
        }

        if (request.StartDate.HasValue && request.EndDate.HasValue && request.StartDate > request.EndDate)
        {
            return BadRequest("StartDate cannot be after EndDate.");
        }

        if (request.WbsElementId.HasValue)
        {
            var wbsValid = await _context.WbsElements.AnyAsync(w =>
                w.Id == request.WbsElementId.Value &&
                w.ProjectId == request.ProjectId &&
                w.TenantId == tenantId);

            if (!wbsValid)
            {
                return BadRequest("WBS element must belong to the project and tenant.");
            }
        }

        Guid? approverGroupId = request.ApproverGroupId;

        if (request.ApproverGroupId.HasValue)
        {
            var groupValid = await _context.Groups.AnyAsync(g =>
                g.Id == request.ApproverGroupId &&
                g.TenantId == tenantId &&
                !g.IsDeleted);

            if (!groupValid)
            {
                return BadRequest("Approver group is invalid for this tenant.");
            }
        }
        else
        {
            // Default to System Admins group if no approver group is specified
            var systemAdminGroup = await _context.Groups
                .Where(g => g.Name == "System Administrators" && g.TenantId == tenantId && !g.IsDeleted)
                .FirstOrDefaultAsync();

            if (systemAdminGroup != null)
            {
                approverGroupId = systemAdminGroup.Id;
                _logger.LogInformation("Assignment request defaulting to System Administrators group {GroupId}", systemAdminGroup.Id);
            }
            else
            {
                _logger.LogWarning("No System Administrators group found for tenant {TenantId}. Assignment request will have no approver group.", tenantId);
            }
        }

        var allocation = request.AllocationPct <= 0 ? 100 : Math.Min(request.AllocationPct, 200);

        var entity = new AssignmentRequest
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            RequestedByUserId = currentUserId,
            RequestedForUserId = requestedForUserId,
            ProjectId = request.ProjectId,
            WbsElementId = request.WbsElementId,
            ProjectRoleId = request.ProjectRoleId,
            StartDate = request.StartDate?.ToUniversalTime(),
            EndDate = request.EndDate?.ToUniversalTime(),
            AllocationPct = allocation,
            Notes = request.Notes,
            Status = AssignmentRequestStatus.Pending,
            ApproverGroupId = approverGroupId,
            CreatedAt = DateTime.UtcNow
        };

        _context.AssignmentRequests.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Assignment request {RequestId} created by {UserId} for user {TargetUser}", entity.Id, currentUserId, requestedForUserId);

        // Send notifications to approvers (fire and forget)
        _ = Task.Run(async () =>
        {
            try
            {
                var requester = await _context.Users.FindAsync(currentUserId);
                var requestedFor = currentUserId == requestedForUserId
                    ? requester
                    : await _context.Users.FindAsync(requestedForUserId);

                if (requester != null && requestedFor != null && approverGroupId.HasValue)
                {
                    // Load the full entity with navigation properties for the notification
                    var fullEntity = await _context.AssignmentRequests
                        .Include(r => r.WbsElement)
                            .ThenInclude(w => w!.Project)
                        .FirstOrDefaultAsync(r => r.Id == entity.Id);

                    if (fullEntity != null)
                    {
                        var approvers = await _context.GroupMembers
                            .Where(gm => gm.GroupId == approverGroupId.Value && !gm.IsDeleted)
                            .Select(gm => gm.User)
                            .Where(u => u != null && u.IsActive)
                            .ToListAsync();

                        await _notificationService.SendAssignmentRequestCreatedAsync(
                            fullEntity, requester, requestedFor, approvers!);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send assignment request created notification for {RequestId}", entity.Id);
            }
        });

        return CreatedAtAction(nameof(Get), new { id = entity.Id }, entity);
    }

    [HttpPost("{id}/approve")]
    [RequiresPermission(Resource = "AssignmentRequest", Action = PermissionAction.Update)]
    public async Task<ActionResult<AssignmentRequest>> Approve(Guid id, [FromBody] ApproveAssignmentRequestDto dto)
    {
        var request = await _context.AssignmentRequests
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
        {
            return NotFound();
        }

        if (request.Status != AssignmentRequestStatus.Pending)
        {
            return BadRequest("Request is already resolved.");
        }

        request.Status = AssignmentRequestStatus.Approved;
        request.ApprovedByUserId = GetCurrentUserId();
        request.ResolvedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;
        var audit = new AssignmentHistory
        {
            Id = Guid.NewGuid(),
            AssignmentId = request.AssignmentId ?? Guid.Empty,
            AllocationPct = request.AllocationPct,
            StartDate = request.StartDate ?? DateTime.UtcNow,
            EndDate = request.EndDate,
            Status = AssignmentStatus.Active,
            ApprovedByUserId = request.ApprovedByUserId,
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = GetCurrentUserId(),
            ChangeReason = "Assignment request approved",
            Notes = request.Notes
        };

        if (request.AssignmentId == null && dto.CreateAssignment)
        {
            if (request.WbsElementId.HasValue)
            {
                var assignment = new Assignment
                {
                    Id = Guid.NewGuid(),
                    TenantId = request.TenantId,
                    UserId = request.RequestedForUserId,
                    WbsElementId = request.WbsElementId.Value,
                    ProjectRoleId = request.ProjectRoleId,
                    AllocationPct = dto.AllocationPct ?? request.AllocationPct,
                    StartDate = request.StartDate ?? DateTime.UtcNow.Date,
                    EndDate = request.EndDate,
                    Status = AssignmentStatus.Active,
                    ApprovedByUserId = request.ApprovedByUserId,
                    ApprovedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Assignments.Add(assignment);
                request.AssignmentId = assignment.Id;
                audit.AssignmentId = assignment.Id;
                _context.AssignmentHistory.Add(audit);
            }
            else
            {
                _logger.LogWarning("Assignment request {RequestId} approved without WBS element. Assignment not created.", id);
            }
        }
        else if (request.AssignmentId.HasValue)
        {
            _context.AssignmentHistory.Add(audit);
        }

        await _context.SaveChangesAsync();

        // Send approval notifications (fire and forget)
        var approverUserId = GetCurrentUserId();
        _ = Task.Run(async () =>
        {
            try
            {
                var fullRequest = await _context.AssignmentRequests
                    .Include(r => r.WbsElement)
                        .ThenInclude(w => w!.Project)
                    .FirstOrDefaultAsync(r => r.Id == id);

                var approver = await _context.Users.FindAsync(approverUserId);
                var requester = await _context.Users.FindAsync(fullRequest?.RequestedByUserId);
                var requestedFor = fullRequest?.RequestedByUserId == fullRequest?.RequestedForUserId
                    ? requester
                    : await _context.Users.FindAsync(fullRequest?.RequestedForUserId);

                if (fullRequest != null && approver != null && requester != null && requestedFor != null)
                {
                    await _notificationService.SendAssignmentRequestApprovedAsync(
                        fullRequest, approver, requester, requestedFor);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send assignment request approval notification for {RequestId}", id);
            }
        });

        return Ok(request);
    }

    [HttpPost("{id}/reject")]
    [RequiresPermission(Resource = "AssignmentRequest", Action = PermissionAction.Update)]
    public async Task<ActionResult<AssignmentRequest>> Reject(Guid id, [FromBody] RejectRequestDto dto)
    {
        var request = await _context.AssignmentRequests
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
        {
            return NotFound();
        }

        if (request.Status != AssignmentRequestStatus.Pending)
        {
            return BadRequest("Request is already resolved.");
        }

        request.Status = AssignmentRequestStatus.Rejected;
        request.ResolvedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.Reason))
        {
            request.Notes = string.IsNullOrWhiteSpace(request.Notes)
                ? dto.Reason
                : $"{request.Notes}\nRejected: {dto.Reason}";
        }

        var audit = new AssignmentHistory
        {
            Id = Guid.NewGuid(),
            AssignmentId = request.AssignmentId ?? Guid.Empty,
            AllocationPct = request.AllocationPct,
            StartDate = request.StartDate ?? DateTime.UtcNow,
            EndDate = request.EndDate,
            Status = AssignmentStatus.Rejected,
            ApprovedByUserId = GetCurrentUserId(),
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = GetCurrentUserId(),
            ChangeReason = "Assignment request rejected",
            Notes = dto.Reason
        };

        _context.AssignmentHistory.Add(audit);

        await _context.SaveChangesAsync();

        // Send rejection notifications (fire and forget)
        var rejecterUserId = GetCurrentUserId();
        var rejectionReason = dto.Reason;
        _ = Task.Run(async () =>
        {
            try
            {
                var fullRequest = await _context.AssignmentRequests
                    .Include(r => r.WbsElement)
                        .ThenInclude(w => w!.Project)
                    .FirstOrDefaultAsync(r => r.Id == id);

                var rejecter = await _context.Users.FindAsync(rejecterUserId);
                var requester = await _context.Users.FindAsync(fullRequest?.RequestedByUserId);
                var requestedFor = fullRequest?.RequestedByUserId == fullRequest?.RequestedForUserId
                    ? requester
                    : await _context.Users.FindAsync(fullRequest?.RequestedForUserId);

                if (fullRequest != null && rejecter != null && requester != null && requestedFor != null)
                {
                    await _notificationService.SendAssignmentRequestRejectedAsync(
                        fullRequest, rejecter, requester, requestedFor, rejectionReason);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send assignment request rejection notification for {RequestId}", id);
            }
        });

        return Ok(request);
    }
}

public class CreateAssignmentRequestDto
{
    public Guid ProjectId { get; set; }
    public Guid? WbsElementId { get; set; }
    public Guid? ProjectRoleId { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? RequestedForUserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int AllocationPct { get; set; }
    public string? Notes { get; set; }
    public Guid? ApproverGroupId { get; set; }
}

public class ApproveAssignmentRequestDto
{
    public bool CreateAssignment { get; set; } = true;
    public int? AllocationPct { get; set; }
}

public class RejectRequestDto
{
    public string? Reason { get; set; }
}
