using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssignmentsController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<AssignmentsController> _logger;

    public AssignmentsController(MySchedulingDbContext context, ILogger<AssignmentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Verify that a user has access to an assignment's tenant and has appropriate roles
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
            _logger.LogWarning("User {UserId} attempted to access assignment from tenant {TenantId} without membership",
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
                _logger.LogWarning("User {UserId} lacks required roles {RequiredRoles} for assignment action",
                    userId, string.Join(", ", requiredRoles));
                return (false, $"User does not have permission. Required role: {string.Join(" or ", requiredRoles)}", tenantMembership);
            }
        }

        return (true, null, tenantMembership);
    }

    // GET: api/assignments
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Assignment>>> GetAssignments(
        [FromQuery] Guid? tenantId = null,
        [FromQuery] Guid? personId = null,
        [FromQuery] Guid? projectId = null,
        [FromQuery] AssignmentStatus? status = null)
    {
        try
        {
            var query = _context.Assignments
                .AsNoTracking()
                .AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(a => a.TenantId == tenantId.Value);
            }

            if (personId.HasValue)
            {
                query = query.Where(a => a.PersonId == personId.Value);
            }

            if (projectId.HasValue)
            {
                query = query.Where(a => a.WbsElement.ProjectId == projectId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(a => a.Status == status.Value);
            }

            var assignments = await query
                .OrderByDescending(a => a.StartDate)
                .ToListAsync();

            return Ok(assignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving assignments");
            return StatusCode(500, "An error occurred while retrieving assignments");
        }
    }

    // GET: api/assignments/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Assignment>> GetAssignment(Guid id)
    {
        try
        {
            var assignment = await _context.Assignments
                .Include(a => a.Person)
                .Include(a => a.WbsElement)
                    .ThenInclude(w => w.Project)
                .Include(a => a.ProjectRole)
                .Include(a => a.ApprovedByUser)
                .Include(a => a.History)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (assignment == null)
            {
                return NotFound($"Assignment with ID {id} not found");
            }

            return Ok(assignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving assignment {AssignmentId}", id);
            return StatusCode(500, "An error occurred while retrieving the assignment");
        }
    }

    // POST: api/assignments
    [HttpPost]
    public async Task<ActionResult<Assignment>> CreateAssignment(
        [FromQuery] Guid userId,
        Assignment assignment)
    {
        try
        {
            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                assignment.TenantId,
                AppRole.TeamLead, AppRole.ProjectManager, AppRole.ResourceManager, AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            // Check for overlapping assignments
            var hasOverlap = await _context.Assignments
                .AnyAsync(a =>
                    a.PersonId == assignment.PersonId &&
                    a.Id != assignment.Id &&
                    a.Status == AssignmentStatus.Active &&
                    ((assignment.StartDate >= a.StartDate && assignment.StartDate <= a.EndDate) ||
                     (assignment.EndDate >= a.StartDate && assignment.EndDate <= a.EndDate) ||
                     (assignment.StartDate <= a.StartDate && assignment.EndDate >= a.EndDate)));

            if (hasOverlap)
            {
                return BadRequest("Assignment overlaps with existing active assignment for this person");
            }

            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAssignment), new { id = assignment.Id }, assignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating assignment");
            return StatusCode(500, "An error occurred while creating the assignment");
        }
    }

    // PUT: api/assignments/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAssignment(
        Guid id,
        [FromQuery] Guid userId,
        Assignment assignment)
    {
        if (id != assignment.Id)
        {
            return BadRequest("ID mismatch");
        }

        try
        {
            var existing = await _context.Assignments.FindAsync(id);
            if (existing == null)
            {
                return NotFound($"Assignment with ID {id} not found");
            }

            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                existing.TenantId,
                AppRole.TeamLead, AppRole.ProjectManager, AppRole.ResourceManager, AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            _context.Entry(assignment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await AssignmentExists(id))
                {
                    return NotFound($"Assignment with ID {id} not found");
                }
                throw;
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating assignment {AssignmentId}", id);
            return StatusCode(500, "An error occurred while updating the assignment");
        }
    }

    // DELETE: api/assignments/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAssignment(
        Guid id,
        [FromQuery] Guid userId)
    {
        try
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null)
            {
                return NotFound($"Assignment with ID {id} not found");
            }

            // Verify user access
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                userId,
                assignment.TenantId,
                AppRole.TeamLead, AppRole.ProjectManager, AppRole.ResourceManager, AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting assignment {AssignmentId}", id);
            return StatusCode(500, "An error occurred while deleting the assignment");
        }
    }

    // POST: api/assignments/{id}/approve
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveAssignment(Guid id, [FromBody] Guid approvedByUserId)
    {
        try
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null)
            {
                return NotFound($"Assignment with ID {id} not found");
            }

            // Verify user access - only managers can approve
            var (isAuthorized, errorMessage, _) = await VerifyUserAccess(
                approvedByUserId,
                assignment.TenantId,
                AppRole.ProjectManager, AppRole.ResourceManager, AppRole.TenantAdmin);

            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            assignment.Status = AssignmentStatus.Active;
            assignment.ApprovedByUserId = approvedByUserId;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving assignment {AssignmentId}", id);
            return StatusCode(500, "An error occurred while approving the assignment");
        }
    }

    private async Task<bool> AssignmentExists(Guid id)
    {
        return await _context.Assignments.AnyAsync(e => e.Id == id);
    }
}
