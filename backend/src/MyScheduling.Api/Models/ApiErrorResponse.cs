namespace MyScheduling.Api.Models;

/// <summary>
/// Standardized error response format for API endpoints.
/// Provides consistent error structure with correlation ID for troubleshooting.
/// </summary>
public class ApiErrorResponse
{
    /// <summary>
    /// Human-readable error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Correlation ID for tracing the request across services
    /// </summary>
    public string? CorrelationId { get; set; }

    /// <summary>
    /// Machine-readable error code for programmatic handling
    /// </summary>
    public string? ErrorCode { get; set; }

    /// <summary>
    /// Additional error details (validation errors, nested errors, etc.)
    /// </summary>
    public object? Details { get; set; }

    /// <summary>
    /// Timestamp when the error occurred
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Create a simple error response
    /// </summary>
    public static ApiErrorResponse Create(string message, string? correlationId = null)
    {
        return new ApiErrorResponse
        {
            Message = message,
            CorrelationId = correlationId
        };
    }

    /// <summary>
    /// Create an error response with error code
    /// </summary>
    public static ApiErrorResponse Create(string message, string errorCode, string? correlationId = null)
    {
        return new ApiErrorResponse
        {
            Message = message,
            ErrorCode = errorCode,
            CorrelationId = correlationId
        };
    }

    /// <summary>
    /// Create an error response with details
    /// </summary>
    public static ApiErrorResponse Create(string message, string? correlationId, object? details)
    {
        return new ApiErrorResponse
        {
            Message = message,
            CorrelationId = correlationId,
            Details = details
        };
    }
}

/// <summary>
/// Common error codes for consistent API error handling
/// </summary>
public static class ApiErrorCodes
{
    // Authentication/Authorization
    public const string Unauthorized = "AUTH_UNAUTHORIZED";
    public const string Forbidden = "AUTH_FORBIDDEN";
    public const string TokenExpired = "AUTH_TOKEN_EXPIRED";
    public const string InvalidCredentials = "AUTH_INVALID_CREDENTIALS";

    // Validation
    public const string ValidationFailed = "VALIDATION_FAILED";
    public const string InvalidInput = "VALIDATION_INVALID_INPUT";
    public const string MissingRequired = "VALIDATION_MISSING_REQUIRED";

    // Resource
    public const string NotFound = "RESOURCE_NOT_FOUND";
    public const string Conflict = "RESOURCE_CONFLICT";
    public const string AlreadyExists = "RESOURCE_ALREADY_EXISTS";

    // Server
    public const string InternalError = "SERVER_INTERNAL_ERROR";
    public const string ServiceUnavailable = "SERVER_SERVICE_UNAVAILABLE";
    public const string Timeout = "SERVER_TIMEOUT";

    // File operations
    public const string FileTooLarge = "FILE_TOO_LARGE";
    public const string FileTypeNotAllowed = "FILE_TYPE_NOT_ALLOWED";
    public const string FileUploadFailed = "FILE_UPLOAD_FAILED";

    // Tenant
    public const string InvalidTenant = "TENANT_INVALID";
    public const string TenantAccessDenied = "TENANT_ACCESS_DENIED";
}
