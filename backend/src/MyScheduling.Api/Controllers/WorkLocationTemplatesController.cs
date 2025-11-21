using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkLocationTemplatesController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<WorkLocationTemplatesController> _logger;

    public WorkLocationTemplatesController(MySchedulingDbContext context, ILogger<WorkLocationTemplatesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private async Task<(bool isAuthorized, string? errorMessage, Guid? tenantId)> VerifyUserAccess(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.TenantMemberships)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return (false, "User not found", null);
        }

        var activeMembership = user.TenantMemberships.FirstOrDefault(tm => tm.IsActive);
        if (activeMembership == null)
        {
            return (false, "User does not have an active tenant membership", null);
        }

        return (true, null, activeMembership.TenantId);
    }

    // GET: api/worklocationtemplates
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkLocationTemplate>>> GetTemplates()
    {
        try
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdValue) ||
                !Guid.TryParse(userIdValue, out var userId))
            {
                return BadRequest("User ID header is required");
            }

            var (isAuthorized, errorMessage, tenantId) = await VerifyUserAccess(userId);
            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            var templates = await _context.WorkLocationTemplates
                .Include(t => t.Items)
                .Where(t => t.TenantId == tenantId && (t.UserId == userId || t.IsShared))
                .OrderByDescending(t => t.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving work location templates");
            return StatusCode(500, "An error occurred while retrieving templates");
        }
    }

    // GET: api/worklocationtemplates/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<WorkLocationTemplate>> GetTemplate(Guid id)
    {
        try
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdValue) ||
                !Guid.TryParse(userIdValue, out var userId))
            {
                return BadRequest("User ID header is required");
            }

            var (isAuthorized, errorMessage, tenantId) = await VerifyUserAccess(userId);
            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            var template = await _context.WorkLocationTemplates
                .Include(t => t.Items.OrderBy(i => i.DayOffset))
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

            if (template == null)
            {
                return NotFound($"Template with ID {id} not found");
            }

            // Check access - user must own it or it must be shared
            if (template.UserId != userId && !template.IsShared)
            {
                return StatusCode(403, "You do not have permission to view this template");
            }

            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving template {TemplateId}", id);
            return StatusCode(500, "An error occurred while retrieving the template");
        }
    }

    // POST: api/worklocationtemplates
    [HttpPost]
    public async Task<ActionResult<WorkLocationTemplate>> CreateTemplate(WorkLocationTemplate template)
    {
        try
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdValue) ||
                !Guid.TryParse(userIdValue, out var userId))
            {
                return BadRequest("User ID header is required");
            }

            var (isAuthorized, errorMessage, tenantId) = await VerifyUserAccess(userId);
            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            // Validate template type and items
            if (template.Type == TemplateType.Week && template.Items.Count != 5)
            {
                return BadRequest("Week templates must have exactly 5 items (Monday-Friday)");
            }

            // Set IDs and metadata
            template.Id = Guid.NewGuid();
            template.UserId = userId;
            template.TenantId = tenantId!.Value;
            template.CreatedAt = DateTime.UtcNow;

            foreach (var item in template.Items)
            {
                item.Id = Guid.NewGuid();
                item.TemplateId = template.Id;
                item.CreatedAt = DateTime.UtcNow;
            }

            _context.WorkLocationTemplates.Add(template);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetTemplate),
                new { id = template.Id },
                template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template");
            return StatusCode(500, "An error occurred while creating the template");
        }
    }

    // PUT: api/worklocationtemplates/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTemplate(Guid id, WorkLocationTemplate template)
    {
        if (id != template.Id)
        {
            return BadRequest("ID mismatch");
        }

        try
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdValue) ||
                !Guid.TryParse(userIdValue, out var userId))
            {
                return BadRequest("User ID header is required");
            }

            var (isAuthorized, errorMessage, tenantId) = await VerifyUserAccess(userId);
            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            var existing = await _context.WorkLocationTemplates
                .Include(t => t.Items)
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

            if (existing == null)
            {
                return NotFound($"Template with ID {id} not found");
            }

            // Only the owner can modify
            if (existing.UserId != userId)
            {
                return StatusCode(403, "Only the template owner can modify it");
            }

            // Update template properties
            existing.Name = template.Name;
            existing.Description = template.Description;
            existing.Type = template.Type;
            existing.IsShared = template.IsShared;
            existing.UpdatedAt = DateTime.UtcNow;

            // Remove old items
            _context.WorkLocationTemplateItems.RemoveRange(existing.Items);

            // Add new items
            foreach (var item in template.Items)
            {
                item.Id = Guid.NewGuid();
                item.TemplateId = template.Id;
                item.CreatedAt = DateTime.UtcNow;
                existing.Items.Add(item);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateId}", id);
            return StatusCode(500, "An error occurred while updating the template");
        }
    }

    // DELETE: api/worklocationtemplates/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        try
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdValue) ||
                !Guid.TryParse(userIdValue, out var userId))
            {
                return BadRequest("User ID header is required");
            }

            var (isAuthorized, errorMessage, tenantId) = await VerifyUserAccess(userId);
            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            var template = await _context.WorkLocationTemplates
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

            if (template == null)
            {
                return NotFound($"Template with ID {id} not found");
            }

            // Only the owner can delete
            if (template.UserId != userId)
            {
                return StatusCode(403, "Only the template owner can delete it");
            }

            _context.WorkLocationTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template {TemplateId}", id);
            return StatusCode(500, "An error occurred while deleting the template");
        }
    }

    // POST: api/worklocationtemplates/{id}/apply
    [HttpPost("{id}/apply")]
    public async Task<ActionResult<IEnumerable<WorkLocationPreference>>> ApplyTemplate(
        Guid id,
        [FromBody] ApplyTemplateRequest request)
    {
        try
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdValue) ||
                !Guid.TryParse(userIdValue, out var userId))
            {
                return BadRequest("User ID header is required");
            }

            var (isAuthorized, errorMessage, tenantId) = await VerifyUserAccess(userId);
            if (!isAuthorized)
            {
                return StatusCode(403, errorMessage);
            }

            var template = await _context.WorkLocationTemplates
                .Include(t => t.Items.OrderBy(i => i.DayOffset))
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

            if (template == null)
            {
                return NotFound($"Template with ID {id} not found");
            }

            // Check access
            if (template.UserId != userId && !template.IsShared)
            {
                return StatusCode(403, "You do not have permission to use this template");
            }

            // Get the person associated with this user
            var person = await _context.People
                .FirstOrDefaultAsync(p => p.UserId == userId && p.TenantId == tenantId);

            if (person == null)
            {
                return NotFound("Person record not found for user");
            }

            var createdPreferences = new List<WorkLocationPreference>();
            var startDate = DateOnly.FromDateTime(request.StartDate);

            for (int week = 0; week < request.WeekCount; week++)
            {
                foreach (var item in template.Items)
                {
                    var workDate = startDate.AddDays(week * 7 + item.DayOffset);

                    // Check if preference already exists
                    var existing = await _context.WorkLocationPreferences
                        .FirstOrDefaultAsync(w =>
                            w.PersonId == person.Id &&
                            w.WorkDate == workDate &&
                            w.TenantId == tenantId);

                    if (existing != null)
                    {
                        // Update existing
                        existing.LocationType = item.LocationType;
                        existing.OfficeId = item.OfficeId;
                        existing.RemoteLocation = item.RemoteLocation;
                        existing.City = item.City;
                        existing.State = item.State;
                        existing.Country = item.Country;
                        existing.Notes = item.Notes;
                        existing.UpdatedAt = DateTime.UtcNow;
                        createdPreferences.Add(existing);
                    }
                    else
                    {
                        // Create new
                        var preference = new WorkLocationPreference
                        {
                            Id = Guid.NewGuid(),
                            PersonId = person.Id,
                            TenantId = tenantId.Value,
                            WorkDate = workDate,
                            LocationType = item.LocationType,
                            OfficeId = item.OfficeId,
                            RemoteLocation = item.RemoteLocation,
                            City = item.City,
                            State = item.State,
                            Country = item.Country,
                            Notes = item.Notes,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.WorkLocationPreferences.Add(preference);
                        createdPreferences.Add(preference);
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(createdPreferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying template {TemplateId}", id);
            return StatusCode(500, "An error occurred while applying the template");
        }
    }
}

public class ApplyTemplateRequest
{
    public DateTime StartDate { get; set; }
    public int WeekCount { get; set; } = 1;
}
