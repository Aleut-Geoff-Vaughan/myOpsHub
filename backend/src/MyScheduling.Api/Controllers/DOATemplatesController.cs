using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DOATemplatesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<DOATemplatesController> _logger;

    public DOATemplatesController(MySchedulingDbContext context, ILogger<DOATemplatesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/doatemplates
    [HttpGet]
    [RequiresPermission(Resource = "DOATemplate", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<DOATemplate>>> GetDOATemplates()
    {
        try
        {
            var tenantIds = GetUserTenantIds();

            var templates = await _context.DOATemplates
                .Where(t => tenantIds.Contains(t.TenantId) && t.IsActive)
                .OrderBy(t => t.SortOrder)
                .ThenBy(t => t.Name)
                .AsNoTracking()
                .ToListAsync();

            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving DOA templates");
            return StatusCode(500, "An error occurred while retrieving DOA templates");
        }
    }

    // GET: api/doatemplates/{id}
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "DOATemplate", Action = PermissionAction.Read)]
    public async Task<ActionResult<DOATemplate>> GetDOATemplate(Guid id)
    {
        try
        {
            var tenantIds = GetUserTenantIds();

            var template = await _context.DOATemplates
                .FirstOrDefaultAsync(t => t.Id == id && tenantIds.Contains(t.TenantId));

            if (template == null)
            {
                return NotFound($"DOA template with ID {id} not found");
            }

            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving DOA template {TemplateId}", id);
            return StatusCode(500, "An error occurred while retrieving the DOA template");
        }
    }

    // POST: api/doatemplates
    [HttpPost]
    [RequiresPermission(Resource = "DOATemplate", Action = PermissionAction.Create)]
    public async Task<ActionResult<DOATemplate>> CreateDOATemplate(CreateDOATemplateRequest request)
    {
        try
        {
            var tenantId = GetUserTenantIds().FirstOrDefault();
            if (tenantId == Guid.Empty)
            {
                return BadRequest("User must be associated with a tenant");
            }

            var template = new DOATemplate
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = request.Name,
                Description = request.Description,
                LetterContent = request.LetterContent,
                IsDefault = request.IsDefault ?? false,
                IsActive = request.IsActive ?? true,
                SortOrder = request.SortOrder ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // If this is set as default, unset other defaults
            if (template.IsDefault)
            {
                var existingDefaults = await _context.DOATemplates
                    .Where(t => t.TenantId == tenantId && t.IsDefault)
                    .ToListAsync();

                foreach (var existing in existingDefaults)
                {
                    existing.IsDefault = false;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }

            _context.DOATemplates.Add(template);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDOATemplate), new { id = template.Id }, template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating DOA template");
            return StatusCode(500, "An error occurred while creating the DOA template");
        }
    }

    // PUT: api/doatemplates/{id}
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "DOATemplate", Action = PermissionAction.Update)]
    public async Task<IActionResult> UpdateDOATemplate(Guid id, UpdateDOATemplateRequest request)
    {
        try
        {
            var tenantIds = GetUserTenantIds();

            var template = await _context.DOATemplates
                .FirstOrDefaultAsync(t => t.Id == id && tenantIds.Contains(t.TenantId));

            if (template == null)
            {
                return NotFound($"DOA template with ID {id} not found");
            }

            template.Name = request.Name;
            template.Description = request.Description;
            template.LetterContent = request.LetterContent;
            template.IsDefault = request.IsDefault ?? template.IsDefault;
            template.IsActive = request.IsActive ?? template.IsActive;
            template.SortOrder = request.SortOrder ?? template.SortOrder;
            template.UpdatedAt = DateTime.UtcNow;

            // If this is set as default, unset other defaults
            if (template.IsDefault)
            {
                var existingDefaults = await _context.DOATemplates
                    .Where(t => t.TenantId == template.TenantId && t.IsDefault && t.Id != id)
                    .ToListAsync();

                foreach (var existing in existingDefaults)
                {
                    existing.IsDefault = false;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating DOA template {TemplateId}", id);
            return StatusCode(500, "An error occurred while updating the DOA template");
        }
    }

    // DELETE: api/doatemplates/{id}
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "DOATemplate", Action = PermissionAction.Delete)]
    public async Task<IActionResult> DeleteDOATemplate(Guid id)
    {
        try
        {
            var tenantIds = GetUserTenantIds();

            var template = await _context.DOATemplates
                .FirstOrDefaultAsync(t => t.Id == id && tenantIds.Contains(t.TenantId));

            if (template == null)
            {
                return NotFound($"DOA template with ID {id} not found");
            }

            // Soft delete by marking as inactive instead of hard delete
            template.IsActive = false;
            template.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting DOA template {TemplateId}", id);
            return StatusCode(500, "An error occurred while deleting the DOA template");
        }
    }
}

// Request DTOs
public class CreateDOATemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LetterContent { get; set; } = string.Empty;
    public bool? IsDefault { get; set; }
    public bool? IsActive { get; set; }
    public int? SortOrder { get; set; }
}

public class UpdateDOATemplateRequest : CreateDOATemplateRequest
{
}
