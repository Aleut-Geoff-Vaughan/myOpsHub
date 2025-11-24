using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Core.Entities;
using MyScheduling.Infrastructure.Data;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Interfaces;

namespace MyScheduling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PeopleController : AuthorizedControllerBase
{
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<PeopleController> _logger;
    private readonly IAuthorizationService _authService;

    public PeopleController(
        MySchedulingDbContext context,
        ILogger<PeopleController> logger,
        IAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }


    // GET: api/people
    [HttpGet]
    [RequiresPermission(Resource = "User", Action = PermissionAction.Read)]
    public async Task<ActionResult<IEnumerable<User>>> GetPeople(
        [FromQuery] Guid? tenantId = null,
        [FromQuery] PersonStatus? status = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.Users.AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(u => _context.TenantMemberships.Any(tm => tm.UserId == u.Id && tm.TenantId == tenantId.Value && tm.IsActive));
            }

            if (status.HasValue)
            {
                query = query.Where(u => u.Status == status.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(u =>
                    u.DisplayName.Contains(search) ||
                    u.Email.Contains(search) ||
                    (u.JobTitle != null && u.JobTitle.Contains(search)));
            }

            var people = await query
                .OrderBy(p => p.DisplayName)
                .ToListAsync();

            return Ok(people);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving people");
            return StatusCode(500, "An error occurred while retrieving people");
        }
    }

    // GET: api/people/{id}
    [HttpGet("{id}")]
    [RequiresPermission(Resource = "User", Action = PermissionAction.Read)]
    public async Task<ActionResult<User>> GetPerson(Guid id)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Manager)
                .Include(u => u.TenantMemberships)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound($"User with ID {id} not found");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving person {PersonId}", id);
            return StatusCode(500, "An error occurred while retrieving the person");
        }
    }

    /// Get current user's person record
    /// <param name="userId">Current user's ID</param>
    /// <returns>Person record for the current user</returns>
    [HttpGet("me")]
    [RequiresPermission(Resource = "User", Action = PermissionAction.Read)]
    [ProducesResponseType(typeof(User), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<User>> GetCurrentPerson([FromQuery] Guid userId)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Manager)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                _logger.LogWarning("User record not found for user {UserId}", userId);
                return NotFound("User record not found for current user");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving person for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving the person");
        }
    }

    // NOTE: Person mutations are deprecated; use user-centric endpoints instead.

    // GET: api/people/{id}/resume
    [HttpGet("{id}/resume")]
    [RequiresPermission(Resource = "ResumeProfile", Action = PermissionAction.Read)]
    public async Task<ActionResult<ResumeProfile>> GetPersonResume(Guid id)
    {
        try
        {
            var resume = await _context.ResumeProfiles
                .FirstOrDefaultAsync(r => r.UserId == id);

            if (resume == null)
            {
                return NotFound($"Resume profile not found for user {id}");
            }

            return Ok(resume);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving resume for person {PersonId}", id);
            return StatusCode(500, "An error occurred while retrieving the resume");
        }
    }

}
