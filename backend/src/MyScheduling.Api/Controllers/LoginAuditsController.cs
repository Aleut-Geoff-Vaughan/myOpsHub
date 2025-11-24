using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/login-audits")]
public class LoginAuditsController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<LoginAuditsController> _logger;

    public LoginAuditsController(MySchedulingDbContext context, ILogger<LoginAuditsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get login audit events with optional filters (system admin scope).
    /// </summary>
    [HttpGet]
    [RequiresPermission(Resource = "User", Action = PermissionAction.Read)]
    public async Task<ActionResult<object>> GetLogins(
        [FromQuery] string? email = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] bool? isSuccess = null,
        [FromQuery] DateTime? start = null,
        [FromQuery] DateTime? end = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        page = page < 1 ? 1 : page;
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _context.LoginAudits.AsQueryable();

        if (!string.IsNullOrWhiteSpace(email))
        {
            query = query.Where(l => l.Email != null && l.Email.Contains(email));
        }

        if (userId.HasValue)
        {
            query = query.Where(l => l.UserId == userId.Value);
        }

        if (isSuccess.HasValue)
        {
            query = query.Where(l => l.IsSuccess == isSuccess.Value);
        }

        if (start.HasValue)
        {
            query = query.Where(l => l.CreatedAt >= start.Value);
        }

        if (end.HasValue)
        {
            query = query.Where(l => l.CreatedAt <= end.Value);
        }

        var total = await query.CountAsync();
        var skip = (page - 1) * pageSize;
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();

        var successCount = await query.CountAsync(l => l.IsSuccess);
        var failedCount = total - successCount;

        return Ok(new
        {
            total,
            successCount,
            failedCount,
            page,
            pageSize,
            items = items.Select(l => new
            {
                l.Id,
                l.UserId,
                l.Email,
                l.IsSuccess,
                l.IpAddress,
                l.UserAgent,
                l.CreatedAt
            })
        });
    }
}
