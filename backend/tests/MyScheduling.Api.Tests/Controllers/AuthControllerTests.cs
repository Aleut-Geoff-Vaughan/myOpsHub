using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using MyScheduling.Api.Controllers;
using MyScheduling.Api.Services;
using MyScheduling.Core.Entities;
using MyScheduling.Core.Interfaces;
using MyScheduling.Infrastructure.Data;

namespace MyScheduling.Api.Tests.Controllers;

public class AuthControllerTests : IDisposable
{
    private readonly MySchedulingDbContext _context;
    private readonly Mock<ILogger<AuthController>> _loggerMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IMagicLinkService> _magicLinkServiceMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly AuthController _controller;
    private readonly Guid _tenantId = Guid.NewGuid();

    public AuthControllerTests()
    {
        var options = new DbContextOptionsBuilder<MySchedulingDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new MySchedulingDbContext(options);
        _loggerMock = new Mock<ILogger<AuthController>>();
        _configurationMock = new Mock<IConfiguration>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _magicLinkServiceMock = new Mock<IMagicLinkService>();
        _emailServiceMock = new Mock<IEmailService>();

        // Setup configuration
        _configurationMock.Setup(c => c["Jwt:Key"]).Returns("MyScheduling-Test-Secret-Key-For-Unit-Testing-Only-2024-Very-Long");
        _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("MyScheduling");
        _configurationMock.Setup(c => c["Jwt:Audience"]).Returns("MyScheduling");
        _configurationMock.Setup(c => c["Jwt:ExpirationHours"]).Returns("8");

        // Setup HttpContext
        var httpContext = new DefaultHttpContext();
        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(httpContext);

        _controller = new AuthController(
            _context,
            _loggerMock.Object,
            _configurationMock.Object,
            _httpContextAccessorMock.Object,
            _magicLinkServiceMock.Object,
            _emailServiceMock.Object
        );
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private async Task<User> CreateTestUser(string email = "test@example.com", string password = "Password123!", bool isActive = true)
    {
        var tenant = new Tenant
        {
            Id = _tenantId,
            Name = "Test Tenant",
            Status = TenantStatus.Active
        };
        _context.Tenants.Add(tenant);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            DisplayName = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 4), // Lower work factor for tests
            IsActive = isActive,
            FailedLoginAttempts = 0,
            TenantMemberships = new List<TenantMembership>
            {
                new TenantMembership
                {
                    Id = Guid.NewGuid(),
                    TenantId = _tenantId,
                    Tenant = tenant,
                    IsActive = true,
                    Roles = new List<AppRole> { AppRole.Employee }
                }
            }
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var password = "TestPassword123!";
        var user = await CreateTestUser(password: password);

        var request = new LoginRequest
        {
            Email = user.Email,
            Password = password
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;

        response.Token.Should().NotBeNullOrEmpty();
        response.UserId.Should().Be(user.Id);
        response.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "AnyPassword123!"
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        var unauthorizedResult = result.Result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorizedResult.Value.Should().BeEquivalentTo(new { message = "Invalid email or password" });
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        await CreateTestUser(password: "CorrectPassword123!");

        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "WrongPassword123!"
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_WithInactiveUser_ReturnsUnauthorized()
    {
        // Arrange
        await CreateTestUser(password: "Password123!", isActive: false);

        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        var unauthorizedResult = result.Result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        var responseValue = unauthorizedResult.Value;
        responseValue.Should().BeEquivalentTo(new { message = "Account is inactive. Please contact your administrator." });
    }

    [Fact]
    public async Task Login_IncrementsFailedAttempts_OnWrongPassword()
    {
        // Arrange
        var user = await CreateTestUser(password: "CorrectPassword123!");
        var initialAttempts = user.FailedLoginAttempts;

        var request = new LoginRequest
        {
            Email = user.Email,
            Password = "WrongPassword123!"
        };

        // Act
        await _controller.Login(request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.FailedLoginAttempts.Should().Be(initialAttempts + 1);
    }

    [Fact]
    public async Task Login_LocksAccount_AfterMaxFailedAttempts()
    {
        // Arrange
        var user = await CreateTestUser(password: "CorrectPassword123!");
        user.FailedLoginAttempts = 4; // One away from lockout
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = user.Email,
            Password = "WrongPassword123!"
        };

        // Act
        await _controller.Login(request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.FailedLoginAttempts.Should().Be(5);
        updatedUser.LockedOutUntil.Should().NotBeNull();
        updatedUser.LockedOutUntil.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task Login_DeniesAccess_WhenAccountIsLockedOut()
    {
        // Arrange
        var user = await CreateTestUser(password: "CorrectPassword123!");
        user.LockedOutUntil = DateTime.UtcNow.AddMinutes(30);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = user.Email,
            Password = "CorrectPassword123!"
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_ResetsFailedAttempts_OnSuccessfulLogin()
    {
        // Arrange
        var password = "Password123!";
        var user = await CreateTestUser(password: password);
        user.FailedLoginAttempts = 3;
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = user.Email,
            Password = password
        };

        // Act
        await _controller.Login(request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.FailedLoginAttempts.Should().Be(0);
        updatedUser.LockedOutUntil.Should().BeNull();
    }

    [Fact]
    public async Task Login_UpdatesLastLoginAt_OnSuccess()
    {
        // Arrange
        var password = "Password123!";
        var user = await CreateTestUser(password: password);
        var beforeLogin = DateTime.UtcNow;

        var request = new LoginRequest
        {
            Email = user.Email,
            Password = password
        };

        // Act
        await _controller.Login(request);

        // Assert
        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.LastLoginAt.Should().NotBeNull();
        updatedUser.LastLoginAt.Should().BeOnOrAfter(beforeLogin);
    }

    [Fact]
    public async Task Login_IsCaseInsensitive_ForEmail()
    {
        // Arrange
        var password = "Password123!";
        await CreateTestUser(email: "test@example.com", password: password);

        var request = new LoginRequest
        {
            Email = "TEST@EXAMPLE.COM",
            Password = password
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Login_TrimsEmail_WithWhitespace()
    {
        // Arrange
        var password = "Password123!";
        await CreateTestUser(email: "test@example.com", password: password);

        var request = new LoginRequest
        {
            Email = "  test@example.com  ",
            Password = password
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Login_ReturnsTenantAccess_InResponse()
    {
        // Arrange
        var password = "Password123!";
        await CreateTestUser(password: password);

        var request = new LoginRequest
        {
            Email = "test@example.com",
            Password = password
        };

        // Act
        var result = await _controller.Login(request);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;

        response.TenantAccess.Should().NotBeEmpty();
        response.TenantAccess[0].TenantId.Should().Be(_tenantId);
        response.TenantAccess[0].TenantName.Should().Be("Test Tenant");
    }

    [Fact]
    public void Logout_ReturnsSuccess()
    {
        // Act
        var result = _controller.Logout();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(new { message = "Logged out successfully" });
    }

    [Fact]
    public async Task SetPassword_WithValidPassword_ReturnsSuccess()
    {
        // Arrange
        var user = await CreateTestUser();

        var request = new SetPasswordRequest
        {
            UserId = user.Id,
            Password = "NewSecurePassword123!"
        };

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        var updatedUser = await _context.Users.FindAsync(user.Id);
        BCrypt.Net.BCrypt.Verify("NewSecurePassword123!", updatedUser!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task SetPassword_WithWeakPassword_ReturnsBadRequest()
    {
        // Arrange
        var user = await CreateTestUser();

        var request = new SetPasswordRequest
        {
            UserId = user.Id,
            Password = "weak" // Too short, no uppercase, no number, no special char
        };

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SetPassword_ForNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var request = new SetPasswordRequest
        {
            UserId = Guid.NewGuid(),
            Password = "ValidPassword123!"
        };

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UnlockAccount_ResetsLockoutAndAttempts()
    {
        // Arrange
        var user = await CreateTestUser();
        user.FailedLoginAttempts = 5;
        user.LockedOutUntil = DateTime.UtcNow.AddMinutes(30);
        await _context.SaveChangesAsync();

        var request = new UnlockAccountRequest { UserId = user.Id };

        // Act
        var result = await _controller.UnlockAccount(request);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        var updatedUser = await _context.Users.FindAsync(user.Id);
        updatedUser!.FailedLoginAttempts.Should().Be(0);
        updatedUser.LockedOutUntil.Should().BeNull();
    }

    [Fact]
    public async Task UnlockAccount_ForNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var request = new UnlockAccountRequest { UserId = Guid.NewGuid() };

        // Act
        var result = await _controller.UnlockAccount(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Theory]
    [InlineData("", "Password is required")]
    [InlineData("short", "Password must be at least 8 characters long")]
    [InlineData("nouppercase123!", "Password must contain at least one uppercase letter")]
    [InlineData("NOLOWERCASE123!", "Password must contain at least one lowercase letter")]
    [InlineData("NoNumber!!", "Password must contain at least one number")]
    [InlineData("NoSpecialChar1", "Password must contain at least one special character")]
    public async Task SetPassword_ValidatesPasswordRequirements(string password, string expectedError)
    {
        // Arrange
        var user = await CreateTestUser();

        var request = new SetPasswordRequest
        {
            UserId = user.Id,
            Password = password
        };

        // Act
        var result = await _controller.SetPassword(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().BeEquivalentTo(new { message = expectedError });
    }
}
