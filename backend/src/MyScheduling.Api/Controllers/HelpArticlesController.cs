using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Controller for managing context-sensitive help articles.
/// Provides CRUD operations for help content linked to JIRA, videos, and custom content.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HelpArticlesController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<HelpArticlesController> _logger;

    public HelpArticlesController(
        MySchedulingDbContext context,
        ILogger<HelpArticlesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get help articles for a specific context key (e.g., "work.staffing")
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HelpArticleDto>>> GetByContext([FromQuery] string? contextKey)
    {
        var tenantId = GetCurrentTenantId();

        var query = _context.HelpArticles
            .Where(h => h.IsActive && !h.IsDeleted);

        // Filter by context key if provided
        if (!string.IsNullOrEmpty(contextKey))
        {
            query = query.Where(h => h.ContextKey == contextKey);
        }

        // Filter by tenant (include system-wide articles where TenantId is null)
        query = query.Where(h => h.TenantId == null || h.TenantId == tenantId);

        var articles = await query
            .OrderBy(h => h.SortOrder)
            .ThenBy(h => h.Title)
            .Select(h => new HelpArticleDto
            {
                Id = h.Id,
                ContextKey = h.ContextKey,
                Title = h.Title,
                Description = h.Description,
                JiraArticleUrl = h.JiraArticleUrl,
                VideoUrl = h.VideoUrl,
                VideoTitle = h.VideoTitle,
                Content = h.Content,
                SortOrder = h.SortOrder,
                ModuleName = h.ModuleName,
                Tags = h.Tags,
                IconName = h.IconName,
                IsSystemWide = h.TenantId == null
            })
            .ToListAsync();

        return Ok(articles);
    }

    /// <summary>
    /// Get help articles for a specific module (e.g., "work", "forecast", "facilities")
    /// </summary>
    [HttpGet("module/{moduleName}")]
    public async Task<ActionResult<IEnumerable<HelpArticleDto>>> GetByModule(string moduleName)
    {
        var tenantId = GetCurrentTenantId();

        var articles = await _context.HelpArticles
            .Where(h => h.IsActive && !h.IsDeleted)
            .Where(h => h.ModuleName != null && h.ModuleName.ToLower() == moduleName.ToLower())
            .Where(h => h.TenantId == null || h.TenantId == tenantId)
            .OrderBy(h => h.SortOrder)
            .ThenBy(h => h.Title)
            .Select(h => new HelpArticleDto
            {
                Id = h.Id,
                ContextKey = h.ContextKey,
                Title = h.Title,
                Description = h.Description,
                JiraArticleUrl = h.JiraArticleUrl,
                VideoUrl = h.VideoUrl,
                VideoTitle = h.VideoTitle,
                Content = h.Content,
                SortOrder = h.SortOrder,
                ModuleName = h.ModuleName,
                Tags = h.Tags,
                IconName = h.IconName,
                IsSystemWide = h.TenantId == null
            })
            .ToListAsync();

        return Ok(articles);
    }

    /// <summary>
    /// Search help articles by title, description, or tags
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<HelpArticleDto>>> Search([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Search query is required" });
        }

        var tenantId = GetCurrentTenantId();
        var searchTerm = query.ToLower();

        var articles = await _context.HelpArticles
            .Where(h => h.IsActive && !h.IsDeleted)
            .Where(h => h.TenantId == null || h.TenantId == tenantId)
            .Where(h =>
                h.Title.ToLower().Contains(searchTerm) ||
                (h.Description != null && h.Description.ToLower().Contains(searchTerm)) ||
                (h.Tags != null && h.Tags.ToLower().Contains(searchTerm)) ||
                h.ContextKey.ToLower().Contains(searchTerm))
            .OrderBy(h => h.ModuleName)
            .ThenBy(h => h.SortOrder)
            .ThenBy(h => h.Title)
            .Select(h => new HelpArticleDto
            {
                Id = h.Id,
                ContextKey = h.ContextKey,
                Title = h.Title,
                Description = h.Description,
                JiraArticleUrl = h.JiraArticleUrl,
                VideoUrl = h.VideoUrl,
                VideoTitle = h.VideoTitle,
                Content = h.Content,
                SortOrder = h.SortOrder,
                ModuleName = h.ModuleName,
                Tags = h.Tags,
                IconName = h.IconName,
                IsSystemWide = h.TenantId == null
            })
            .ToListAsync();

        return Ok(articles);
    }

    /// <summary>
    /// Get a specific help article by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<HelpArticleDto>> GetById(Guid id)
    {
        var tenantId = GetCurrentTenantId();

        var article = await _context.HelpArticles
            .Where(h => h.Id == id && !h.IsDeleted)
            .Where(h => h.TenantId == null || h.TenantId == tenantId)
            .Select(h => new HelpArticleDto
            {
                Id = h.Id,
                ContextKey = h.ContextKey,
                Title = h.Title,
                Description = h.Description,
                JiraArticleUrl = h.JiraArticleUrl,
                VideoUrl = h.VideoUrl,
                VideoTitle = h.VideoTitle,
                Content = h.Content,
                SortOrder = h.SortOrder,
                ModuleName = h.ModuleName,
                Tags = h.Tags,
                IconName = h.IconName,
                IsSystemWide = h.TenantId == null
            })
            .FirstOrDefaultAsync();

        if (article == null)
        {
            return NotFound(new { message = "Help article not found" });
        }

        return Ok(article);
    }

    /// <summary>
    /// Create a new help article (Admin only)
    /// </summary>
    [HttpPost]
    [RequiresPermission(Resource = "HelpArticle", Action = PermissionAction.Create)]
    public async Task<ActionResult<HelpArticleDto>> Create([FromBody] CreateHelpArticleRequest request)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Title is required" });
        }

        if (string.IsNullOrWhiteSpace(request.ContextKey))
        {
            return BadRequest(new { message = "Context key is required" });
        }

        var article = new HelpArticle
        {
            Id = Guid.NewGuid(),
            TenantId = request.IsSystemWide ? null : tenantId,
            ContextKey = request.ContextKey,
            Title = request.Title,
            Description = request.Description,
            JiraArticleUrl = request.JiraArticleUrl,
            VideoUrl = request.VideoUrl,
            VideoTitle = request.VideoTitle,
            Content = request.Content,
            SortOrder = request.SortOrder,
            ModuleName = request.ModuleName,
            Tags = request.Tags,
            IconName = request.IconName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _context.HelpArticles.Add(article);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Help article created: {Title} ({ContextKey}) by {UserId}", article.Title, article.ContextKey, userId);

        return CreatedAtAction(nameof(GetById), new { id = article.Id }, new HelpArticleDto
        {
            Id = article.Id,
            ContextKey = article.ContextKey,
            Title = article.Title,
            Description = article.Description,
            JiraArticleUrl = article.JiraArticleUrl,
            VideoUrl = article.VideoUrl,
            VideoTitle = article.VideoTitle,
            Content = article.Content,
            SortOrder = article.SortOrder,
            ModuleName = article.ModuleName,
            Tags = article.Tags,
            IconName = article.IconName,
            IsSystemWide = article.TenantId == null
        });
    }

    /// <summary>
    /// Update an existing help article (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequiresPermission(Resource = "HelpArticle", Action = PermissionAction.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHelpArticleRequest request)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        var article = await _context.HelpArticles
            .FirstOrDefaultAsync(h => h.Id == id && !h.IsDeleted);

        if (article == null)
        {
            return NotFound(new { message = "Help article not found" });
        }

        // Verify tenant access (unless system-wide)
        if (article.TenantId != null && article.TenantId != tenantId)
        {
            return Forbid();
        }

        if (!string.IsNullOrEmpty(request.Title))
            article.Title = request.Title;
        if (request.ContextKey != null)
            article.ContextKey = request.ContextKey;
        if (request.Description != null)
            article.Description = request.Description;
        if (request.JiraArticleUrl != null)
            article.JiraArticleUrl = request.JiraArticleUrl;
        if (request.VideoUrl != null)
            article.VideoUrl = request.VideoUrl;
        if (request.VideoTitle != null)
            article.VideoTitle = request.VideoTitle;
        if (request.Content != null)
            article.Content = request.Content;
        if (request.SortOrder.HasValue)
            article.SortOrder = request.SortOrder.Value;
        if (request.ModuleName != null)
            article.ModuleName = request.ModuleName;
        if (request.Tags != null)
            article.Tags = request.Tags;
        if (request.IconName != null)
            article.IconName = request.IconName;
        if (request.IsActive.HasValue)
            article.IsActive = request.IsActive.Value;

        article.UpdatedAt = DateTime.UtcNow;
        article.UpdatedByUserId = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Help article updated: {Id} by {UserId}", id, userId);

        return NoContent();
    }

    /// <summary>
    /// Delete a help article (soft delete, Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequiresPermission(Resource = "HelpArticle", Action = PermissionAction.Delete)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        var article = await _context.HelpArticles
            .FirstOrDefaultAsync(h => h.Id == id && !h.IsDeleted);

        if (article == null)
        {
            return NotFound(new { message = "Help article not found" });
        }

        // Verify tenant access (unless system-wide)
        if (article.TenantId != null && article.TenantId != tenantId)
        {
            return Forbid();
        }

        article.IsDeleted = true;
        article.DeletedAt = DateTime.UtcNow;
        article.DeletedByUserId = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Help article deleted: {Id} by {UserId}", id, userId);

        return NoContent();
    }

    /// <summary>
    /// Get all help articles for admin management (Admin only)
    /// </summary>
    [HttpGet("admin/all")]
    [RequiresPermission(Resource = "HelpArticle", Action = PermissionAction.Manage)]
    public async Task<ActionResult<IEnumerable<HelpArticleDto>>> GetAllForAdmin([FromQuery] bool includeDeleted = false)
    {
        var tenantId = GetCurrentTenantId();

        var query = _context.HelpArticles.AsQueryable();

        if (!includeDeleted)
        {
            query = query.Where(h => !h.IsDeleted);
        }

        // Filter by tenant (include system-wide articles)
        query = query.Where(h => h.TenantId == null || h.TenantId == tenantId);

        var articles = await query
            .OrderBy(h => h.ModuleName)
            .ThenBy(h => h.ContextKey)
            .ThenBy(h => h.SortOrder)
            .Select(h => new HelpArticleDto
            {
                Id = h.Id,
                ContextKey = h.ContextKey,
                Title = h.Title,
                Description = h.Description,
                JiraArticleUrl = h.JiraArticleUrl,
                VideoUrl = h.VideoUrl,
                VideoTitle = h.VideoTitle,
                Content = h.Content,
                SortOrder = h.SortOrder,
                ModuleName = h.ModuleName,
                Tags = h.Tags,
                IconName = h.IconName,
                IsSystemWide = h.TenantId == null,
                IsActive = h.IsActive,
                IsDeleted = h.IsDeleted
            })
            .ToListAsync();

        return Ok(articles);
    }

    private Guid? GetCurrentTenantId()
    {
        // Check X-Tenant-Id header first (set by frontend when workspace selected)
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
            Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
        {
            return parsedHeaderTenantId;
        }

        // Fallback to first TenantId claim
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
public class HelpArticleDto
{
    public Guid Id { get; set; }
    public string ContextKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? JiraArticleUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? VideoTitle { get; set; }
    public string? Content { get; set; }
    public int SortOrder { get; set; }
    public string? ModuleName { get; set; }
    public string? Tags { get; set; }
    public string? IconName { get; set; }
    public bool IsSystemWide { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
}

public class CreateHelpArticleRequest
{
    public string ContextKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? JiraArticleUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? VideoTitle { get; set; }
    public string? Content { get; set; }
    public int SortOrder { get; set; }
    public string? ModuleName { get; set; }
    public string? Tags { get; set; }
    public string? IconName { get; set; }
    public bool IsSystemWide { get; set; }
}

public class UpdateHelpArticleRequest
{
    public string? ContextKey { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? JiraArticleUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? VideoTitle { get; set; }
    public string? Content { get; set; }
    public int? SortOrder { get; set; }
    public string? ModuleName { get; set; }
    public string? Tags { get; set; }
    public string? IconName { get; set; }
    public bool? IsActive { get; set; }
}
