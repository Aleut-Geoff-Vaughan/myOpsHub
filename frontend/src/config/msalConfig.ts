import type { Configuration } from '@azure/msal-browser';
import { LogLevel, PublicClientApplication } from '@azure/msal-browser';

// SSO Configuration - can be overridden via environment variables:
// VITE_AZURE_AD_ENABLED - "true" to enable SSO
// VITE_AZURE_AD_CLIENT_ID - Azure AD Application (Client) ID
// VITE_AZURE_AD_TENANT_ID - Azure AD Tenant ID
// VITE_AZURE_AD_REDIRECT_URI - Redirect URI (defaults to window.location.origin)

export interface SsoConfig {
  enabled: boolean;
  clientId: string;
  tenantId: string;
  authority: string;
  redirectUri: string;
}

// Check environment variables first, then fall back to API config
const getEnvConfig = (): Partial<SsoConfig> => ({
  enabled: import.meta.env.VITE_AZURE_AD_ENABLED === 'true',
  clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
  tenantId: import.meta.env.VITE_AZURE_AD_TENANT_ID || '',
  redirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI || window.location.origin,
});

// Store the SSO config once fetched from the API
let cachedSsoConfig: SsoConfig | null = null;
let configPromise: Promise<SsoConfig> | null = null;

// Fetch SSO configuration from the API (allows backend to control settings)
export async function fetchSsoConfig(): Promise<SsoConfig> {
  // Return cached config if available
  if (cachedSsoConfig) {
    return cachedSsoConfig;
  }

  // Return existing promise if fetch is in progress
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    try {
      // Check environment variables first
      const envConfig = getEnvConfig();

      if (envConfig.enabled && envConfig.clientId && envConfig.tenantId) {
        // Use environment variables if fully configured
        cachedSsoConfig = {
          enabled: true,
          clientId: envConfig.clientId,
          tenantId: envConfig.tenantId,
          authority: `https://login.microsoftonline.com/${envConfig.tenantId}`,
          redirectUri: envConfig.redirectUri || window.location.origin,
        };
        return cachedSsoConfig;
      }

      // Fall back to fetching from API
      const response = await fetch('/api/auth/sso/config');
      if (!response.ok) {
        throw new Error('Failed to fetch SSO config');
      }

      const apiConfig = await response.json();

      cachedSsoConfig = {
        enabled: apiConfig.enabled || false,
        clientId: apiConfig.clientId || '',
        tenantId: apiConfig.tenantId || '',
        authority: apiConfig.authority || '',
        redirectUri: window.location.origin, // Always use current origin for redirect
      };

      return cachedSsoConfig;
    } catch (error) {
      console.warn('Failed to fetch SSO config, SSO will be disabled:', error);
      cachedSsoConfig = {
        enabled: false,
        clientId: '',
        tenantId: '',
        authority: '',
        redirectUri: window.location.origin,
      };
      return cachedSsoConfig;
    }
  })();

  return configPromise;
}

// Get cached config synchronously (may be null if not yet fetched)
export function getCachedSsoConfig(): SsoConfig | null {
  return cachedSsoConfig;
}

// Create MSAL configuration from SSO config
export function createMsalConfig(ssoConfig: SsoConfig): Configuration {
  return {
    auth: {
      clientId: ssoConfig.clientId,
      authority: ssoConfig.authority,
      redirectUri: ssoConfig.redirectUri,
      postLogoutRedirectUri: ssoConfig.redirectUri,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: 'sessionStorage', // Use sessionStorage for security
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error('[MSAL]', message);
              break;
            case LogLevel.Warning:
              console.warn('[MSAL]', message);
              break;
            case LogLevel.Info:
              if (import.meta.env.DEV) {
                console.info('[MSAL]', message);
              }
              break;
            case LogLevel.Verbose:
              if (import.meta.env.DEV) {
                console.debug('[MSAL]', message);
              }
              break;
          }
        },
        logLevel: import.meta.env.DEV ? LogLevel.Info : LogLevel.Warning,
      },
    },
  };
}

// MSAL instance - created lazily when needed
let msalInstance: PublicClientApplication | null = null;

export async function getMsalInstance(): Promise<PublicClientApplication | null> {
  const config = await fetchSsoConfig();

  if (!config.enabled || !config.clientId) {
    return null;
  }

  if (!msalInstance) {
    const msalConfig = createMsalConfig(config);
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }

  return msalInstance;
}

// Login request scopes - requesting only basic profile info
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// Reset the cached config (useful for testing or re-authentication)
export function resetSsoConfig(): void {
  cachedSsoConfig = null;
  configPromise = null;
  msalInstance = null;
}
