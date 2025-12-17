using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MyScheduling.Api.Models;

namespace MyScheduling.Api.Controllers;

/// <summary>
/// Base controller for all authenticated endpoints that need to extract user information from JWT tokens.
/// Provides helper methods to access JWT claims in a consistent way across all controllers.
/// </summary>
public abstract class AuthorizedControllerBase : ControllerBase
{
    /// <summary>
    /// Gets the current authenticated user's ID from the JWT token.
    /// </summary>
    /// <returns>The user's GUID from the NameIdentifier claim</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown if the token is invalid or missing the user ID claim</exception>
    protected Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid authentication token - user ID not found");
        }
        return userId;
    }

    /// <summary>
    /// Gets the current authenticated user's email from the JWT token.
    /// </summary>
    /// <returns>The user's email from the Email claim</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown if the token is missing the email claim</exception>
    protected string GetCurrentUserEmail()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email))
        {
            throw new UnauthorizedAccessException("Invalid authentication token - email not found");
        }
        return email;
    }

    /// <summary>
    /// Gets the current authenticated user's display name from the JWT token.
    /// </summary>
    /// <returns>The user's display name from the Name claim</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown if the token is missing the name claim</exception>
    protected string GetCurrentUserDisplayName()
    {
        var displayName = User.FindFirst(ClaimTypes.Name)?.Value;
        if (string.IsNullOrEmpty(displayName))
        {
            throw new UnauthorizedAccessException("Invalid authentication token - display name not found");
        }
        return displayName;
    }

    /// <summary>
    /// Checks if the current authenticated user is a system administrator.
    /// </summary>
    /// <returns>True if the user has system admin privileges, false otherwise</returns>
    protected bool IsSystemAdmin()
    {
        var claim = User.FindFirst("IsSystemAdmin")?.Value;
        return bool.TryParse(claim, out var isAdmin) && isAdmin;
    }

    /// <summary>
    /// Gets all tenant IDs that the current user has access to.
    /// </summary>
    /// <returns>List of tenant GUIDs from TenantId claims</returns>
    protected List<Guid> GetUserTenantIds()
    {
        return User.FindAll("TenantId")
            .Select(c => Guid.TryParse(c.Value, out var tenantId) ? tenantId : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();
    }

    /// <summary>
    /// Gets all roles for a specific tenant that the current user has.
    /// </summary>
    /// <param name="tenantId">The tenant ID to get roles for</param>
    /// <returns>List of role names for the specified tenant</returns>
    protected List<string> GetUserRolesForTenant(Guid tenantId)
    {
        var claimName = $"Tenant_{tenantId}_Role";
        return User.FindAll(claimName)
            .Select(c => c.Value)
            .ToList();
    }

    /// <summary>
    /// Checks if the current user has access to a specific tenant.
    /// </summary>
    /// <param name="tenantId">The tenant ID to check access for</param>
    /// <returns>True if the user has access to the tenant, false otherwise</returns>
    protected bool HasAccessToTenant(Guid tenantId)
    {
        return IsSystemAdmin() || GetUserTenantIds().Contains(tenantId);
    }

    #region Error Response Helpers

    /// <summary>
    /// Gets the correlation ID from the current request.
    /// </summary>
    /// <returns>The correlation ID if present, null otherwise</returns>
    protected string? GetCorrelationId()
    {
        return HttpContext.Items.TryGetValue("CorrelationId", out var correlationId)
            ? correlationId?.ToString()
            : Request.Headers["X-Correlation-Id"].FirstOrDefault();
    }

    /// <summary>
    /// Creates a standardized error response with correlation ID.
    /// </summary>
    protected ApiErrorResponse CreateErrorResponse(string message, string? errorCode = null, object? details = null)
    {
        return new ApiErrorResponse
        {
            Message = message,
            ErrorCode = errorCode,
            CorrelationId = GetCorrelationId(),
            Details = details
        };
    }

    /// <summary>
    /// Returns a 500 Internal Server Error with standardized error response.
    /// </summary>
    protected ObjectResult InternalServerError(string message, string? errorCode = null)
    {
        return StatusCode(500, CreateErrorResponse(message, errorCode ?? ApiErrorCodes.InternalError));
    }

    /// <summary>
    /// Returns a 403 Forbidden with standardized error response and logs the authorization failure.
    /// </summary>
    protected ObjectResult ForbiddenWithLog(ILogger logger, string resource, string action, string? reason = null)
    {
        var userId = TryGetCurrentUserId();
        var correlationId = GetCorrelationId();

        logger.LogWarning(
            "Authorization denied: User {UserId} attempted {Action} on {Resource}. Reason: {Reason}. CorrelationId: {CorrelationId}",
            userId, action, resource, reason ?? "insufficient permissions", correlationId);

        return StatusCode(403, CreateErrorResponse(
            reason ?? "You do not have permission to perform this action",
            ApiErrorCodes.Forbidden));
    }

    /// <summary>
    /// Tries to get the current user ID without throwing an exception.
    /// </summary>
    /// <returns>The user ID if available, null otherwise</returns>
    protected Guid? TryGetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    #endregion
}
