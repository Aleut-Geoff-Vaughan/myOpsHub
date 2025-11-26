using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Interfaces;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Controller for Project Assignment operations (Step 1 of two-step assignment model)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProjectAssignmentsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<ProjectAssignmentsController> _logger;
    private readonly IAuthorizationService _authService;

    public ProjectAssignmentsController(
        MySchedulingDbContext context,
        ILogger<ProjectAssignmentsController> logger,
        IAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    // GET: api/projectassignments
    [HttpGet]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<ProjectAssignment>>> GetProjectAssignments(
        [FromQuery] Guid? tenantId = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] Guid? projectId = null,
        [FromQuery] ProjectAssignmentStatus? status = null)
    {
        try
        {
            // Optimize: Don't load WbsAssignments collection in list view - causes cartesian explosion
            // WbsAssignments can be loaded on-demand for detail view
            var query = _context.ProjectAssignments
                .Include(pa => pa.User)
                .Include(pa => pa.Project)
                .Include(pa => pa.ApprovedByUser)
                .AsNoTracking()
                .AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(pa => pa.TenantId == tenantId.Value);
            }

            if (userId.HasValue)
            {
                query = query.Where(pa => pa.UserId == userId.Value);
            }

            if (projectId.HasValue)
            {
                query = query.Where(pa => pa.ProjectId == projectId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(pa => pa.Status == status.Value);
            }

            var projectAssignments = await query
                .OrderByDescending(pa => pa.StartDate)
                .ToListAsync();

            return Ok(projectAssignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving project assignments");
            return StatusCode(500, "An error occurred while retrieving project assignments");
        }
    }

    // GET: api/projectassignments/{id}
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.Read)]
    public async Task<ActionResult<ProjectAssignment>> GetProjectAssignment(Guid id)
    {
        try
        {
            var projectAssignment = await _context.ProjectAssignments
                .Include(pa => pa.User)
                .Include(pa => pa.Project)
                .Include(pa => pa.ApprovedByUser)
                .Include(pa => pa.WbsAssignments)
                    .ThenInclude(a => a.WbsElement)
                .FirstOrDefaultAsync(pa => pa.Id == id);

            if (projectAssignment == null)
            {
                return NotFound($"Project assignment with ID {id} not found");
            }

            return Ok(projectAssignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving project assignment {ProjectAssignmentId}", id);
            return StatusCode(500, "An error occurred while retrieving the project assignment");
        }
    }

    // POST: api/projectassignments
    [HttpPost]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.Create)]
    public async Task<ActionResult<ProjectAssignment>> CreateProjectAssignment(CreateProjectAssignmentRequest request)
    {
        try
        {
            if (request.UserId == Guid.Empty)
            {
                return BadRequest("UserId is required");
            }

            if (request.ProjectId == Guid.Empty)
            {
                return BadRequest("ProjectId is required");
            }

            // Validate project exists and dates are within project timeline
            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null)
            {
                return BadRequest($"Project with ID {request.ProjectId} not found");
            }

            // Convert dates to UTC to avoid PostgreSQL timezone issues
            var startDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
            var endDate = request.EndDate.HasValue
                ? DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc)
                : (DateTime?)null;

            if (startDate < project.StartDate)
            {
                return BadRequest("Project assignment start date cannot be before project start date");
            }

            if (project.EndDate.HasValue && endDate.HasValue && endDate > project.EndDate)
            {
                return BadRequest("Project assignment end date cannot be after project end date");
            }

            // Check for overlapping project assignments for the same user to the same project
            var hasOverlap = await _context.ProjectAssignments
                .AnyAsync(pa =>
                    pa.UserId == request.UserId &&
                    pa.ProjectId == request.ProjectId &&
                    pa.Status == ProjectAssignmentStatus.Active &&
                    ((startDate >= pa.StartDate &&
                      (pa.EndDate == null || startDate <= pa.EndDate)) ||
                     (endDate != null && endDate >= pa.StartDate &&
                      (pa.EndDate == null || endDate <= pa.EndDate)) ||
                     (startDate <= pa.StartDate &&
                      (endDate == null || endDate >= pa.EndDate))));

            if (hasOverlap)
            {
                return BadRequest("Project assignment overlaps with existing active project assignment for this user to this project");
            }

            // Create the project assignment entity from the request
            var tenantIds = GetUserTenantIds();
            var tenantId = tenantIds.FirstOrDefault();

            var projectAssignment = new ProjectAssignment
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                ProjectId = request.ProjectId,
                TenantId = tenantId,
                StartDate = startDate,
                EndDate = endDate,
                Notes = request.Notes,
                Status = ProjectAssignmentStatus.PendingApproval,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = GetCurrentUserId()
            };

            _context.ProjectAssignments.Add(projectAssignment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProjectAssignment), new { id = projectAssignment.Id }, projectAssignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project assignment");
            return StatusCode(500, "An error occurred while creating the project assignment");
        }
    }

    // PUT: api/projectassignments/{id}
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.Update)]
    public async Task<IActionResult> UpdateProjectAssignment(Guid id, UpdateProjectAssignmentRequest request)
    {
        if (id != request.Id)
        {
            return BadRequest("ID mismatch");
        }

        try
        {
            // Get existing project assignment
            var projectAssignment = await _context.ProjectAssignments.FindAsync(id);
            if (projectAssignment == null)
            {
                return NotFound($"Project assignment with ID {id} not found");
            }

            // Validate project dates if changed
            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null)
            {
                return BadRequest($"Project with ID {request.ProjectId} not found");
            }

            // Convert dates to UTC to avoid PostgreSQL timezone issues
            var startDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
            var endDate = request.EndDate.HasValue
                ? DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc)
                : (DateTime?)null;

            if (startDate < project.StartDate)
            {
                return BadRequest("Project assignment start date cannot be before project start date");
            }

            if (project.EndDate.HasValue && endDate.HasValue && endDate > project.EndDate)
            {
                return BadRequest("Project assignment end date cannot be after project end date");
            }

            // Validate that WBS assignments still fall within the new date range
            var wbsAssignments = await _context.Assignments
                .Where(a => a.ProjectAssignmentId == id)
                .ToListAsync();

            foreach (var wbsAssignment in wbsAssignments)
            {
                if (wbsAssignment.StartDate < startDate)
                {
                    return BadRequest($"Cannot update: WBS assignment {wbsAssignment.Id} starts before the new project assignment start date");
                }

                if (endDate.HasValue && wbsAssignment.EndDate.HasValue && wbsAssignment.EndDate > endDate)
                {
                    return BadRequest($"Cannot update: WBS assignment {wbsAssignment.Id} ends after the new project assignment end date");
                }
            }

            // Update the project assignment properties
            projectAssignment.UserId = request.UserId;
            projectAssignment.ProjectId = request.ProjectId;
            projectAssignment.StartDate = startDate;
            projectAssignment.EndDate = endDate;
            projectAssignment.Notes = request.Notes;
            projectAssignment.UpdatedAt = DateTime.UtcNow;
            projectAssignment.UpdatedByUserId = GetCurrentUserId();

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ProjectAssignmentExists(id))
                {
                    return NotFound($"Project assignment with ID {id} not found");
                }
                throw;
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project assignment {ProjectAssignmentId}", id);
            return StatusCode(500, "An error occurred while updating the project assignment");
        }
    }

    // DELETE: api/projectassignments/{id} (Soft Delete)
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.Delete)]
    public async Task<IActionResult> DeleteProjectAssignment(Guid id, [FromQuery] string? reason = null)
    {
        try
        {
            var projectAssignment = await _context.ProjectAssignments.FindAsync(id);
            if (projectAssignment == null)
            {
                return NotFound($"Project assignment with ID {id} not found");
            }

            // Check if there are active WBS assignments
            var hasActiveWbsAssignments = await _context.Assignments
                .AnyAsync(a => a.ProjectAssignmentId == id && a.Status == AssignmentStatus.Active);

            if (hasActiveWbsAssignments)
            {
                return BadRequest("Cannot delete project assignment with active WBS assignments. Delete or deactivate WBS assignments first.");
            }

            // Soft delete
            projectAssignment.IsDeleted = true;
            projectAssignment.DeletedAt = DateTime.UtcNow;
            projectAssignment.DeletedByUserId = GetCurrentUserId();
            projectAssignment.DeletionReason = reason;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project assignment {ProjectAssignmentId}", id);
            return StatusCode(500, "An error occurred while deleting the project assignment");
        }
    }

    // DELETE: api/projectassignments/{id}/hard (Hard Delete - Platform Admin Only)
    [HttpDelete("{id}/hard")]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.HardDelete)]
    public async Task<IActionResult> HardDeleteProjectAssignment(Guid id)
    {
        try
        {
            var projectAssignment = await _context.ProjectAssignments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(pa => pa.Id == id);

            if (projectAssignment == null)
            {
                return NotFound($"Project assignment with ID {id} not found");
            }

            // Archive before hard delete
            var archive = new DataArchive
            {
                Id = Guid.NewGuid(),
                EntityType = "ProjectAssignment",
                EntityId = projectAssignment.Id,
                EntitySnapshot = System.Text.Json.JsonSerializer.Serialize(projectAssignment),
                ArchivedAt = DateTime.UtcNow,
                ArchivedByUserId = GetCurrentUserId(),
                ArchivalReason = "Hard delete operation",
                Status = DataArchiveStatus.PermanentlyDeleted,
                TenantId = projectAssignment.TenantId
            };

            _context.DataArchives.Add(archive);
            _context.ProjectAssignments.Remove(projectAssignment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error hard deleting project assignment {ProjectAssignmentId}", id);
            return StatusCode(500, "An error occurred while hard deleting the project assignment");
        }
    }

    // POST: api/projectassignments/{id}/restore (Restore Soft-Deleted)
    [HttpPost("{id}/restore")]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.Restore)]
    public async Task<IActionResult> RestoreProjectAssignment(Guid id)
    {
        try
        {
            var projectAssignment = await _context.ProjectAssignments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(pa => pa.Id == id && pa.IsDeleted);

            if (projectAssignment == null)
            {
                return NotFound($"Deleted project assignment with ID {id} not found");
            }

            projectAssignment.IsDeleted = false;
            projectAssignment.DeletedAt = null;
            projectAssignment.DeletedByUserId = null;
            projectAssignment.DeletionReason = null;

            await _context.SaveChangesAsync();

            return Ok(projectAssignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring project assignment {ProjectAssignmentId}", id);
            return StatusCode(500, "An error occurred while restoring the project assignment");
        }
    }

    // POST: api/projectassignments/{id}/approve
    [HttpPost("{id}/approve")]
    [RequiresPermission(Resource = "ProjectAssignment", Action = PermissionAction.Approve)]
    public async Task<IActionResult> ApproveProjectAssignment(Guid id)
    {
        try
        {
            var projectAssignment = await _context.ProjectAssignments.FindAsync(id);
            if (projectAssignment == null)
            {
                return NotFound($"Project assignment with ID {id} not found");
            }

            if (projectAssignment.Status != ProjectAssignmentStatus.PendingApproval)
            {
                return BadRequest("Only project assignments with PendingApproval status can be approved");
            }

            projectAssignment.Status = ProjectAssignmentStatus.Active;
            projectAssignment.ApprovedByUserId = GetCurrentUserId();
            projectAssignment.ApprovedAt = DateTime.UtcNow;
            projectAssignment.UpdatedAt = DateTime.UtcNow;
            projectAssignment.UpdatedByUserId = GetCurrentUserId();

            await _context.SaveChangesAsync();

            return Ok(projectAssignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving project assignment {ProjectAssignmentId}", id);
            return StatusCode(500, "An error occurred while approving the project assignment");
        }
    }

    private async Task<bool> ProjectAssignmentExists(Guid id)
    {
        return await _context.ProjectAssignments.AnyAsync(pa => pa.Id == id);
    }
}

// Request DTOs for project assignments
public class CreateProjectAssignmentRequest
{
    public Guid UserId { get; set; }
    public Guid ProjectId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateProjectAssignmentRequest : CreateProjectAssignmentRequest
{
    public Guid Id { get; set; }
}
