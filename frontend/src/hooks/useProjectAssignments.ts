import { useQuery } from '@tanstack/react-query';
import { projectAssignmentsService } from '../services/projectAssignmentsService';
import type { GetProjectAssignmentsParams } from '../services/projectAssignmentsService';
import type { ProjectAssignment } from '../types/api';

export function useProjectAssignments(params?: GetProjectAssignmentsParams) {
  return useQuery<ProjectAssignment[], Error>({
    queryKey: ['projectAssignments', params],
    queryFn: () => projectAssignmentsService.getAll(params),
  });
}

export function useProjectAssignment(id: string) {
  return useQuery<ProjectAssignment, Error>({
    queryKey: ['projectAssignments', id],
    queryFn: () => projectAssignmentsService.getById(id),
    enabled: !!id,
  });
}
