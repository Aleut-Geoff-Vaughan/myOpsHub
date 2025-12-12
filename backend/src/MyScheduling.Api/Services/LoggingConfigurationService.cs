using Serilog.Core;
using Serilog.Events;

namespace MyScheduling.Api.Services;

/// <summary>
/// Service for runtime configuration of logging levels.
/// Allows administrators to toggle verbose/debug logging without restarting the application.
/// </summary>
public interface ILoggingConfigurationService
{
    LoggingConfiguration GetCurrentConfiguration();
    void SetMinimumLevel(LogEventLevel level);
    void EnableVerboseMode();
    void DisableVerboseMode();
    bool IsVerboseEnabled { get; }
}

public class LoggingConfigurationService : ILoggingConfigurationService
{
    private readonly LoggingLevelSwitch _levelSwitch;
    private readonly ILogger<LoggingConfigurationService> _logger;
    private bool _isVerboseEnabled;
    private LogEventLevel _previousLevel;

    public LoggingConfigurationService(LoggingLevelSwitch levelSwitch, ILogger<LoggingConfigurationService> logger)
    {
        _levelSwitch = levelSwitch;
        _logger = logger;
        _previousLevel = LogEventLevel.Information;
    }

    public bool IsVerboseEnabled => _isVerboseEnabled;

    public LoggingConfiguration GetCurrentConfiguration()
    {
        return new LoggingConfiguration
        {
            CurrentLevel = _levelSwitch.MinimumLevel.ToString(),
            IsVerboseMode = _isVerboseEnabled,
            AvailableLevels = Enum.GetNames<LogEventLevel>().ToArray()
        };
    }

    public void SetMinimumLevel(LogEventLevel level)
    {
        var previousLevel = _levelSwitch.MinimumLevel;
        _levelSwitch.MinimumLevel = level;
        _isVerboseEnabled = level <= LogEventLevel.Debug;

        _logger.LogInformation(
            "Log level changed from {PreviousLevel} to {NewLevel}",
            previousLevel,
            level);
    }

    public void EnableVerboseMode()
    {
        if (!_isVerboseEnabled)
        {
            _previousLevel = _levelSwitch.MinimumLevel;
            _levelSwitch.MinimumLevel = LogEventLevel.Verbose;
            _isVerboseEnabled = true;

            _logger.LogInformation(
                "Verbose logging enabled. Previous level was {PreviousLevel}",
                _previousLevel);
        }
    }

    public void DisableVerboseMode()
    {
        if (_isVerboseEnabled)
        {
            _levelSwitch.MinimumLevel = _previousLevel;
            _isVerboseEnabled = false;

            _logger.LogInformation(
                "Verbose logging disabled. Restored level to {RestoredLevel}",
                _previousLevel);
        }
    }
}

public class LoggingConfiguration
{
    public string CurrentLevel { get; set; } = "Information";
    public bool IsVerboseMode { get; set; }
    public string[] AvailableLevels { get; set; } = Array.Empty<string>();
}
