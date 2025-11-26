using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Development-only controller for database seeding operations
/// </summary>
[ApiController]
[Route("api/dev/[controller]")]
public class DevSeedController : ControllerBase
{
    private readonly DatabaseSeeder _seeder;
    private readonly MySchedulingDbContext _context;
    private readonly ILogger<DevSeedController> _logger;
    private readonly IWebHostEnvironment _environment;

    public DevSeedController(
        DatabaseSeeder seeder,
        MySchedulingDbContext context,
        ILogger<DevSeedController> logger,
        IWebHostEnvironment environment)
    {
        _seeder = seeder;
        _context = context;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Clear all data from the database
    /// Only available in Development environment
    /// </summary>
    [HttpPost("clear")]
    public async Task<IActionResult> ClearDatabase()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("Database clearing is only available in Development environment");
        }

        try
        {
            _logger.LogInformation("Clearing database via API endpoint");

            // Delete all data in reverse dependency order
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE bookings CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE work_location_preferences CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE work_location_templates CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE company_holidays CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE assignments CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE assignment_requests CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE project_assignments CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE project_roles CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE wbs_change_history CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE wbs_elements CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE projects CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE spaces CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE offices CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE tenant_memberships CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE group_memberships CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE groups CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE delegation_of_authority CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE resume_approvals CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE resume_sections CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE resume_profiles CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE resume_templates CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE user_invitations CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE users CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE tenants CASCADE");
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE login_audits CASCADE");

            _logger.LogInformation("Database cleared successfully");
            return Ok(new { message = "Database cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing database");
            return StatusCode(500, new { message = "Database clearing failed", error = ex.Message });
        }
    }

    /// <summary>
    /// Trigger database seeding
    /// Only available in Development environment
    /// </summary>
    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("Seeding is only available in Development environment");
        }

        try
        {
            _logger.LogInformation("Manual seed triggered via API endpoint");
            await _seeder.SeedAsync();
            return Ok(new { message = "Database seeding completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual seeding");
            return StatusCode(500, new { message = "Seeding failed", error = ex.Message });
        }
    }

    /// <summary>
    /// Clear and reseed the database
    /// Only available in Development environment
    /// </summary>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetDatabase()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("Database reset is only available in Development environment");
        }

        try
        {
            _logger.LogInformation("Resetting database (clear + seed) via API endpoint");

            // Clear first
            await ClearDatabase();

            // Then seed
            await _seeder.SeedAsync();

            return Ok(new { message = "Database reset completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during database reset");
            return StatusCode(500, new { message = "Database reset failed", error = ex.Message });
        }
    }

    /// <summary>
    /// View seed data stats
    /// Only available in Development environment
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetSeedStats()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("Seed stats are only available in Development environment");
        }

        try
        {
            var projects = await _context.Projects.Take(5).Select(p => new
            {
                p.Name,
                p.ProgramCode,
                p.StartDate,
                p.EndDate,
                p.Status
            }).ToListAsync();

            var wbs = await _context.WbsElements.Take(5).Select(w => new
            {
                w.Code,
                w.Description,
                w.ValidFrom,
                w.ValidTo,
                w.StartDate,
                w.EndDate,
                w.Type,
                w.Status
            }).ToListAsync();

            var stats = new
            {
                TenantCount = await _context.Tenants.CountAsync(),
                UserCount = await _context.Users.CountAsync(),
                ProjectCount = await _context.Projects.CountAsync(),
                WbsCount = await _context.WbsElements.CountAsync(),
                AssignmentCount = await _context.Assignments.CountAsync(),
                SampleProjects = projects,
                SampleWbs = wbs
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting seed stats");
            return StatusCode(500, new { message = "Failed to get stats", error = ex.Message });
        }
    }
}
