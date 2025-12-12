using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyScheduling.Api.Attributes;
using MyScheduling.Api.Services;
using MyScheduling.Core.Entities;
using Serilog.Events;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Controller for runtime logging configuration.
/// Allows administrators to view and modify logging levels without restarting the application.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoggingController : ControllerBase
{
    private readonly ILoggingConfigurationService _loggingService;
    private readonly ILogger<LoggingController> _logger;

    public LoggingController(
        ILoggingConfigurationService loggingService,
        ILogger<LoggingController> logger)
    {
        _loggingService = loggingService;
        _logger = logger;
    }

    /// <summary>
    /// Get the current logging configuration
    /// </summary>
    [HttpGet("config")]
    [RequiresPermission(Resource = "Settings", Action = PermissionAction.Read)]
    public ActionResult<LoggingConfiguration> GetConfiguration()
    {
        return Ok(_loggingService.GetCurrentConfiguration());
    }

    /// <summary>
    /// Set the minimum log level
    /// </summary>
    [HttpPost("level")]
    [RequiresPermission(Resource = "Settings", Action = PermissionAction.Update)]
    public IActionResult SetLogLevel([FromBody] SetLogLevelRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Level))
        {
            return BadRequest(new { message = "Log level is required" });
        }

        if (!Enum.TryParse<LogEventLevel>(request.Level, ignoreCase: true, out var level))
        {
            return BadRequest(new { message = $"Invalid log level: {request.Level}. Valid levels: Verbose, Debug, Information, Warning, Error, Fatal" });
        }

        var userEmail = User.FindFirst("Email")?.Value ?? "unknown";
        _logger.LogWarning("Log level changed to {Level} by {UserEmail}", level, userEmail);

        _loggingService.SetMinimumLevel(level);

        return Ok(new { message = $"Log level set to {level}", level = level.ToString() });
    }

    /// <summary>
    /// Enable verbose/debug mode
    /// </summary>
    [HttpPost("verbose/enable")]
    [RequiresPermission(Resource = "Settings", Action = PermissionAction.Update)]
    public IActionResult EnableVerbose()
    {
        var userEmail = User.FindFirst("Email")?.Value ?? "unknown";
        _logger.LogWarning("Verbose logging enabled by {UserEmail}", userEmail);

        _loggingService.EnableVerboseMode();

        return Ok(new { message = "Verbose logging enabled", isVerbose = true });
    }

    /// <summary>
    /// Disable verbose/debug mode
    /// </summary>
    [HttpPost("verbose/disable")]
    [RequiresPermission(Resource = "Settings", Action = PermissionAction.Update)]
    public IActionResult DisableVerbose()
    {
        var userEmail = User.FindFirst("Email")?.Value ?? "unknown";
        _logger.LogWarning("Verbose logging disabled by {UserEmail}", userEmail);

        _loggingService.DisableVerboseMode();

        return Ok(new { message = "Verbose logging disabled", isVerbose = false });
    }

    /// <summary>
    /// Write a test log entry at each level (for verification)
    /// </summary>
    [HttpPost("test")]
    [RequiresPermission(Resource = "Settings", Action = PermissionAction.Update)]
    public IActionResult TestLogging()
    {
        var userEmail = User.FindFirst("Email")?.Value ?? "unknown";

        _logger.LogTrace("Test TRACE log entry triggered by {UserEmail}", userEmail);
        _logger.LogDebug("Test DEBUG log entry triggered by {UserEmail}", userEmail);
        _logger.LogInformation("Test INFO log entry triggered by {UserEmail}", userEmail);
        _logger.LogWarning("Test WARNING log entry triggered by {UserEmail}", userEmail);
        _logger.LogError("Test ERROR log entry triggered by {UserEmail}", userEmail);

        return Ok(new
        {
            message = "Test log entries written at all levels",
            timestamp = DateTime.UtcNow,
            triggeredBy = userEmail
        });
    }
}

public class SetLogLevelRequest
{
    public string Level { get; set; } = string.Empty;
}
