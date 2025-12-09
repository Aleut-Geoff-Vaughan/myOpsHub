namespace MyScheduling.Api.Services;

/// <summary>
/// Configuration options for Azure AD SSO.
/// These can be overridden via environment variables:
/// - AzureAd__Enabled
/// - AzureAd__TenantId
/// - AzureAd__ClientId
/// - AzureAd__ClientSecret
/// - AzureAd__Instance
/// - AzureAd__AllowedRedirectUrls__0, AzureAd__AllowedRedirectUrls__1, etc.
/// </summary>
public class AzureAdSsoOptions
{
    /// <summary>
    /// Whether Azure AD SSO is enabled. Default: false
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Azure AD Instance URL. Default: https://login.microsoftonline.com/
    /// </summary>
    public string Instance { get; set; } = "https://login.microsoftonline.com/";

    /// <summary>
    /// Azure AD Tenant ID (Directory ID)
    /// </summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// Azure AD Application (Client) ID
    /// </summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// Azure AD Client Secret (for confidential client scenarios)
    /// Store this in environment variables or Key Vault, not in appsettings.json
    /// </summary>
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>
    /// The path where Azure AD will redirect after authentication
    /// </summary>
    public string CallbackPath { get; set; } = "/api/auth/sso/callback";

    /// <summary>
    /// The path where Azure AD will redirect after sign-out
    /// </summary>
    public string SignedOutCallbackPath { get; set; } = "/api/auth/sso/signout-callback";

    /// <summary>
    /// Allowed redirect URLs for the frontend after SSO completes
    /// </summary>
    public string[] AllowedRedirectUrls { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets the authority URL for Azure AD
    /// </summary>
    public string Authority => $"{Instance.TrimEnd('/')}/{TenantId}";

    /// <summary>
    /// Gets the OpenID Connect metadata endpoint
    /// </summary>
    public string MetadataEndpoint => $"{Authority}/v2.0/.well-known/openid-configuration";
}
