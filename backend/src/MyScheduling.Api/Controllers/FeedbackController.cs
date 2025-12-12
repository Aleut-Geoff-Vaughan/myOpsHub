using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Controller for managing user feedback (bugs, enhancements, questions).
/// Supports AI-assisted requirement refinement.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<FeedbackController> _logger;

    public FeedbackController(
        MySchedulingDbContext context,
        ILogger<FeedbackController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all feedback for the current tenant (admin view)
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "Feedback", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetAll(
        [FromQuery] FeedbackStatus? status = null,
        [FromQuery] FeedbackType? type = null)
    {
        var tenantId = GetCurrentTenantId();

        var query = _context.Feedbacks
            .Where(f => f.TenantId == tenantId && !f.IsDeleted);

        if (status.HasValue)
        {
            query = query.Where(f => f.Status == status.Value);
        }

        if (type.HasValue)
        {
            query = query.Where(f => f.Type == type.Value);
        }

        var feedbacks = await query
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FeedbackDto
            {
                Id = f.Id,
                Type = f.Type,
                Priority = f.Priority,
                Title = f.Title,
                Description = f.Description,
                PageUrl = f.PageUrl,
                StepsToReproduce = f.StepsToReproduce,
                ExpectedBehavior = f.ExpectedBehavior,
                ActualBehavior = f.ActualBehavior,
                BrowserInfo = f.BrowserInfo,
                ScreenshotUrl = f.ScreenshotUrl,
                Status = f.Status,
                AdminNotes = f.AdminNotes,
                ExternalTicketId = f.ExternalTicketId,
                ExternalTicketUrl = f.ExternalTicketUrl,
                RefinedRequirements = f.RefinedRequirements,
                SubmittedByUserId = f.SubmittedByUserId,
                CreatedAt = f.CreatedAt,
                ResolvedAt = f.ResolvedAt
            })
            .ToListAsync();

        return Ok(feedbacks);
    }

    /// <summary>
    /// Get feedback submitted by the current user
    /// </summary>
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetMyFeedback()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Ok(new List<FeedbackDto>());
        }

        var feedbacks = await _context.Feedbacks
            .Where(f => f.SubmittedByUserId == userId && !f.IsDeleted)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FeedbackDto
            {
                Id = f.Id,
                Type = f.Type,
                Priority = f.Priority,
                Title = f.Title,
                Description = f.Description,
                PageUrl = f.PageUrl,
                Status = f.Status,
                AdminNotes = f.AdminNotes,
                ExternalTicketUrl = f.ExternalTicketUrl,
                RefinedRequirements = f.RefinedRequirements,
                CreatedAt = f.CreatedAt,
                ResolvedAt = f.ResolvedAt
            })
            .ToListAsync();

        return Ok(feedbacks);
    }

    /// <summary>
    /// Get a specific feedback item
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FeedbackDto>> GetById(Guid id)
    {
        var userId = GetCurrentUserId();
        var tenantId = GetCurrentTenantId();

        var feedback = await _context.Feedbacks
            .Where(f => f.Id == id && !f.IsDeleted)
            .Where(f => f.SubmittedByUserId == userId || f.TenantId == tenantId)
            .Select(f => new FeedbackDto
            {
                Id = f.Id,
                Type = f.Type,
                Priority = f.Priority,
                Title = f.Title,
                Description = f.Description,
                PageUrl = f.PageUrl,
                StepsToReproduce = f.StepsToReproduce,
                ExpectedBehavior = f.ExpectedBehavior,
                ActualBehavior = f.ActualBehavior,
                BrowserInfo = f.BrowserInfo,
                ScreenshotUrl = f.ScreenshotUrl,
                Status = f.Status,
                AdminNotes = f.AdminNotes,
                ExternalTicketId = f.ExternalTicketId,
                ExternalTicketUrl = f.ExternalTicketUrl,
                AiConversationHistory = f.AiConversationHistory,
                RefinedRequirements = f.RefinedRequirements,
                SubmittedByUserId = f.SubmittedByUserId,
                CreatedAt = f.CreatedAt,
                ResolvedAt = f.ResolvedAt
            })
            .FirstOrDefaultAsync();

        if (feedback == null)
        {
            return NotFound(new { message = "Feedback not found" });
        }

        return Ok(feedback);
    }

    /// <summary>
    /// Submit new feedback
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FeedbackDto>> Create([FromBody] CreateFeedbackRequest request)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        if (!tenantId.HasValue || !userId.HasValue)
        {
            return BadRequest(new { message = "User and tenant context required" });
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Title is required" });
        }

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId.Value,
            SubmittedByUserId = userId.Value,
            Type = request.Type,
            Priority = request.Priority,
            Title = request.Title,
            Description = request.Description ?? string.Empty,
            PageUrl = request.PageUrl,
            StepsToReproduce = request.StepsToReproduce,
            ExpectedBehavior = request.ExpectedBehavior,
            ActualBehavior = request.ActualBehavior,
            BrowserInfo = request.BrowserInfo,
            ScreenshotUrl = request.ScreenshotUrl,
            AiConversationHistory = request.AiConversationHistory,
            RefinedRequirements = request.RefinedRequirements,
            Status = FeedbackStatus.New,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Feedback submitted: {Title} ({Type}) by {UserId}", feedback.Title, feedback.Type, userId);

        return CreatedAtAction(nameof(GetById), new { id = feedback.Id }, new FeedbackDto
        {
            Id = feedback.Id,
            Type = feedback.Type,
            Priority = feedback.Priority,
            Title = feedback.Title,
            Description = feedback.Description,
            PageUrl = feedback.PageUrl,
            Status = feedback.Status,
            CreatedAt = feedback.CreatedAt
        });
    }

    /// <summary>
    /// Update feedback status and admin notes (admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequiresPermission(Resource = "Feedback", Action = PermissionAction.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFeedbackRequest request)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        var feedback = await _context.Feedbacks
            .FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId && !f.IsDeleted);

        if (feedback == null)
        {
            return NotFound(new { message = "Feedback not found" });
        }

        if (request.Status.HasValue)
        {
            feedback.Status = request.Status.Value;
            if (request.Status.Value == FeedbackStatus.Resolved || request.Status.Value == FeedbackStatus.Closed)
            {
                feedback.ResolvedAt = DateTime.UtcNow;
                feedback.ResolvedByUserId = userId;
            }
        }

        if (request.Priority.HasValue)
            feedback.Priority = request.Priority.Value;
        if (request.AdminNotes != null)
            feedback.AdminNotes = request.AdminNotes;
        if (request.ExternalTicketId != null)
            feedback.ExternalTicketId = request.ExternalTicketId;
        if (request.ExternalTicketUrl != null)
            feedback.ExternalTicketUrl = request.ExternalTicketUrl;

        feedback.UpdatedAt = DateTime.UtcNow;
        feedback.UpdatedByUserId = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Feedback updated: {Id} by {UserId}", id, userId);

        return NoContent();
    }

    /// <summary>
    /// Update AI conversation history for a feedback item (user can update their own)
    /// </summary>
    [HttpPatch("{id:guid}/ai-conversation")]
    public async Task<IActionResult> UpdateAiConversation(Guid id, [FromBody] UpdateAiConversationRequest request)
    {
        var userId = GetCurrentUserId();

        var feedback = await _context.Feedbacks
            .FirstOrDefaultAsync(f => f.Id == id && f.SubmittedByUserId == userId && !f.IsDeleted);

        if (feedback == null)
        {
            return NotFound(new { message = "Feedback not found" });
        }

        feedback.AiConversationHistory = request.AiConversationHistory;
        feedback.RefinedRequirements = request.RefinedRequirements;
        feedback.UpdatedAt = DateTime.UtcNow;
        feedback.UpdatedByUserId = userId;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Delete feedback (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();

        var feedback = await _context.Feedbacks
            .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

        if (feedback == null)
        {
            return NotFound(new { message = "Feedback not found" });
        }

        // Users can delete their own feedback, admins can delete any in their tenant
        if (feedback.SubmittedByUserId != userId && feedback.TenantId != tenantId)
        {
            return Forbid();
        }

        feedback.IsDeleted = true;
        feedback.DeletedAt = DateTime.UtcNow;
        feedback.DeletedByUserId = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Feedback deleted: {Id} by {UserId}", id, userId);

        return NoContent();
    }

    /// <summary>
    /// Get feedback statistics for the current tenant
    /// </summary>
    [HttpGet("stats")]
    [RequiresPermission(Resource = "Feedback", Action = PermissionAction.Read)]
    public async Task<ActionResult<FeedbackStatsDto>> GetStats()
    {
        var tenantId = GetCurrentTenantId();

        var stats = await _context.Feedbacks
            .Where(f => f.TenantId == tenantId && !f.IsDeleted)
            .GroupBy(f => 1)
            .Select(g => new FeedbackStatsDto
            {
                Total = g.Count(),
                New = g.Count(f => f.Status == FeedbackStatus.New),
                UnderReview = g.Count(f => f.Status == FeedbackStatus.UnderReview),
                InProgress = g.Count(f => f.Status == FeedbackStatus.InProgress),
                Resolved = g.Count(f => f.Status == FeedbackStatus.Resolved),
                Closed = g.Count(f => f.Status == FeedbackStatus.Closed),
                Bugs = g.Count(f => f.Type == FeedbackType.Bug),
                Enhancements = g.Count(f => f.Type == FeedbackType.Enhancement),
                Questions = g.Count(f => f.Type == FeedbackType.Question),
                Critical = g.Count(f => f.Priority == FeedbackPriority.Critical),
                High = g.Count(f => f.Priority == FeedbackPriority.High)
            })
            .FirstOrDefaultAsync();

        return Ok(stats ?? new FeedbackStatsDto());
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
public class FeedbackDto
{
    public Guid Id { get; set; }
    public FeedbackType Type { get; set; }
    public FeedbackPriority Priority { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? PageUrl { get; set; }
    public string? StepsToReproduce { get; set; }
    public string? ExpectedBehavior { get; set; }
    public string? ActualBehavior { get; set; }
    public string? BrowserInfo { get; set; }
    public string? ScreenshotUrl { get; set; }
    public FeedbackStatus Status { get; set; }
    public string? AdminNotes { get; set; }
    public string? ExternalTicketId { get; set; }
    public string? ExternalTicketUrl { get; set; }
    public string? AiConversationHistory { get; set; }
    public string? RefinedRequirements { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class CreateFeedbackRequest
{
    public FeedbackType Type { get; set; }
    public FeedbackPriority Priority { get; set; } = FeedbackPriority.Medium;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PageUrl { get; set; }
    public string? StepsToReproduce { get; set; }
    public string? ExpectedBehavior { get; set; }
    public string? ActualBehavior { get; set; }
    public string? BrowserInfo { get; set; }
    public string? ScreenshotUrl { get; set; }
    public string? AiConversationHistory { get; set; }
    public string? RefinedRequirements { get; set; }
}

public class UpdateFeedbackRequest
{
    public FeedbackStatus? Status { get; set; }
    public FeedbackPriority? Priority { get; set; }
    public string? AdminNotes { get; set; }
    public string? ExternalTicketId { get; set; }
    public string? ExternalTicketUrl { get; set; }
}

public class UpdateAiConversationRequest
{
    public string? AiConversationHistory { get; set; }
    public string? RefinedRequirements { get; set; }
}

public class FeedbackStatsDto
{
    public int Total { get; set; }
    public int New { get; set; }
    public int UnderReview { get; set; }
    public int InProgress { get; set; }
    public int Resolved { get; set; }
    public int Closed { get; set; }
    public int Bugs { get; set; }
    public int Enhancements { get; set; }
    public int Questions { get; set; }
    public int Critical { get; set; }
    public int High { get; set; }
}
