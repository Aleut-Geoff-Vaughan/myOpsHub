import { getMsalInstance, loginRequest, fetchSsoConfig, resetSsoConfig } from '../config/msalConfig';
import type { AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { api } from '../lib/api-client';

export interface SsoLoginResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  userId?: string;
  email?: string;
  displayName?: string;
  isSystemAdmin?: boolean;
  tenantAccess?: Array<{
    tenantId: string;
    tenantName: string;
    roles: string[];
  }>;
  error?: string;
}

// Check if SSO is enabled
export async function isSsoEnabled(): Promise<boolean> {
  const config = await fetchSsoConfig();
  return config.enabled;
}

// Get the SSO configuration
export async function getSsoConfig() {
  return fetchSsoConfig();
}

// Initiate SSO login via popup
export async function ssoLoginPopup(): Promise<SsoLoginResult> {
  try {
    const msalInstance = await getMsalInstance();

    if (!msalInstance) {
      return {
        success: false,
        error: 'SSO is not enabled or not configured',
      };
    }

    // Try to get token silently first (if user is already logged in)
    let authResult: AuthenticationResult | null = null;

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      try {
        authResult = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          // Silent acquisition failed, need interactive login
          authResult = null;
        } else {
          throw error;
        }
      }
    }

    // If no silent token, do interactive login via popup
    if (!authResult) {
      authResult = await msalInstance.loginPopup(loginRequest);
    }

    if (!authResult || !authResult.accessToken) {
      return {
        success: false,
        error: 'Failed to obtain access token from Microsoft',
      };
    }

    // Exchange the Azure AD token for our application JWT
    return await exchangeToken(authResult.accessToken);
  } catch (error: unknown) {
    console.error('SSO login error:', error);

    // Handle user cancellation
    if (error instanceof Error && error.message.includes('user_cancelled')) {
      return {
        success: false,
        error: 'Login was cancelled',
      };
    }

    // Handle popup blocked
    if (error instanceof Error && error.message.includes('popup_window_error')) {
      return {
        success: false,
        error: 'Popup was blocked. Please allow popups for this site and try again.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred during SSO login',
    };
  }
}

// Initiate SSO login via redirect (alternative to popup)
export async function ssoLoginRedirect(): Promise<void> {
  const msalInstance = await getMsalInstance();

  if (!msalInstance) {
    throw new Error('SSO is not enabled or not configured');
  }

  await msalInstance.loginRedirect(loginRequest);
}

// Handle redirect callback after SSO login
export async function handleSsoRedirect(): Promise<SsoLoginResult | null> {
  try {
    const msalInstance = await getMsalInstance();

    if (!msalInstance) {
      return null;
    }

    const response = await msalInstance.handleRedirectPromise();

    if (response && response.accessToken) {
      return await exchangeToken(response.accessToken);
    }

    return null;
  } catch (error) {
    console.error('SSO redirect handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle SSO redirect',
    };
  }
}

// Exchange Azure AD token for our application JWT
async function exchangeToken(azureAdToken: string): Promise<SsoLoginResult> {
  try {
    const data = await api.post<{
      token: string;
      expiresAt: string;
      userId: string;
      email: string;
      displayName: string;
      isSystemAdmin: boolean;
      tenantAccess: Array<{
        tenantId: string;
        tenantName: string;
        roles: string[];
      }>;
    }>('/api/auth/sso/login', {
      accessToken: azureAdToken,
    });

    return {
      success: true,
      token: data.token,
      expiresAt: new Date(data.expiresAt),
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      isSystemAdmin: data.isSystemAdmin,
      tenantAccess: data.tenantAccess,
    };
  } catch (error: unknown) {
    console.error('Token exchange error:', error);

    // Extract error message from response
    let errorMessage = 'Failed to complete SSO login';
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get the current SSO account (if user is signed in via SSO)
export async function getCurrentSsoAccount(): Promise<AccountInfo | null> {
  const msalInstance = await getMsalInstance();

  if (!msalInstance) {
    return null;
  }

  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

// SSO logout - clears MSAL cache
export async function ssoLogout(): Promise<void> {
  const msalInstance = await getMsalInstance();

  if (msalInstance) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      // Just clear the local cache, don't redirect to Microsoft logout
      // to keep the user's Microsoft session for convenience
      msalInstance.clearCache();
    }
  }

  resetSsoConfig();
}
