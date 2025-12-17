import { api, ApiError } from '../lib/api-client';
import { logger } from './loggingService';

const AUTH_COMPONENT = 'authService';

// Helper to log auth errors with context
function logAuthError(operation: string, error: unknown, context?: Record<string, unknown>): void {
  const errorDetails: Record<string, unknown> = {
    operation,
    ...context,
  };

  if (error instanceof ApiError) {
    errorDetails.status = error.status;
    errorDetails.statusText = error.statusText;
    errorDetails.data = error.data;
  } else if (error instanceof Error) {
    errorDetails.errorMessage = error.message;
    errorDetails.errorName = error.name;
  }

  logger.error(`Auth ${operation} failed`, errorDetails, AUTH_COMPONENT);
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TenantAccessInfo {
  tenantId: string;
  tenantName: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  displayName: string;
  isSystemAdmin: boolean;
  tenantAccess: TenantAccessInfo[];
}

// Magic Link Types
export interface MagicLinkRequestResponse {
  message: string;
}

export type MagicLinkVerifyResponse = LoginResponse;

// Impersonation Types
export interface ImpersonatedUserInfo {
  userId: string;
  email: string;
  displayName: string;
}

export interface ImpersonationStartResponse {
  success: boolean;
  sessionId: string;
  token: string;
  expiresAt: string;
  impersonatedUser: ImpersonatedUserInfo;
  tenantAccess: TenantAccessInfo[];
}

export interface ImpersonationEndResponse {
  success: boolean;
  token: string;
  expiresAt: string;
  user: ImpersonatedUserInfo;
  tenantAccess: TenantAccessInfo[];
}

export interface ImpersonationSessionInfo {
  active: boolean;
  sessionId?: string;
  adminUserId?: string;
  adminUserEmail?: string;
  adminUserName?: string;
  impersonatedUserId?: string;
  impersonatedUserEmail?: string;
  impersonatedUserName?: string;
  startedAt?: string;
  endedAt?: string;
  reason?: string;
  endReason?: string;
  duration?: string;
}

export interface CanImpersonateResponse {
  canImpersonate: boolean;
  reason?: string;
}

export const authService = {
  // Standard Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    logger.debug(`Login attempt for ${credentials.email}`, { email: credentials.email }, AUTH_COMPONENT);
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      logger.info(`Login successful for ${credentials.email}`, {
        userId: response.userId,
        tenantCount: response.tenantAccess.length,
        isSystemAdmin: response.isSystemAdmin,
      }, AUTH_COMPONENT);
      return response;
    } catch (error) {
      logAuthError('login', error, { email: credentials.email });
      throw error;
    }
  },

  async logout(): Promise<void> {
    logger.debug('Logout initiated', undefined, AUTH_COMPONENT);
    try {
      await api.post<void>('/auth/logout', {});
      logger.info('Logout successful', undefined, AUTH_COMPONENT);
    } catch (error) {
      logAuthError('logout', error);
      throw error;
    }
  },

  async setPassword(userId: string, password: string): Promise<void> {
    logger.debug(`Set password for user ${userId}`, { userId }, AUTH_COMPONENT);
    try {
      await api.post<void>('/auth/set-password', { userId, password });
      logger.info(`Password set for user ${userId}`, { userId }, AUTH_COMPONENT);
    } catch (error) {
      logAuthError('setPassword', error, { userId });
      throw error;
    }
  },

  // Magic Link
  async requestMagicLink(email: string): Promise<MagicLinkRequestResponse> {
    logger.debug(`Magic link request for ${email}`, { email }, AUTH_COMPONENT);
    try {
      const response = await api.post<MagicLinkRequestResponse>('/auth/magic-link/request', { email });
      logger.info(`Magic link requested for ${email}`, { email }, AUTH_COMPONENT);
      return response;
    } catch (error) {
      logAuthError('requestMagicLink', error, { email });
      throw error;
    }
  },

  async verifyMagicLink(token: string): Promise<MagicLinkVerifyResponse> {
    // Don't log the token for security reasons
    logger.debug('Magic link verification attempt', undefined, AUTH_COMPONENT);
    try {
      const response = await api.post<MagicLinkVerifyResponse>('/auth/magic-link/verify', { token });
      logger.info(`Magic link verified for ${response.email}`, {
        userId: response.userId,
        tenantCount: response.tenantAccess.length,
      }, AUTH_COMPONENT);
      return response;
    } catch (error) {
      logAuthError('verifyMagicLink', error);
      throw error;
    }
  },

  // Impersonation
  async startImpersonation(targetUserId: string, reason: string): Promise<ImpersonationStartResponse> {
    logger.warn(`Impersonation start requested for user ${targetUserId}`, {
      targetUserId,
      reason,
    }, AUTH_COMPONENT);
    try {
      const response = await api.post<ImpersonationStartResponse>('/admin/impersonation/start', { targetUserId, reason });
      logger.warn(`Impersonation started: ${response.impersonatedUser.email}`, {
        sessionId: response.sessionId,
        impersonatedUserId: response.impersonatedUser.userId,
        impersonatedEmail: response.impersonatedUser.email,
      }, AUTH_COMPONENT);
      return response;
    } catch (error) {
      logAuthError('startImpersonation', error, { targetUserId, reason });
      throw error;
    }
  },

  async endImpersonation(): Promise<ImpersonationEndResponse> {
    logger.debug('Ending impersonation session', undefined, AUTH_COMPONENT);
    try {
      const response = await api.post<ImpersonationEndResponse>('/admin/impersonation/end', {});
      logger.warn(`Impersonation ended, returned to ${response.user.email}`, {
        userId: response.user.userId,
      }, AUTH_COMPONENT);
      return response;
    } catch (error) {
      logAuthError('endImpersonation', error);
      throw error;
    }
  },

  async canImpersonate(targetUserId: string): Promise<CanImpersonateResponse> {
    try {
      return await api.get<CanImpersonateResponse>(`/admin/impersonation/can-impersonate/${targetUserId}`);
    } catch (error) {
      logAuthError('canImpersonate', error, { targetUserId });
      throw error;
    }
  },

  async getActiveImpersonationSession(): Promise<ImpersonationSessionInfo> {
    try {
      return await api.get<ImpersonationSessionInfo>('/admin/impersonation/active');
    } catch (error) {
      logAuthError('getActiveImpersonationSession', error);
      throw error;
    }
  },

  async getImpersonationSessions(count: number = 50): Promise<ImpersonationSessionInfo[]> {
    try {
      return await api.get<ImpersonationSessionInfo[]>(`/admin/impersonation/sessions?count=${count}`);
    } catch (error) {
      logAuthError('getImpersonationSessions', error, { count });
      throw error;
    }
  },
};
