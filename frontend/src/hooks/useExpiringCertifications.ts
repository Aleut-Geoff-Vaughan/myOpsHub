import { useQuery } from '@tanstack/react-query';
import {
  getMyExpiringCertifications,
  getTeamExpiringCertifications,
  type ExpiringCertificationsResponse,
  type TeamExpiringCertificationsResponse,
} from '../services/expiringCertificationsService';

export const useMyExpiringCertifications = () => {
  return useQuery<ExpiringCertificationsResponse>({
    queryKey: ['expiringCertifications', 'my'],
    queryFn: getMyExpiringCertifications,
    // Refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeamExpiringCertifications = () => {
  return useQuery<TeamExpiringCertificationsResponse>({
    queryKey: ['expiringCertifications', 'team'],
    queryFn: getTeamExpiringCertifications,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
};
