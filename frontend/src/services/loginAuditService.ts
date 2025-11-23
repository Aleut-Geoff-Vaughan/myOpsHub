import { api } from '../lib/api-client';

export interface LoginAuditItem {
  id: string;
  userId?: string;
  email?: string;
  isSuccess: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface LoginAuditResponse {
  total: number;
  successCount: number;
  failedCount: number;
  page: number;
  pageSize: number;
  items: LoginAuditItem[];
}

export interface LoginAuditFilters {
  email?: string;
  userId?: string;
  isSuccess?: boolean;
  start?: string;
  end?: string;
  page?: number;
  pageSize?: number;
}

export const loginAuditService = {
  async list(filters: LoginAuditFilters = {}): Promise<LoginAuditResponse> {
    const params = new URLSearchParams();
    if (filters.email) params.append('email', filters.email);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.isSuccess !== undefined) params.append('isSuccess', String(filters.isSuccess));
    if (filters.start) params.append('start', filters.start);
    if (filters.end) params.append('end', filters.end);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

    const query = params.toString();
    const url = `/login-audits${query ? `?${query}` : ''}`;
    return api.get<LoginAuditResponse>(url);
  }
};
