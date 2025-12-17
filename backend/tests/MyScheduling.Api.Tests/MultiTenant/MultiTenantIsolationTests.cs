using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MyScheduling.Api.Controllers;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;
using System.Security.Claims;

namespace MyScheduling.Api.Tests.MultiTenant;

/// <summary>
/// Tests for multi-tenant data isolation to ensure users cannot access data from other tenants
/// </summary>
public class MultiTenantIsolationTests : IDisposable
{
    private readonly MySchedulingDbContext _context;
    private readonly Guid _tenant1Id = Guid.NewGuid();
    private readonly Guid _tenant2Id = Guid.NewGuid();
    private readonly Guid _user1Id = Guid.NewGuid(); // User in tenant 1
    private readonly Guid _user2Id = Guid.NewGuid(); // User in tenant 2
    private readonly Guid _multiTenantUserId = Guid.NewGuid(); // User in both tenants

    public MultiTenantIsolationTests()
    {
        var options = new DbContextOptionsBuilder<MySchedulingDbContext>()
            .UseInMemoryDatabase(databaseName: $"MultiTenantTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new MySchedulingDbContext(options);
        SeedTestData();
    }

    private void SeedTestData()
    {
        // Create two tenants
        var tenant1 = new Tenant
        {
            Id = _tenant1Id,
            Name = "Tenant One",
            Status = TenantStatus.Active
        };
        var tenant2 = new Tenant
        {
            Id = _tenant2Id,
            Name = "Tenant Two",
            Status = TenantStatus.Active
        };
        _context.Tenants.AddRange(tenant1, tenant2);

        // Create users
        var user1 = new User
        {
            Id = _user1Id,
            Email = "user1@tenant1.com",
            DisplayName = "User One",
            IsActive = true
        };
        var user2 = new User
        {
            Id = _user2Id,
            Email = "user2@tenant2.com",
            DisplayName = "User Two",
            IsActive = true
        };
        var multiTenantUser = new User
        {
            Id = _multiTenantUserId,
            Email = "multi@company.com",
            DisplayName = "Multi Tenant User",
            IsActive = true
        };
        _context.Users.AddRange(user1, user2, multiTenantUser);
        _context.SaveChanges();

        // Create tenant memberships
        _context.TenantMemberships.AddRange(
            new TenantMembership
            {
                Id = Guid.NewGuid(),
                UserId = _user1Id,
                TenantId = _tenant1Id,
                IsActive = true,
                Roles = new List<AppRole> { AppRole.Employee }
            },
            new TenantMembership
            {
                Id = Guid.NewGuid(),
                UserId = _user2Id,
                TenantId = _tenant2Id,
                IsActive = true,
                Roles = new List<AppRole> { AppRole.Employee }
            },
            new TenantMembership
            {
                Id = Guid.NewGuid(),
                UserId = _multiTenantUserId,
                TenantId = _tenant1Id,
                IsActive = true,
                Roles = new List<AppRole> { AppRole.TenantAdmin }
            },
            new TenantMembership
            {
                Id = Guid.NewGuid(),
                UserId = _multiTenantUserId,
                TenantId = _tenant2Id,
                IsActive = true,
                Roles = new List<AppRole> { AppRole.Employee }
            }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region AuthorizedControllerBase Tests

    [Fact]
    public void GetUserTenantIds_ReturnsAllTenantIds_ForMultiTenantUser()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _multiTenantUserId.ToString()),
            new Claim("TenantId", _tenant1Id.ToString()),
            new Claim("TenantId", _tenant2Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var tenantIds = controller.TestGetUserTenantIds();

        // Assert
        tenantIds.Should().HaveCount(2);
        tenantIds.Should().Contain(_tenant1Id);
        tenantIds.Should().Contain(_tenant2Id);
    }

    [Fact]
    public void GetUserTenantIds_ReturnsSingleTenantId_ForSingleTenantUser()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var tenantIds = controller.TestGetUserTenantIds();

        // Assert
        tenantIds.Should().HaveCount(1);
        tenantIds.Should().Contain(_tenant1Id);
    }

    [Fact]
    public void GetUserTenantIds_ReturnsEmptyList_WhenNoTenantClaims()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var tenantIds = controller.TestGetUserTenantIds();

        // Assert
        tenantIds.Should().BeEmpty();
    }

    [Fact]
    public void HasAccessToTenant_ReturnsTrue_ForUsersTenant()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var hasAccess = controller.TestHasAccessToTenant(_tenant1Id);

        // Assert
        hasAccess.Should().BeTrue();
    }

    [Fact]
    public void HasAccessToTenant_ReturnsFalse_ForOtherTenant()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var hasAccess = controller.TestHasAccessToTenant(_tenant2Id);

        // Assert
        hasAccess.Should().BeFalse();
    }

    [Fact]
    public void HasAccessToTenant_ReturnsTrue_ForSystemAdmin()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("IsSystemAdmin", "true"),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act - System admin should have access to any tenant
        var hasAccess = controller.TestHasAccessToTenant(_tenant2Id);

        // Assert
        hasAccess.Should().BeTrue();
    }

    [Fact]
    public void GetUserRolesForTenant_ReturnsCorrectRoles()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _multiTenantUserId.ToString()),
            new Claim("TenantId", _tenant1Id.ToString()),
            new Claim("TenantId", _tenant2Id.ToString()),
            new Claim($"Tenant_{_tenant1Id}_Role", "TenantAdmin"),
            new Claim($"Tenant_{_tenant1Id}_Role", "Employee"),
            new Claim($"Tenant_{_tenant2Id}_Role", "Employee")
        };
        var controller = CreateTestController(claims);

        // Act
        var tenant1Roles = controller.TestGetUserRolesForTenant(_tenant1Id);
        var tenant2Roles = controller.TestGetUserRolesForTenant(_tenant2Id);

        // Assert
        tenant1Roles.Should().HaveCount(2);
        tenant1Roles.Should().Contain("TenantAdmin");
        tenant1Roles.Should().Contain("Employee");

        tenant2Roles.Should().HaveCount(1);
        tenant2Roles.Should().Contain("Employee");
    }

    [Fact]
    public void GetCurrentUserId_ReturnsUserId_FromNameIdentifierClaim()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var userId = controller.TestGetCurrentUserId();

        // Assert
        userId.Should().Be(_user1Id);
    }

    [Fact]
    public void GetCurrentUserId_ThrowsUnauthorizedException_WhenNoUserIdClaim()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act & Assert
        var action = () => controller.TestGetCurrentUserId();
        action.Should().Throw<UnauthorizedAccessException>()
            .WithMessage("*user ID*");
    }

    [Fact]
    public void IsSystemAdmin_ReturnsTrue_WhenIsSystemAdminClaimIsTrue()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("IsSystemAdmin", "true")
        };
        var controller = CreateTestController(claims);

        // Act
        var isAdmin = controller.TestIsSystemAdmin();

        // Assert
        isAdmin.Should().BeTrue();
    }

    [Fact]
    public void IsSystemAdmin_ReturnsFalse_WhenIsSystemAdminClaimIsFalse()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("IsSystemAdmin", "false")
        };
        var controller = CreateTestController(claims);

        // Act
        var isAdmin = controller.TestIsSystemAdmin();

        // Assert
        isAdmin.Should().BeFalse();
    }

    [Fact]
    public void IsSystemAdmin_ReturnsFalse_WhenNoIsSystemAdminClaim()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var isAdmin = controller.TestIsSystemAdmin();

        // Assert
        isAdmin.Should().BeFalse();
    }

    #endregion

    #region X-Tenant-Id Header Tests

    [Fact]
    public void GetCurrentTenantId_ReturnsHeaderTenantId_WhenValidHeaderProvided()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _multiTenantUserId.ToString()),
            new Claim("TenantId", _tenant1Id.ToString()),
            new Claim("TenantId", _tenant2Id.ToString())
        };
        var headers = new Dictionary<string, string>
        {
            { "X-Tenant-Id", _tenant2Id.ToString() }
        };
        var controller = CreateTestControllerWithTenantIdHelper(claims, headers);

        // Act
        var tenantId = controller.TestGetCurrentTenantId();

        // Assert
        tenantId.Should().Be(_tenant2Id);
    }

    [Fact]
    public void GetCurrentTenantId_IgnoresHeaderTenantId_WhenUserHasNoAccessToTenant()
    {
        // Arrange - User1 only has access to Tenant1
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var headers = new Dictionary<string, string>
        {
            { "X-Tenant-Id", _tenant2Id.ToString() } // Try to access Tenant2
        };
        var controller = CreateTestControllerWithTenantIdHelper(claims, headers);

        // Act
        var tenantId = controller.TestGetCurrentTenantId();

        // Assert - Should fallback to user's tenant, not the header value
        tenantId.Should().Be(_tenant1Id);
    }

    [Fact]
    public void GetCurrentTenantId_FallsBackToFirstTenantClaim_WhenNoHeader()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestControllerWithTenantIdHelper(claims, new Dictionary<string, string>());

        // Act
        var tenantId = controller.TestGetCurrentTenantId();

        // Assert
        tenantId.Should().Be(_tenant1Id);
    }

    [Fact]
    public void GetCurrentTenantId_ReturnsNull_WhenNoTenantClaimsAndNoHeader()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString())
        };
        var controller = CreateTestControllerWithTenantIdHelper(claims, new Dictionary<string, string>());

        // Act
        var tenantId = controller.TestGetCurrentTenantId();

        // Assert
        tenantId.Should().BeNull();
    }

    [Fact]
    public void GetCurrentTenantId_IgnoresInvalidGuidInHeader()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var headers = new Dictionary<string, string>
        {
            { "X-Tenant-Id", "not-a-valid-guid" }
        };
        var controller = CreateTestControllerWithTenantIdHelper(claims, headers);

        // Act
        var tenantId = controller.TestGetCurrentTenantId();

        // Assert - Should fallback to claims
        tenantId.Should().Be(_tenant1Id);
    }

    #endregion

    #region Data Isolation Tests

    [Fact]
    public async Task TenantMembershipQuery_OnlyReturnsActiveMembers_ForSpecificTenant()
    {
        // Arrange & Act
        var tenant1Members = await _context.TenantMemberships
            .Where(tm => tm.TenantId == _tenant1Id && tm.IsActive)
            .Select(tm => tm.UserId)
            .ToListAsync();

        var tenant2Members = await _context.TenantMemberships
            .Where(tm => tm.TenantId == _tenant2Id && tm.IsActive)
            .Select(tm => tm.UserId)
            .ToListAsync();

        // Assert
        tenant1Members.Should().Contain(_user1Id);
        tenant1Members.Should().Contain(_multiTenantUserId);
        tenant1Members.Should().NotContain(_user2Id);

        tenant2Members.Should().Contain(_user2Id);
        tenant2Members.Should().Contain(_multiTenantUserId);
        tenant2Members.Should().NotContain(_user1Id);
    }

    [Fact]
    public async Task UserCanAccessOnlyTheirTenants()
    {
        // Arrange
        var userTenants = await _context.TenantMemberships
            .Where(tm => tm.UserId == _user1Id && tm.IsActive)
            .Select(tm => tm.TenantId)
            .ToListAsync();

        // Act & Assert
        userTenants.Should().HaveCount(1);
        userTenants.Should().Contain(_tenant1Id);
        userTenants.Should().NotContain(_tenant2Id);
    }

    [Fact]
    public async Task MultiTenantUserCanAccessAllTheirTenants()
    {
        // Arrange
        var userTenants = await _context.TenantMemberships
            .Where(tm => tm.UserId == _multiTenantUserId && tm.IsActive)
            .Select(tm => tm.TenantId)
            .ToListAsync();

        // Act & Assert
        userTenants.Should().HaveCount(2);
        userTenants.Should().Contain(_tenant1Id);
        userTenants.Should().Contain(_tenant2Id);
    }

    [Fact]
    public async Task InactiveTenantMembership_IsNotReturned()
    {
        // Arrange - Add an inactive membership
        var inactiveMembership = new TenantMembership
        {
            Id = Guid.NewGuid(),
            UserId = _user1Id,
            TenantId = _tenant2Id,
            IsActive = false, // Inactive
            Roles = new List<AppRole> { AppRole.Employee }
        };
        _context.TenantMemberships.Add(inactiveMembership);
        await _context.SaveChangesAsync();

        // Act
        var activeTenants = await _context.TenantMemberships
            .Where(tm => tm.UserId == _user1Id && tm.IsActive)
            .Select(tm => tm.TenantId)
            .ToListAsync();

        // Assert
        activeTenants.Should().HaveCount(1);
        activeTenants.Should().Contain(_tenant1Id);
        activeTenants.Should().NotContain(_tenant2Id);
    }

    #endregion

    #region JWT Token Claim Tests

    [Fact]
    public void MultipleTenantsInClaims_AreAllParsedCorrectly()
    {
        // Arrange - Simulate JWT claims with multiple tenants
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _multiTenantUserId.ToString()),
            new Claim(ClaimTypes.Email, "multi@company.com"),
            new Claim("TenantId", _tenant1Id.ToString()),
            new Claim("TenantId", _tenant2Id.ToString()),
            new Claim($"Tenant_{_tenant1Id}_Name", "Tenant One"),
            new Claim($"Tenant_{_tenant2Id}_Name", "Tenant Two"),
            new Claim($"Tenant_{_tenant1Id}_Role", "TenantAdmin"),
            new Claim($"Tenant_{_tenant2Id}_Role", "Employee")
        };
        var controller = CreateTestController(claims);

        // Act
        var tenantIds = controller.TestGetUserTenantIds();
        var tenant1Roles = controller.TestGetUserRolesForTenant(_tenant1Id);
        var tenant2Roles = controller.TestGetUserRolesForTenant(_tenant2Id);

        // Assert
        tenantIds.Should().HaveCount(2);
        tenant1Roles.Should().Contain("TenantAdmin");
        tenant2Roles.Should().Contain("Employee");
    }

    [Fact]
    public void InvalidGuidInTenantIdClaim_IsIgnored()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString()),
            new Claim("TenantId", "invalid-guid"), // Invalid GUID
            new Claim("TenantId", "") // Empty string
        };
        var controller = CreateTestController(claims);

        // Act
        var tenantIds = controller.TestGetUserTenantIds();

        // Assert
        tenantIds.Should().HaveCount(1);
        tenantIds.Should().Contain(_tenant1Id);
    }

    #endregion

    #region Cross-Tenant Access Prevention Tests

    [Fact]
    public void UserCannotAccessTenantTheyDontBelongTo()
    {
        // Arrange - User1 belongs only to Tenant1
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var canAccessTenant1 = controller.TestHasAccessToTenant(_tenant1Id);
        var canAccessTenant2 = controller.TestHasAccessToTenant(_tenant2Id);
        var canAccessRandomTenant = controller.TestHasAccessToTenant(Guid.NewGuid());

        // Assert
        canAccessTenant1.Should().BeTrue();
        canAccessTenant2.Should().BeFalse();
        canAccessRandomTenant.Should().BeFalse();
    }

    [Fact]
    public void SystemAdminCanAccessAnyTenant()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _user1Id.ToString()),
            new Claim("IsSystemAdmin", "true"),
            new Claim("TenantId", _tenant1Id.ToString())
        };
        var controller = CreateTestController(claims);

        // Act
        var canAccessTenant1 = controller.TestHasAccessToTenant(_tenant1Id);
        var canAccessTenant2 = controller.TestHasAccessToTenant(_tenant2Id);
        var canAccessRandomTenant = controller.TestHasAccessToTenant(Guid.NewGuid());

        // Assert - System admin should access all tenants
        canAccessTenant1.Should().BeTrue();
        canAccessTenant2.Should().BeTrue();
        canAccessRandomTenant.Should().BeTrue();
    }

    #endregion

    #region Helper Methods

    private TestAuthorizedController CreateTestController(List<Claim> claims)
    {
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = principal
        };

        var controller = new TestAuthorizedController();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    private TestControllerWithTenantIdHelper CreateTestControllerWithTenantIdHelper(
        List<Claim> claims,
        Dictionary<string, string> headers)
    {
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = principal
        };

        foreach (var header in headers)
        {
            httpContext.Request.Headers[header.Key] = header.Value;
        }

        var controller = new TestControllerWithTenantIdHelper();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    #endregion
}

/// <summary>
/// Test controller that exposes protected methods from AuthorizedControllerBase
/// </summary>
public class TestAuthorizedController : AuthorizedControllerBase
{
    public Guid TestGetCurrentUserId() => GetCurrentUserId();
    public string TestGetCurrentUserEmail() => GetCurrentUserEmail();
    public string TestGetCurrentUserDisplayName() => GetCurrentUserDisplayName();
    public bool TestIsSystemAdmin() => IsSystemAdmin();
    public List<Guid> TestGetUserTenantIds() => GetUserTenantIds();
    public List<string> TestGetUserRolesForTenant(Guid tenantId) => GetUserRolesForTenant(tenantId);
    public bool TestHasAccessToTenant(Guid tenantId) => HasAccessToTenant(tenantId);
}

/// <summary>
/// Test controller that includes the GetCurrentTenantId pattern used in many controllers
/// </summary>
public class TestControllerWithTenantIdHelper : AuthorizedControllerBase
{
    public Guid? TestGetCurrentTenantId()
    {
        // Check X-Tenant-Id header first (set by frontend when workspace selected)
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenantId) &&
            Guid.TryParse(headerTenantId.FirstOrDefault(), out var parsedHeaderTenantId))
        {
            // Verify user has access to this tenant
            var userTenantIds = GetUserTenantIds();
            if (userTenantIds.Contains(parsedHeaderTenantId))
                return parsedHeaderTenantId;
        }

        // Fallback to first TenantId claim
        var tenantIds = GetUserTenantIds();
        return tenantIds.FirstOrDefault() != Guid.Empty ? tenantIds.FirstOrDefault() : null;
    }

    public List<Guid> TestGetUserTenantIds() => GetUserTenantIds();
}
