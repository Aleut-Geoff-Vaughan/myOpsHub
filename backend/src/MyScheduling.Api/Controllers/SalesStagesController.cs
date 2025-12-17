using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/salesops/stages")]
public class SalesStagesController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<SalesStagesController> _logger;

    public SalesStagesController(MySchedulingDbContext context, ILogger<SalesStagesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all sales stages for the tenant
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "SalesStage", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<SalesStage>>> GetStages([FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.SalesStages
                .AsNoTracking()
                .Where(s => s.TenantId == tenantId.Value);

            if (!includeInactive)
                query = query.Where(s => s.IsActive);

            var stages = await query
                .OrderBy(s => s.SortOrder)
                .ToListAsync();

            return Ok(stages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales stages");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific stage
    /// </summary>
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "SalesStage", Action = PermissionAction.Read)]
    public async Task<ActionResult<SalesStage>> GetStage(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var stage = await _context.SalesStages
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId.Value);

            if (stage == null)
                return NotFound(new { message = "Stage not found" });

            return Ok(stage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stage {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new stage
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "SalesStage", Action = PermissionAction.Create)]
    public async Task<ActionResult<SalesStage>> CreateStage([FromBody] CreateStageRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Get max sort order
            var maxSort = await _context.SalesStages
                .Where(s => s.TenantId == tenantId.Value)
                .MaxAsync(s => (int?)s.SortOrder) ?? 0;

            var stage = new SalesStage
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                Name = request.Name,
                Code = request.Code,
                Description = request.Description,
                DefaultProbability = request.DefaultProbability,
                Color = request.Color,
                IsWonStage = request.IsWonStage,
                IsLostStage = request.IsLostStage,
                IsClosedStage = request.IsClosedStage,
                SortOrder = request.SortOrder ?? maxSort + 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesStages.Add(stage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStage), new { id = stage.Id }, stage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating stage");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a stage
    /// </summary>
    [HttpPut("{id}")]
    [RequiresPermission(Resource = "SalesStage", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateStage(Guid id, [FromBody] UpdateStageRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var stage = await _context.SalesStages
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId.Value);

            if (stage == null)
                return NotFound(new { message = "Stage not found" });

            if (request.Name != null) stage.Name = request.Name;
            if (request.Code != null) stage.Code = request.Code;
            if (request.Description != null) stage.Description = request.Description;
            if (request.DefaultProbability.HasValue) stage.DefaultProbability = request.DefaultProbability.Value;
            if (request.Color != null) stage.Color = request.Color;
            if (request.IsWonStage.HasValue) stage.IsWonStage = request.IsWonStage.Value;
            if (request.IsLostStage.HasValue) stage.IsLostStage = request.IsLostStage.Value;
            if (request.IsClosedStage.HasValue) stage.IsClosedStage = request.IsClosedStage.Value;
            if (request.SortOrder.HasValue) stage.SortOrder = request.SortOrder.Value;
            if (request.IsActive.HasValue) stage.IsActive = request.IsActive.Value;

            stage.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating stage {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reorder stages
    /// </summary>
    [HttpPut("reorder")]
    [RequiresPermission(Resource = "SalesStage", Action = PermissionAction.Update)]
    public async Task<ActionResult> ReorderStages([FromBody] List<Guid> stageIds)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var stages = await _context.SalesStages
                .Where(s => s.TenantId == tenantId.Value && stageIds.Contains(s.Id))
                .ToListAsync();

            for (int i = 0; i < stageIds.Count; i++)
            {
                var stage = stages.FirstOrDefault(s => s.Id == stageIds[i]);
                if (stage != null)
                {
                    stage.SortOrder = i;
                    stage.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering stages");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a stage (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [RequiresPermission(Resource = "SalesStage", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteStage(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var stage = await _context.SalesStages
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId.Value);

            if (stage == null)
                return NotFound(new { message = "Stage not found" });

            // Check if any opportunities use this stage
            var hasOpportunities = await _context.SalesOpportunities
                .AnyAsync(o => o.StageId == id && o.TenantId == tenantId.Value);

            if (hasOpportunities)
                return BadRequest(new { message = "Cannot delete stage that has opportunities assigned to it" });

            stage.IsActive = false;
            stage.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting stage {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Seed default stages for a new tenant
    /// </summary>
    [HttpPost("seed-defaults")]
    [RequiresPermission(Resource = "SalesStage", Action = PermissionAction.Create)]
    public async Task<ActionResult> SeedDefaultStages()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            // Check if stages already exist
            var existing = await _context.SalesStages
                .AnyAsync(s => s.TenantId == tenantId.Value);

            if (existing)
                return BadRequest(new { message = "Stages already exist for this tenant" });

            var defaultStages = new List<SalesStage>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Lead", Code = "LEAD", DefaultProbability = 10, Color = "#94a3b8", SortOrder = 0, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Qualified", Code = "QUAL", DefaultProbability = 25, Color = "#3b82f6", SortOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Active Capture", Code = "CAPTURE", DefaultProbability = 50, Color = "#8b5cf6", SortOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Proposal", Code = "PROP", DefaultProbability = 60, Color = "#f59e0b", SortOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Proposal Submitted", Code = "SUBM", DefaultProbability = 70, Color = "#10b981", SortOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Negotiation", Code = "NEGO", DefaultProbability = 85, Color = "#06b6d4", SortOrder = 5, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Closed Won", Code = "WON", DefaultProbability = 100, Color = "#22c55e", SortOrder = 6, IsActive = true, IsWonStage = true, IsClosedStage = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), TenantId = tenantId.Value, Name = "Closed Lost", Code = "LOST", DefaultProbability = 0, Color = "#ef4444", SortOrder = 7, IsActive = true, IsLostStage = true, IsClosedStage = true, CreatedAt = DateTime.UtcNow },
            };

            _context.SalesStages.AddRange(defaultStages);
            await _context.SaveChangesAsync();

            return Ok(defaultStages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding default stages");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #region Helper Methods

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

    #endregion
}

public class CreateStageRequest
{
    public required string Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public int DefaultProbability { get; set; }
    public string? Color { get; set; }
    public bool IsWonStage { get; set; }
    public bool IsLostStage { get; set; }
    public bool IsClosedStage { get; set; }
    public int? SortOrder { get; set; }
}

public class UpdateStageRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public int? DefaultProbability { get; set; }
    public string? Color { get; set; }
    public bool? IsWonStage { get; set; }
    public bool? IsLostStage { get; set; }
    public bool? IsClosedStage { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}
