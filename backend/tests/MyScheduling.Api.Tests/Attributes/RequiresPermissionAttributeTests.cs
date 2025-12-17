using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Moq;
using MyScheduling.Api.Attributes;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;

namespace MyScheduling.Api.Tests.Attributes;

public class RequiresPermissionAttributeTests
{
    private readonly Mock<IAuthorizationService> _authServiceMock;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _tenantId = Guid.NewGuid();

    public RequiresPermissionAttributeTests()
    {
        _authServiceMock = new Mock<IAuthorizationService>();
    }

    private AuthorizationFilterContext CreateFilterContext(
        ClaimsPrincipal? user = null,
        Dictionary<string, object>? routeValues = null,
        Dictionary<string, string>? headers = null)
    {
        var httpContext = new DefaultHttpContext();

        if (user != null)
        {
            httpContext.User = user;
        }

        if (headers != null)
        {
            foreach (var header in headers)
            {
                httpContext.Request.Headers[header.Key] = header.Value;
            }
        }

        // Register the mock authorization service
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider
            .Setup(sp => sp.GetService(typeof(IAuthorizationService)))
            .Returns(_authServiceMock.Object);
        httpContext.RequestServices = serviceProvider.Object;

        var actionContext = new ActionContext(
            httpContext,
            new RouteData(new RouteValueDictionary(routeValues ?? new Dictionary<string, object>())),
            new ActionDescriptor());

        return new AuthorizationFilterContext(
            actionContext,
            new List<IFilterMetadata>());
    }

    private ClaimsPrincipal CreateUserWithClaims(
        Guid? userId = null,
        List<Guid>? tenantIds = null,
        bool isImpersonating = false,
        Guid? originalUserId = null)
    {
        var claims = new List<Claim>();

        if (userId.HasValue)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
        }

        if (tenantIds != null)
        {
            foreach (var tid in tenantIds)
            {
                claims.Add(new Claim("TenantId", tid.ToString()));
            }
        }

        if (isImpersonating)
        {
            claims.Add(new Claim("IsImpersonating", "true"));
            if (originalUserId.HasValue)
            {
                claims.Add(new Claim("OriginalUserId", originalUserId.Value.ToString()));
            }
        }

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenNoAuthService_Returns500()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read);
        var httpContext = new DefaultHttpContext();

        // Setup service provider WITHOUT the authorization service
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(sp => sp.GetService(typeof(IAuthorizationService))).Returns(null!);
        httpContext.RequestServices = serviceProvider.Object;

        var context = new AuthorizationFilterContext(
            new ActionContext(httpContext, new RouteData(), new ActionDescriptor()),
            new List<IFilterMetadata>());

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        var result = context.Result.Should().BeOfType<StatusCodeResult>().Subject;
        result.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenNoUserId_ReturnsUnauthorized()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read);
        var user = new ClaimsPrincipal(new ClaimsIdentity()); // No claims
        var context = CreateFilterContext(user);

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        var result = context.Result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        result.Value.Should().BeEquivalentTo(new { error = "User ID not found in token" });
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenAuthorized_AllowsAccess()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read);
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, _tenantId))
            .ReturnsAsync(AuthorizationResult.Allow(PermissionScope.Tenant));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull(); // No result means continue to action
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenNotAuthorized_Returns403()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Update);
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Update, null, _tenantId))
            .ReturnsAsync(AuthorizationResult.Deny("No permission"));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        var result = context.Result.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenPlatformAdmin_AllowsAccessEvenIfNotAuthorized()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Delete)
        {
            AllowPlatformAdmin = true
        };
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        var result = AuthorizationResult.Deny("No permission");
        result.IsPlatformAdmin = true;

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Delete, null, _tenantId))
            .ReturnsAsync(result);

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull(); // Allowed
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenTenantAdmin_AllowsAccessEvenIfNotAuthorized()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Delete)
        {
            AllowTenantAdmin = true
        };
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        var result = AuthorizationResult.Deny("No permission");
        result.IsTenantAdmin = true;

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Delete, null, _tenantId))
            .ReturnsAsync(result);

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull(); // Allowed
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenPlatformAdminDisabled_DeniesAccess()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Delete)
        {
            AllowPlatformAdmin = false
        };
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        var result = AuthorizationResult.Deny("No permission");
        result.IsPlatformAdmin = true;

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Delete, null, _tenantId))
            .ReturnsAsync(result);

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        var objectResult = context.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task OnAuthorizationAsync_UsesXTenantIdHeader_WhenProvided()
    {
        // Arrange
        var headerTenantId = Guid.NewGuid();
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read);
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId, headerTenantId });
        var context = CreateFilterContext(
            user,
            headers: new Dictionary<string, string> { { "X-Tenant-Id", headerTenantId.ToString() } });

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, headerTenantId))
            .ReturnsAsync(AuthorizationResult.Allow(PermissionScope.Tenant));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull();
        _authServiceMock.Verify(
            s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, headerTenantId),
            Times.Once);
    }

    [Fact]
    public async Task OnAuthorizationAsync_IgnoresXTenantIdHeader_WhenUserDoesNotHaveAccess()
    {
        // Arrange
        var headerTenantId = Guid.NewGuid();
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read);
        // User does NOT have headerTenantId in their claims
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(
            user,
            headers: new Dictionary<string, string> { { "X-Tenant-Id", headerTenantId.ToString() } });

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, _tenantId))
            .ReturnsAsync(AuthorizationResult.Allow(PermissionScope.Tenant));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        // Should fall back to first tenant ID from claims since header tenant is not in user's tenants
        _authServiceMock.Verify(
            s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, _tenantId),
            Times.Once);
    }

    [Fact]
    public async Task OnAuthorizationAsync_ExtractsResourceId_FromRoute()
    {
        // Arrange
        var resourceId = Guid.NewGuid();
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Update);
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(
            user,
            routeValues: new Dictionary<string, object> { { "id", resourceId.ToString() } });

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Update, resourceId, _tenantId))
            .ReturnsAsync(AuthorizationResult.Allow(PermissionScope.Individual));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull();
        _authServiceMock.Verify(
            s => s.CheckAsync(_userId, "TestResource", PermissionAction.Update, resourceId, _tenantId),
            Times.Once);
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenImpersonating_AllowsIfOriginalUserIsPlatformAdmin()
    {
        // Arrange
        var originalAdminId = Guid.NewGuid();
        var impersonatedUserId = Guid.NewGuid();
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read)
        {
            AllowPlatformAdmin = true
        };
        var user = CreateUserWithClaims(
            impersonatedUserId,
            new List<Guid> { _tenantId },
            isImpersonating: true,
            originalUserId: originalAdminId);
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.IsPlatformAdminAsync(originalAdminId))
            .ReturnsAsync(true);

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull(); // Allowed
        _authServiceMock.Verify(s => s.IsPlatformAdminAsync(originalAdminId), Times.Once);
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenImpersonating_DeniesIfOriginalUserIsNotAdmin()
    {
        // Arrange
        var originalUserId = Guid.NewGuid();
        var impersonatedUserId = Guid.NewGuid();
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Delete);
        var user = CreateUserWithClaims(
            impersonatedUserId,
            new List<Guid> { _tenantId },
            isImpersonating: true,
            originalUserId: originalUserId);
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.IsPlatformAdminAsync(originalUserId))
            .ReturnsAsync(false);

        _authServiceMock
            .Setup(s => s.CheckAsync(impersonatedUserId, "TestResource", PermissionAction.Delete, null, _tenantId))
            .ReturnsAsync(AuthorizationResult.Deny("No permission"));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        var result = context.Result.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task OnAuthorizationAsync_WhenAuthServiceThrows_Returns500()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read);
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, _tenantId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        var result = context.Result.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task OnAuthorizationAsync_SetsDenialReasonHeader_OnForbidden()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Update);
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Update, null, _tenantId))
            .ReturnsAsync(AuthorizationResult.Deny("Custom denial reason"));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.HttpContext.Response.Headers["X-Denial-Reason"].ToString().Should().Be("Custom denial reason");
    }

    [Fact]
    public void Constructor_WithParameters_SetsProperties()
    {
        // Arrange & Act
        var attribute = new RequiresPermissionAttribute("MyResource", PermissionAction.Create);

        // Assert
        attribute.Resource.Should().Be("MyResource");
        attribute.Action.Should().Be(PermissionAction.Create);
        attribute.AllowPlatformAdmin.Should().BeTrue(); // Default
        attribute.AllowTenantAdmin.Should().BeTrue(); // Default
    }

    [Fact]
    public async Task OnAuthorizationAsync_WithSubjectClaim_ExtractsUserId()
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", PermissionAction.Read);

        // Create user with 'sub' claim instead of NameIdentifier
        var claims = new List<Claim>
        {
            new Claim("sub", _userId.ToString()),
            new Claim("TenantId", _tenantId.ToString())
        };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, _tenantId))
            .ReturnsAsync(AuthorizationResult.Allow(PermissionScope.Tenant));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull();
        _authServiceMock.Verify(
            s => s.CheckAsync(_userId, "TestResource", PermissionAction.Read, null, _tenantId),
            Times.Once);
    }

    [Theory]
    [InlineData(PermissionAction.Create)]
    [InlineData(PermissionAction.Read)]
    [InlineData(PermissionAction.Update)]
    [InlineData(PermissionAction.Delete)]
    public async Task OnAuthorizationAsync_WorksWithAllPermissionActions(PermissionAction action)
    {
        // Arrange
        var attribute = new RequiresPermissionAttribute("TestResource", action);
        var user = CreateUserWithClaims(_userId, new List<Guid> { _tenantId });
        var context = CreateFilterContext(user);

        _authServiceMock
            .Setup(s => s.CheckAsync(_userId, "TestResource", action, null, _tenantId))
            .ReturnsAsync(AuthorizationResult.Allow(PermissionScope.Tenant));

        // Act
        await attribute.OnAuthorizationAsync(context);

        // Assert
        context.Result.Should().BeNull();
    }
}
