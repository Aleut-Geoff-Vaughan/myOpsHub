import { api } from '../lib/api-client';

export interface ExpiringCertificationItem {
  id: string;
  certificationId: string;
  certificationName: string;
  issuer?: string;
  expiryDate: string;
  daysRemaining: number;
  urgencyLevel: 'expired' | 'critical' | 'warning' | 'info';
}

export interface ExpiringCertificationsResponse {
  items: ExpiringCertificationItem[];
  totalCount: number;
  warningDays: number;
}

export interface TeamExpiringCertificationItem extends ExpiringCertificationItem {
  userId: string;
  userName: string;
  userEmail: string;
}

export interface TeamExpiringCertificationsResponse {
  items: TeamExpiringCertificationItem[];
  totalCount: number;
  warningDays: number;
}

export const getMyExpiringCertifications = async (): Promise<ExpiringCertificationsResponse> => {
  return api.get<ExpiringCertificationsResponse>('/certifications/expiring');
};

export const getTeamExpiringCertifications = async (): Promise<TeamExpiringCertificationsResponse> => {
  return api.get<TeamExpiringCertificationsResponse>('/certifications/expiring/team');
};

// Helper to get urgency color
export const getUrgencyColor = (level: ExpiringCertificationItem['urgencyLevel']): string => {
  switch (level) {
    case 'expired':
      return 'text-gray-600 bg-gray-100';
    case 'critical':
      return 'text-red-600 bg-red-100';
    case 'warning':
      return 'text-amber-600 bg-amber-100';
    case 'info':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Helper to get urgency badge color
export const getUrgencyBadgeColor = (level: ExpiringCertificationItem['urgencyLevel']): string => {
  switch (level) {
    case 'expired':
      return 'bg-gray-500';
    case 'critical':
      return 'bg-red-500';
    case 'warning':
      return 'bg-amber-500';
    case 'info':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};
