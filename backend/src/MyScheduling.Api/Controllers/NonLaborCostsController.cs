using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/non-labor-costs")]
public class NonLaborCostsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<NonLaborCostsController> _logger;

    public NonLaborCostsController(MySchedulingDbContext context, ILogger<NonLaborCostsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Cost Types

    /// <summary>
    /// Get all non-labor cost types for the tenant
    /// </summary>
    [HttpGet("types")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<NonLaborCostType>>> GetCostTypes([FromQuery] bool includeInactive = false)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.NonLaborCostTypes
                .AsNoTracking()
                .Where(t => t.TenantId == tenantId.Value);

            if (!includeInactive)
                query = query.Where(t => t.IsActive);

            var types = await query
                .OrderBy(t => t.Category)
                .ThenBy(t => t.SortOrder)
                .ThenBy(t => t.Name)
                .ToListAsync();

            return Ok(types);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting non-labor cost types");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific cost type
    /// </summary>
    [HttpGet("types/{id}")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Read)]
    public async Task<ActionResult<NonLaborCostType>> GetCostType(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var costType = await _context.NonLaborCostTypes
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId.Value);

            if (costType == null)
                return NotFound(new { message = "Cost type not found" });

            return Ok(costType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost type {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new cost type
    /// </summary>
    [HttpPost("types")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Create)]
    public async Task<ActionResult<NonLaborCostType>> CreateCostType([FromBody] CreateCostTypeRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var costType = new NonLaborCostType
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId.Value,
                Name = request.Name,
                Code = request.Code,
                Description = request.Description,
                Category = request.Category,
                SortOrder = request.SortOrder ?? 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.NonLaborCostTypes.Add(costType);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCostType), new { id = costType.Id }, costType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cost type");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a cost type
    /// </summary>
    [HttpPut("types/{id}")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Update)]
    public async Task<ActionResult> UpdateCostType(Guid id, [FromBody] UpdateCostTypeRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var costType = await _context.NonLaborCostTypes
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId.Value);

            if (costType == null)
                return NotFound(new { message = "Cost type not found" });

            if (request.Name != null) costType.Name = request.Name;
            if (request.Code != null) costType.Code = request.Code;
            if (request.Description != null) costType.Description = request.Description;
            if (request.Category.HasValue) costType.Category = request.Category.Value;
            if (request.SortOrder.HasValue) costType.SortOrder = request.SortOrder.Value;
            if (request.IsActive.HasValue) costType.IsActive = request.IsActive.Value;

            costType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cost type {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a cost type (soft delete)
    /// </summary>
    [HttpDelete("types/{id}")]
    [RequiresPermission(Resource = "NonLaborCostType", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteCostType(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var costType = await _context.NonLaborCostTypes
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId.Value);

            if (costType == null)
                return NotFound(new { message = "Cost type not found" });

            costType.IsActive = false;
            costType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cost type {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Non-Labor Forecasts

    /// <summary>
    /// Get non-labor forecasts for a project
    /// </summary>
    [HttpGet("forecasts")]
    [RequiresPermission(Resource = "NonLaborForecast", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<NonLaborForecast>>> GetForecasts(
        [FromQuery] Guid? projectId,
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.NonLaborForecasts
                .AsNoTracking()
                .Include(f => f.NonLaborCostType)
                .Include(f => f.Project)
                .Where(f => f.TenantId == tenantId.Value);

            if (projectId.HasValue)
                query = query.Where(f => f.ProjectId == projectId.Value);

            if (year.HasValue)
                query = query.Where(f => f.Year == year.Value);

            if (month.HasValue)
                query = query.Where(f => f.Month == month.Value);

            var forecasts = await query
                .OrderBy(f => f.Year)
                .ThenBy(f => f.Month)
                .ThenBy(f => f.NonLaborCostType!.Category)
                .ToListAsync();

            return Ok(forecasts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting non-labor forecasts");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create or update a non-labor forecast
    /// </summary>
    [HttpPost("forecasts")]
    [RequiresPermission(Resource = "NonLaborForecast", Action = PermissionAction.Create)]
    public async Task<ActionResult<NonLaborForecast>> UpsertForecast([FromBody] UpsertNonLaborForecastRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var userId = GetCurrentUserId();

            // Check if forecast exists for this project/costType/month
            var existing = await _context.NonLaborForecasts
                .FirstOrDefaultAsync(f =>
                    f.TenantId == tenantId.Value &&
                    f.ProjectId == request.ProjectId &&
                    f.NonLaborCostTypeId == request.CostTypeId &&
                    f.Year == request.Year &&
                    f.Month == request.Month);

            if (existing != null)
            {
                // Update existing
                existing.ForecastedAmount = request.Amount;
                existing.Notes = request.Notes;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(existing);
            }
            else
            {
                // Create new
                var forecast = new NonLaborForecast
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    ProjectId = request.ProjectId,
                    NonLaborCostTypeId = request.CostTypeId,
                    Year = request.Year,
                    Month = request.Month,
                    ForecastedAmount = request.Amount,
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NonLaborForecasts.Add(forecast);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetForecasts), new { projectId = forecast.ProjectId }, forecast);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting non-labor forecast");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a non-labor forecast
    /// </summary>
    [HttpDelete("forecasts/{id}")]
    [RequiresPermission(Resource = "NonLaborForecast", Action = PermissionAction.Delete)]
    public async Task<ActionResult> DeleteForecast(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var forecast = await _context.NonLaborForecasts
                .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId.Value);

            if (forecast == null)
                return NotFound(new { message = "Forecast not found" });

            _context.NonLaborForecasts.Remove(forecast);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting non-labor forecast {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Budget Lines

    /// <summary>
    /// Get non-labor budget lines for a project
    /// </summary>
    [HttpGet("budget-lines")]
    [RequiresPermission(Resource = "NonLaborBudgetLine", Action = PermissionAction.Read)]
    public async Task<ActionResult<List<NonLaborBudgetLine>>> GetBudgetLines(
        [FromQuery] Guid? projectId,
        [FromQuery] Guid? budgetId)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var query = _context.NonLaborBudgetLines
                .AsNoTracking()
                .Include(b => b.NonLaborCostType)
                .Include(b => b.ProjectBudget)
                .Where(b => b.TenantId == tenantId.Value);

            if (budgetId.HasValue)
                query = query.Where(b => b.ProjectBudgetId == budgetId.Value);

            var lines = await query
                .OrderBy(b => b.NonLaborCostType!.Category)
                .ThenBy(b => b.NonLaborCostType!.Name)
                .ToListAsync();

            return Ok(lines);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting non-labor budget lines");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create or update a budget line
    /// </summary>
    [HttpPost("budget-lines")]
    [RequiresPermission(Resource = "NonLaborBudgetLine", Action = PermissionAction.Create)]
    public async Task<ActionResult<NonLaborBudgetLine>> UpsertBudgetLine([FromBody] UpsertBudgetLineRequest request)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            if (!tenantId.HasValue)
                return BadRequest(new { message = "Invalid tenant context" });

            var existing = await _context.NonLaborBudgetLines
                .FirstOrDefaultAsync(b =>
                    b.TenantId == tenantId.Value &&
                    b.ProjectBudgetId == request.BudgetId &&
                    b.NonLaborCostTypeId == request.CostTypeId &&
                    b.Year == request.Year &&
                    b.Month == request.Month);

            if (existing != null)
            {
                existing.BudgetedAmount = request.BudgetedAmount;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(existing);
            }
            else
            {
                var budgetLine = new NonLaborBudgetLine
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId.Value,
                    ProjectBudgetId = request.BudgetId,
                    NonLaborCostTypeId = request.CostTypeId,
                    Year = request.Year,
                    Month = request.Month,
                    BudgetedAmount = request.BudgetedAmount,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NonLaborBudgetLines.Add(budgetLine);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetBudgetLines), new { budgetId = budgetLine.ProjectBudgetId }, budgetLine);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting budget line");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    #endregion

    #region Helpers

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

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;

        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            return userId;

        return null;
    }

    #endregion
}

#region DTOs

public class CreateCostTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public NonLaborCostCategory Category { get; set; }
    public int? SortOrder { get; set; }
}

public class UpdateCostTypeRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public NonLaborCostCategory? Category { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}

public class UpsertNonLaborForecastRequest
{
    public Guid ProjectId { get; set; }
    public Guid CostTypeId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

public class UpsertBudgetLineRequest
{
    public Guid BudgetId { get; set; }
    public Guid CostTypeId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal BudgetedAmount { get; set; }
}

#endregion
