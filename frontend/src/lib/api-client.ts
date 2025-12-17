import { buildApiUrl } from '../config/api';
import { logger } from '../services/loggingService';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

// Helper to get JWT token from localStorage
function getAuthToken(): string | null {
  try {
    const authState = localStorage.getItem('auth-storage');
    if (authState) {
      const parsed = JSON.parse(authState);
      const token = parsed.state?.token;
      const expiresAt = parsed.state?.tokenExpiresAt;

      // Check if token is expired
      if (token && expiresAt) {
        const expiryDate = new Date(expiresAt);
        if (expiryDate > new Date()) {
          return token;
        }
      }
    }
  } catch (error) {
    console.error('Failed to get auth token from storage:', error);
  }
  return null;
}

// Helper to get current tenant ID from localStorage
function getCurrentTenantId(): string | null {
  try {
    const authState = localStorage.getItem('auth-storage');
    if (authState) {
      const parsed = JSON.parse(authState);
      return parsed.state?.currentWorkspace?.tenantId || null;
    }
  } catch (error) {
    console.error('Failed to get tenant ID from storage:', error);
  }
  return null;
}

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT = 30000;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const isFormData = options.body instanceof FormData;
  const defaultHeaders: HeadersInit = isFormData
    ? {}
    : {
        'Content-Type': 'application/json',
      };

  // Add JWT token in Authorization header if available
  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Add current tenant ID header if available
  const tenantId = getCurrentTenantId();
  if (tenantId) {
    defaultHeaders['X-Tenant-Id'] = tenantId;
  }

  // Add correlation ID for distributed tracing
  let correlationId = logger.getCorrelationId();
  if (!correlationId) {
    correlationId = logger.generateCorrelationId();
  }
  defaultHeaders['X-Correlation-Id'] = correlationId;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    signal: controller.signal,
  };

  const startTime = performance.now();
  const method = options.method || 'GET';

  logger.debug(`API Request: ${method} ${endpoint}`, { correlationId }, 'api-client');

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Don't redirect if already on login/auth page (prevents infinite loop)
        const isOnAuthPage = window.location.pathname === '/login' ||
                             window.location.pathname === '/forgot-password' ||
                             window.location.pathname.startsWith('/magic-link');

        if (!isOnAuthPage) {
          logger.warn(`API 401 Unauthorized: ${method} ${endpoint}`, { duration, correlationId }, 'api-client');
          // Clear auth storage and redirect to login
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Unauthorized - Please login again', null);
      }

      const errorData = await response.json().catch((parseError) => {
        logger.warn(`Failed to parse error response JSON: ${method} ${endpoint}`, {
          status: response.status,
          correlationId,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        }, 'api-client');
        return null;
      });
      logger.warn(`API Error: ${method} ${endpoint} - ${response.status}`, {
        status: response.status,
        duration,
        correlationId,
        error: errorData,
      }, 'api-client');
      throw new ApiError(response.status, response.statusText, errorData);
    }

    logger.debug(`API Response: ${method} ${endpoint} - ${response.status}`, {
      status: response.status,
      duration,
      correlationId,
    }, 'api-client');

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    const duration = Math.round(performance.now() - startTime);

    // Handle abort errors (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(`API Timeout: ${method} ${endpoint}`, { duration, correlationId }, 'api-client');
      throw new Error('Request timeout - please try again');
    }

    logger.error(`API Network Error: ${method} ${endpoint}`, {
      duration,
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'api-client');
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
