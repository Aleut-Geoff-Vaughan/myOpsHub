using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Controller for managing app launcher tiles.
/// Supports built-in tiles (myWork, myForecast, myFacilities), tenant-wide external tiles, and user personal tiles.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppTilesController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<AppTilesController> _logger;

    // Built-in tile definitions (these don't need database storage)
    private static readonly List<AppTileDto> BuiltInTiles = new()
    {
        new AppTileDto
        {
            Id = Guid.Parse("00000000-0000-0000-0001-000000000001"),
            Name = "myWork",
            Description = "Staffing, schedules, resumes, and delegations",
            Icon = "briefcase",
            BackgroundColor = "#2563eb",
            TextColor = "#ffffff",
            Url = "/work",
            OpenInNewTab = false,
            SortOrder = 1,
            IsBuiltIn = true,
            Category = "Internal Apps"
        },
        new AppTileDto
        {
            Id = Guid.Parse("00000000-0000-0000-0001-000000000002"),
            Name = "myForecast",
            Description = "Project forecasting and budget planning",
            Icon = "chart-line",
            BackgroundColor = "#059669",
            TextColor = "#ffffff",
            Url = "/forecast",
            OpenInNewTab = false,
            SortOrder = 2,
            IsBuiltIn = true,
            Category = "Internal Apps"
        },
        new AppTileDto
        {
            Id = Guid.Parse("00000000-0000-0000-0001-000000000003"),
            Name = "myFacilities",
            Description = "Office hoteling and facility management",
            Icon = "building-office",
            BackgroundColor = "#0d9488",
            TextColor = "#ffffff",
            Url = "/facilities",
            OpenInNewTab = false,
            SortOrder = 3,
            IsBuiltIn = true,
            Category = "Internal Apps"
        },
        new AppTileDto
        {
            Id = Guid.Parse("00000000-0000-0000-0001-000000000004"),
            Name = "mySalesOps",
            Description = "Sales pipeline and opportunity management",
            Icon = "currency-dollar",
            BackgroundColor = "#ea580c",
            TextColor = "#ffffff",
            Url = "/salesops",
            OpenInNewTab = false,
            SortOrder = 4,
            IsBuiltIn = true,
            Category = "Internal Apps"
        }
    };

    public AppTilesController(
        MySchedulingDbContext context,
        ILogger<AppTilesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all tiles for the current user (built-in + tenant + personal)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppTileDto>>> GetAll()
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        // Start with built-in tiles
        var tiles = new List<AppTileDto>(BuiltInTiles);

        // Add tenant-wide tiles
        var tenantTiles = await _context.AppTiles
            .Where(t => t.TenantId == tenantId && t.UserId == null && t.IsActive && !t.IsDeleted)
            .OrderBy(t => t.SortOrder)
            .Select(t => new AppTileDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Icon = t.Icon,
                BackgroundColor = t.BackgroundColor,
                TextColor = t.TextColor,
                Url = t.Url,
                OpenInNewTab = t.OpenInNewTab,
                SortOrder = t.SortOrder,
                IsBuiltIn = false,
                Category = t.Category ?? "Enterprise Apps",
                IsTenantTile = true,
                IsUserTile = false
            })
            .ToListAsync();

        tiles.AddRange(tenantTiles);

        // Add user personal tiles
        if (userId.HasValue)
        {
            var userTiles = await _context.AppTiles
                .Where(t => t.UserId == userId && t.IsActive && !t.IsDeleted)
                .OrderBy(t => t.SortOrder)
                .Select(t => new AppTileDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description,
                    Icon = t.Icon,
                    BackgroundColor = t.BackgroundColor,
                    TextColor = t.TextColor,
                    Url = t.Url,
                    OpenInNewTab = t.OpenInNewTab,
                    SortOrder = t.SortOrder,
                    IsBuiltIn = false,
                    Category = t.Category ?? "My Apps",
                    IsTenantTile = false,
                    IsUserTile = true
                })
                .ToListAsync();

            tiles.AddRange(userTiles);
        }

        return Ok(tiles);
    }

    /// <summary>
    /// Get tenant-wide tiles for admin management
    /// </summary>
    [HttpGet("tenant")]
    [RequiresPermission(Resource = "AppTile", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<AppTileDto>>> GetTenantTiles()
    {
        var tenantId = GetCurrentTenantId();

        var tiles = await _context.AppTiles
            .Where(t => t.TenantId == tenantId && t.UserId == null && !t.IsDeleted)
            .OrderBy(t => t.SortOrder)
            .Select(t => new AppTileDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Icon = t.Icon,
                BackgroundColor = t.BackgroundColor,
                TextColor = t.TextColor,
                Url = t.Url,
                OpenInNewTab = t.OpenInNewTab,
                SortOrder = t.SortOrder,
                IsBuiltIn = false,
                IsActive = t.IsActive,
                Category = t.Category,
                IsTenantTile = true,
                IsUserTile = false
            })
            .ToListAsync();

        return Ok(tiles);
    }

    /// <summary>
    /// Get user's personal tiles
    /// </summary>
    [HttpGet("user")]
    public async Task<ActionResult<IEnumerable<AppTileDto>>> GetUserTiles()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Ok(new List<AppTileDto>());
        }

        var tiles = await _context.AppTiles
            .Where(t => t.UserId == userId && !t.IsDeleted)
            .OrderBy(t => t.SortOrder)
            .Select(t => new AppTileDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Icon = t.Icon,
                BackgroundColor = t.BackgroundColor,
                TextColor = t.TextColor,
                Url = t.Url,
                OpenInNewTab = t.OpenInNewTab,
                SortOrder = t.SortOrder,
                IsBuiltIn = false,
                IsActive = t.IsActive,
                Category = t.Category,
                IsTenantTile = false,
                IsUserTile = true
            })
            .ToListAsync();

        return Ok(tiles);
    }

    /// <summary>
    /// Create a tenant-wide tile (Admin only)
    /// </summary>
    [HttpPost("tenant")]
    [RequiresPermission(Resource = "AppTile", Action = PermissionAction.Create)]
    public async Task<ActionResult<AppTileDto>> CreateTenantTile([FromBody] CreateAppTileRequest request)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        if (!tenantId.HasValue)
        {
            return BadRequest(new { message = "Tenant context required" });
        }

        var tile = new AppTile
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = null,
            Name = request.Name,
            Description = request.Description,
            Icon = request.Icon ?? "link",
            BackgroundColor = request.BackgroundColor ?? "#6366f1",
            TextColor = request.TextColor ?? "#ffffff",
            Url = request.Url,
            OpenInNewTab = request.OpenInNewTab,
            SortOrder = request.SortOrder,
            Category = request.Category ?? "Enterprise Apps",
            IsBuiltIn = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _context.AppTiles.Add(tile);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Tenant tile created: {Name} by {UserId}", tile.Name, userId);

        return CreatedAtAction(nameof(GetTenantTiles), new AppTileDto
        {
            Id = tile.Id,
            Name = tile.Name,
            Description = tile.Description,
            Icon = tile.Icon,
            BackgroundColor = tile.BackgroundColor,
            TextColor = tile.TextColor,
            Url = tile.Url,
            OpenInNewTab = tile.OpenInNewTab,
            SortOrder = tile.SortOrder,
            IsBuiltIn = false,
            IsActive = true,
            Category = tile.Category,
            IsTenantTile = true,
            IsUserTile = false
        });
    }

    /// <summary>
    /// Create a personal user tile
    /// </summary>
    [HttpPost("user")]
    public async Task<ActionResult<AppTileDto>> CreateUserTile([FromBody] CreateAppTileRequest request)
    {
        var userId = GetCurrentUserId();

        if (!userId.HasValue)
        {
            return BadRequest(new { message = "User context required" });
        }

        var tile = new AppTile
        {
            Id = Guid.NewGuid(),
            TenantId = null,
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            Icon = request.Icon ?? "link",
            BackgroundColor = request.BackgroundColor ?? "#6366f1",
            TextColor = request.TextColor ?? "#ffffff",
            Url = request.Url,
            OpenInNewTab = request.OpenInNewTab,
            SortOrder = request.SortOrder,
            Category = request.Category ?? "My Apps",
            IsBuiltIn = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _context.AppTiles.Add(tile);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User tile created: {Name} by {UserId}", tile.Name, userId);

        return CreatedAtAction(nameof(GetUserTiles), new AppTileDto
        {
            Id = tile.Id,
            Name = tile.Name,
            Description = tile.Description,
            Icon = tile.Icon,
            BackgroundColor = tile.BackgroundColor,
            TextColor = tile.TextColor,
            Url = tile.Url,
            OpenInNewTab = tile.OpenInNewTab,
            SortOrder = tile.SortOrder,
            IsBuiltIn = false,
            IsActive = true,
            Category = tile.Category,
            IsTenantTile = false,
            IsUserTile = true
        });
    }

    /// <summary>
    /// Update a tile
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAppTileRequest request)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        var tile = await _context.AppTiles.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tile == null)
        {
            return NotFound(new { message = "Tile not found" });
        }

        // Check permission: user can edit their own tiles, admins can edit tenant tiles
        if (tile.UserId.HasValue)
        {
            if (tile.UserId != userId)
            {
                return Forbid();
            }
        }
        else if (tile.TenantId.HasValue)
        {
            if (tile.TenantId != tenantId)
            {
                return Forbid();
            }
            // TODO: Check admin permission for tenant tiles
        }

        if (!string.IsNullOrEmpty(request.Name))
            tile.Name = request.Name;
        if (request.Description != null)
            tile.Description = request.Description;
        if (!string.IsNullOrEmpty(request.Icon))
            tile.Icon = request.Icon;
        if (!string.IsNullOrEmpty(request.BackgroundColor))
            tile.BackgroundColor = request.BackgroundColor;
        if (!string.IsNullOrEmpty(request.TextColor))
            tile.TextColor = request.TextColor;
        if (!string.IsNullOrEmpty(request.Url))
            tile.Url = request.Url;
        if (request.OpenInNewTab.HasValue)
            tile.OpenInNewTab = request.OpenInNewTab.Value;
        if (request.SortOrder.HasValue)
            tile.SortOrder = request.SortOrder.Value;
        if (request.Category != null)
            tile.Category = request.Category;
        if (request.IsActive.HasValue)
            tile.IsActive = request.IsActive.Value;

        tile.UpdatedAt = DateTime.UtcNow;
        tile.UpdatedByUserId = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Tile updated: {Id} by {UserId}", id, userId);

        return NoContent();
    }

    /// <summary>
    /// Delete a tile (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        var tile = await _context.AppTiles.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tile == null)
        {
            return NotFound(new { message = "Tile not found" });
        }

        // Check permission
        if (tile.UserId.HasValue)
        {
            if (tile.UserId != userId)
            {
                return Forbid();
            }
        }
        else if (tile.TenantId.HasValue)
        {
            if (tile.TenantId != tenantId)
            {
                return Forbid();
            }
            // TODO: Check admin permission for tenant tiles
        }

        tile.IsDeleted = true;
        tile.DeletedAt = DateTime.UtcNow;
        tile.DeletedByUserId = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Tile deleted: {Id} by {UserId}", id, userId);

        return NoContent();
    }

    private Guid? GetCurrentTenantId()
    {
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
            Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
        {
            return parsedHeaderTenantId;
        }

        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var parsedTenantId))
        {
            return parsedTenantId;
        }

        return null;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedUserId))
        {
            return parsedUserId;
        }
        return null;
    }
}

// DTOs
public class AppTileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "link";
    public string BackgroundColor { get; set; } = "#6366f1";
    public string TextColor { get; set; } = "#ffffff";
    public string Url { get; set; } = string.Empty;
    public bool OpenInNewTab { get; set; } = true;
    public int SortOrder { get; set; }
    public bool IsBuiltIn { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Category { get; set; }
    public bool IsTenantTile { get; set; }
    public bool IsUserTile { get; set; }
}

public class CreateAppTileRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool OpenInNewTab { get; set; } = true;
    public int SortOrder { get; set; }
    public string? Category { get; set; }
}

public class UpdateAppTileRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public string? Url { get; set; }
    public bool? OpenInNewTab { get; set; }
    public int? SortOrder { get; set; }
    public string? Category { get; set; }
    public bool? IsActive { get; set; }
}
