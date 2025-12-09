using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace MyScheduling.Api.Services;

public interface IAzureAdTokenValidator
{
    Task<AzureAdTokenValidationResult> ValidateTokenAsync(string accessToken);
    bool IsEnabled { get; }
}

public class AzureAdTokenValidationResult
{
    public bool IsValid { get; set; }
    public string? Email { get; set; }
    public string? ObjectId { get; set; }
    public string? DisplayName { get; set; }
    public string? PreferredUsername { get; set; }
    public string? ErrorMessage { get; set; }
    public ClaimsPrincipal? ClaimsPrincipal { get; set; }
}

public class AzureAdTokenValidator : IAzureAdTokenValidator
{
    private readonly AzureAdSsoOptions _options;
    private readonly ILogger<AzureAdTokenValidator> _logger;
    private readonly ConfigurationManager<OpenIdConnectConfiguration> _configManager;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public AzureAdTokenValidator(
        IOptions<AzureAdSsoOptions> options,
        ILogger<AzureAdTokenValidator> logger)
    {
        _options = options.Value;
        _logger = logger;
        _tokenHandler = new JwtSecurityTokenHandler();

        // Configure the OIDC configuration manager to fetch signing keys
        _configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            _options.MetadataEndpoint,
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever());
    }

    public bool IsEnabled => _options.Enabled;

    public async Task<AzureAdTokenValidationResult> ValidateTokenAsync(string accessToken)
    {
        if (!_options.Enabled)
        {
            return new AzureAdTokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Azure AD SSO is not enabled"
            };
        }

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return new AzureAdTokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Access token is required"
            };
        }

        try
        {
            // Get the OpenID Connect configuration (includes signing keys)
            var config = await _configManager.GetConfigurationAsync(CancellationToken.None);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"{_options.Instance.TrimEnd('/')}/{_options.TenantId}/v2.0",
                ValidateAudience = true,
                ValidAudience = _options.ClientId,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = config.SigningKeys,
                ClockSkew = TimeSpan.FromMinutes(5) // Allow 5 minutes of clock skew
            };

            // Validate the token
            var principal = _tokenHandler.ValidateToken(accessToken, validationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken)
            {
                return new AzureAdTokenValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Invalid token format"
                };
            }

            // Extract user information from claims
            // Azure AD v2.0 tokens use these claim types:
            var email = principal.FindFirst("preferred_username")?.Value
                     ?? principal.FindFirst(ClaimTypes.Email)?.Value
                     ?? principal.FindFirst("email")?.Value
                     ?? principal.FindFirst("upn")?.Value;

            var objectId = principal.FindFirst("oid")?.Value
                        ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var displayName = principal.FindFirst("name")?.Value
                           ?? principal.FindFirst(ClaimTypes.Name)?.Value;

            var preferredUsername = principal.FindFirst("preferred_username")?.Value;

            _logger.LogInformation(
                "Successfully validated Azure AD token for user: {Email}, ObjectId: {ObjectId}",
                email, objectId);

            return new AzureAdTokenValidationResult
            {
                IsValid = true,
                Email = email,
                ObjectId = objectId,
                DisplayName = displayName,
                PreferredUsername = preferredUsername,
                ClaimsPrincipal = principal
            };
        }
        catch (SecurityTokenExpiredException)
        {
            _logger.LogWarning("Azure AD token has expired");
            return new AzureAdTokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Token has expired"
            };
        }
        catch (SecurityTokenInvalidAudienceException)
        {
            _logger.LogWarning("Azure AD token has invalid audience");
            return new AzureAdTokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Invalid token audience"
            };
        }
        catch (SecurityTokenInvalidIssuerException)
        {
            _logger.LogWarning("Azure AD token has invalid issuer");
            return new AzureAdTokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Invalid token issuer"
            };
        }
        catch (SecurityTokenValidationException ex)
        {
            _logger.LogWarning(ex, "Azure AD token validation failed");
            return new AzureAdTokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "Token validation failed"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error validating Azure AD token");
            return new AzureAdTokenValidationResult
            {
                IsValid = false,
                ErrorMessage = "An error occurred during token validation"
            };
        }
    }
}
