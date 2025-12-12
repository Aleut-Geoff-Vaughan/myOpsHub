using System.Diagnostics;
using Serilog.Context;

namespace MyScheduling.Api.Middleware;

/// <summary>
/// Enhanced request logging middleware that captures timing, user context, and request details.
/// This provides structured logging for all API requests with timing information.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    // Endpoints to exclude from detailed logging
    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/health",
        "/api/health",
        "/swagger",
        "/favicon.ico"
    };

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip logging for excluded paths
        var path = context.Request.Path.Value ?? "";
        if (ExcludedPaths.Any(excluded => path.StartsWith(excluded, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();

        // Extract user info from JWT claims if available
        var userId = context.User?.FindFirst("UserId")?.Value;
        var userEmail = context.User?.FindFirst("Email")?.Value ??
                       context.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault() ??
                      context.User?.FindFirst("TenantId")?.Value;

        // Push user context to Serilog
        using (LogContext.PushProperty("UserId", userId ?? "anonymous"))
        using (LogContext.PushProperty("UserEmail", userEmail ?? "anonymous"))
        using (LogContext.PushProperty("TenantId", tenantId ?? "none"))
        using (LogContext.PushProperty("ClientIp", GetClientIp(context)))
        {
            try
            {
                await _next(context);

                stopwatch.Stop();

                var level = context.Response.StatusCode >= 500
                    ? LogLevel.Error
                    : context.Response.StatusCode >= 400
                        ? LogLevel.Warning
                        : LogLevel.Information;

                _logger.Log(level,
                    "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                    context.Request.Method,
                    path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                _logger.LogError(ex,
                    "HTTP {Method} {Path} failed after {ElapsedMs}ms",
                    context.Request.Method,
                    path,
                    stopwatch.ElapsedMilliseconds);

                throw;
            }
        }
    }

    private static string GetClientIp(HttpContext context)
    {
        // Check X-Forwarded-For header first (for reverse proxy scenarios)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            // Take the first IP if there are multiple
            return forwardedFor.Split(',')[0].Trim();
        }

        // Check X-Real-IP header
        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        // Fall back to connection remote IP
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

/// <summary>
/// Extension methods for RequestLoggingMiddleware
/// </summary>
public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestLoggingMiddleware>();
    }
}
