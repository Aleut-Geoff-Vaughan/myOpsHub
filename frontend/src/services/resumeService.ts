import { api, ApiError } from '../lib/api-client';
import { logger } from './loggingService';
import type {
  ResumeProfile,
  ResumeSection,
  ResumeEntry,
  ResumeVersion,
  ResumeApproval,
  ResumeTemplate,
  ResumeStatus,
  ApprovalStatus,
  ResumeSectionType,
  ResumeTemplateType,
} from '../types/api';

const RESUME_COMPONENT = 'resumeService';

// Helper to log resume service errors with context
function logResumeError(operation: string, error: unknown, context?: Record<string, unknown>): void {
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

  logger.error(`Resume ${operation} failed`, errorDetails, RESUME_COMPONENT);
}

// ==================== RESUME CRUD ====================

export const getResumes = async (
  tenantId?: string,
  status?: ResumeStatus,
  search?: string
): Promise<ResumeProfile[]> => {
  const params = new URLSearchParams();
  if (tenantId) params.append('tenantId', tenantId);
  if (status !== undefined) params.append('status', status.toString());
  if (search) params.append('search', search);

  try {
    return await api.get<ResumeProfile[]>(
      `/resumes${params.toString() ? `?${params}` : ''}`
    );
  } catch (error) {
    logResumeError('getResumes', error, { tenantId, status, search });
    throw error;
  }
};

export const getResume = async (id: string): Promise<ResumeProfile> => {
  try {
    return await api.get<ResumeProfile>(`/resumes/${id}`);
  } catch (error) {
    logResumeError('getResume', error, { resumeId: id });
    throw error;
  }
};

// Get the current user's resume
export const getMyResume = async (): Promise<ResumeProfile | null> => {
  try {
    return await api.get<ResumeProfile>('/resumes/my');
  } catch (error: unknown) {
    // Handle 404 gracefully - user doesn't have a resume yet
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    logResumeError('getMyResume', error);
    throw error;
  }
};

// Get team members' resumes (for managers)
export const getTeamResumes = async (
  filter: 'direct' | 'team' | 'all' = 'direct',
  status?: ResumeStatus,
  search?: string
): Promise<ResumeProfile[]> => {
  const params = new URLSearchParams();
  params.append('filter', filter);
  if (status !== undefined) params.append('status', status.toString());
  if (search) params.append('search', search);

  return api.get<ResumeProfile[]>(`/resumes/team?${params}`);
};

export const createResume = async (data: {
  userId: string;
  templateConfig?: string;
}): Promise<ResumeProfile> => {
  try {
    const result = await api.post<ResumeProfile>(`/resumes`, data);
    logger.info('Resume created', { resumeId: result.id, userId: data.userId }, RESUME_COMPONENT);
    return result;
  } catch (error) {
    logResumeError('createResume', error, { userId: data.userId });
    throw error;
  }
};

export const updateResume = async (
  id: string,
  data: {
    status?: ResumeStatus;
    isPublic?: boolean;
    templateConfig?: string;
    linkedInProfileUrl?: string;
  }
): Promise<void> => {
  try {
    await api.put<void>(`/resumes/${id}`, data);
    logger.debug('Resume updated', { resumeId: id, changes: Object.keys(data) }, RESUME_COMPONENT);
  } catch (error) {
    logResumeError('updateResume', error, { resumeId: id });
    throw error;
  }
};

export const deleteResume = async (id: string): Promise<void> => {
  try {
    await api.delete<void>(`/resumes/${id}`);
    logger.info('Resume deleted', { resumeId: id }, RESUME_COMPONENT);
  } catch (error) {
    logResumeError('deleteResume', error, { resumeId: id });
    throw error;
  }
};

// ==================== SECTIONS & ENTRIES ====================

export const addSection = async (
  resumeId: string,
  data: {
    type: ResumeSectionType;
    title?: string;  // Optional, backend may not use it
    displayOrder: number;
  }
): Promise<ResumeSection> => {
  return api.post<ResumeSection>(
    `/resumes/${resumeId}/sections`,
    { type: data.type, displayOrder: data.displayOrder }
  );
};

export const addEntry = async (
  sectionId: string,
  data: {
    title: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    additionalFields?: string;
  }
): Promise<ResumeEntry> => {
  return api.post<ResumeEntry>(
    `/resumes/sections/${sectionId}/entries`,
    data
  );
};

export const updateEntry = async (
  entryId: string,
  data: {
    title?: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    additionalFields?: string;
  }
): Promise<void> => {
  return api.put<void>(`/resumes/entries/${entryId}`, data);
};

export const deleteEntry = async (entryId: string): Promise<void> => {
  return api.delete<void>(`/resumes/entries/${entryId}`);
};

// ==================== VERSION MANAGEMENT ====================

export const getVersions = async (resumeId: string): Promise<ResumeVersion[]> => {
  return api.get<ResumeVersion[]>(
    `/resumes/${resumeId}/versions`
  );
};

export const getVersion = async (resumeId: string, versionId: string): Promise<ResumeVersion> => {
  return api.get<ResumeVersion>(
    `/resumes/${resumeId}/versions/${versionId}`
  );
};

export const createVersion = async (
  resumeId: string,
  data: {
    versionName: string;
    description?: string;
    createdByUserId: string;
  }
): Promise<ResumeVersion> => {
  return api.post<ResumeVersion>(
    `/resumes/${resumeId}/versions`,
    data
  );
};

export const activateVersion = async (resumeId: string, versionId: string): Promise<void> => {
  return api.post<void>(`/resumes/${resumeId}/versions/${versionId}/activate`, undefined);
};

export const deleteVersion = async (resumeId: string, versionId: string): Promise<void> => {
  return api.delete<void>(`/resumes/${resumeId}/versions/${versionId}`);
};

// ==================== APPROVALS ====================

export const getApprovals = async (
  status?: ApprovalStatus,
  reviewerId?: string
): Promise<ResumeApproval[]> => {
  const params = new URLSearchParams();
  if (status !== undefined) params.append('status', status.toString());
  if (reviewerId) params.append('reviewerId', reviewerId);

  return api.get<ResumeApproval[]>(
    `/resume-approvals${params.toString() ? `?${params}` : ''}`
  );
};

export const getApproval = async (id: string): Promise<ResumeApproval> => {
  return api.get<ResumeApproval>(`/resume-approvals/${id}`);
};

export const requestApproval = async (data: {
  resumeProfileId: string;
  resumeVersionId?: string;
  requestedByUserId: string;
  requestNotes?: string;
}): Promise<ResumeApproval> => {
  try {
    const result = await api.post<ResumeApproval>(
      `/resume-approvals`,
      data
    );
    logger.info('Resume approval requested', {
      approvalId: result.id,
      resumeProfileId: data.resumeProfileId,
      requestedByUserId: data.requestedByUserId,
    }, RESUME_COMPONENT);
    return result;
  } catch (error) {
    logResumeError('requestApproval', error, { resumeProfileId: data.resumeProfileId });
    throw error;
  }
};

export const approveResume = async (
  id: string,
  data: {
    reviewedByUserId: string;
    reviewNotes?: string;
  }
): Promise<void> => {
  try {
    await api.put<void>(`/resume-approvals/${id}/approve`, data);
    logger.info('Resume approved', { approvalId: id, reviewedByUserId: data.reviewedByUserId }, RESUME_COMPONENT);
  } catch (error) {
    logResumeError('approveResume', error, { approvalId: id });
    throw error;
  }
};

export const rejectResume = async (
  id: string,
  data: {
    reviewedByUserId: string;
    reviewNotes: string;
  }
): Promise<void> => {
  try {
    await api.put<void>(`/resume-approvals/${id}/reject`, data);
    logger.info('Resume rejected', { approvalId: id, reviewedByUserId: data.reviewedByUserId }, RESUME_COMPONENT);
  } catch (error) {
    logResumeError('rejectResume', error, { approvalId: id });
    throw error;
  }
};

export const requestChanges = async (
  id: string,
  data: {
    reviewedByUserId: string;
    reviewNotes: string;
  }
): Promise<void> => {
  return api.put<void>(`/resume-approvals/${id}/request-changes`, data);
};

export const getPendingApprovals = async (tenantId?: string): Promise<ResumeApproval[]> => {
  const params = new URLSearchParams();
  if (tenantId) params.append('tenantId', tenantId);

  return api.get<ResumeApproval[]>(
    `/resume-approvals/pending${params.toString() ? `?${params}` : ''}`
  );
};

export const getMyApprovalRequests = async (userId: string): Promise<ResumeApproval[]> => {
  return api.get<ResumeApproval[]>(
    `/resume-approvals/my-requests?userId=${userId}`
  );
};

export const cancelApproval = async (id: string): Promise<void> => {
  return api.delete<void>(`/resume-approvals/${id}`);
};

// ==================== TEMPLATES ====================

export const getTemplates = async (
  tenantId?: string,
  type?: ResumeTemplateType,
  isActive?: boolean
): Promise<ResumeTemplate[]> => {
  const params = new URLSearchParams();
  if (tenantId) params.append('tenantId', tenantId);
  if (type !== undefined) params.append('type', type.toString());
  if (isActive !== undefined) params.append('isActive', isActive.toString());

  return api.get<ResumeTemplate[]>(
    `/resume-templates${params.toString() ? `?${params}` : ''}`
  );
};

export const getTemplate = async (id: string): Promise<ResumeTemplate> => {
  return api.get<ResumeTemplate>(`/resume-templates/${id}`);
};

export const createTemplate = async (data: {
  tenantId: string;
  name: string;
  description: string;
  type: ResumeTemplateType;
  templateContent: string;
  storedFileId?: string;
  isDefault?: boolean;
}): Promise<ResumeTemplate> => {
  return api.post<ResumeTemplate>(
    `/resume-templates`,
    data
  );
};

export const updateTemplate = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: ResumeTemplateType;
    templateContent?: string;
    storedFileId?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }
): Promise<void> => {
  return api.put<void>(`/resume-templates/${id}`, data);
};

export const deleteTemplate = async (id: string): Promise<void> => {
  return api.delete<void>(`/resume-templates/${id}`);
};

export const getDefaultTemplate = async (
  tenantId: string,
  type: ResumeTemplateType
): Promise<ResumeTemplate> => {
  return api.get<ResumeTemplate>(
    `/resume-templates/default?tenantId=${tenantId}&type=${type}`
  );
};

export const duplicateTemplate = async (
  id: string,
  newName?: string
): Promise<ResumeTemplate> => {
  return api.post<ResumeTemplate>(
    `/resume-templates/${id}/duplicate`,
    { newName }
  );
};

// ==================== ADMIN ENDPOINTS ====================

export interface ResumeAdminStats {
  totalResumes: number;
  resumesByStatus: { status: ResumeStatus; count: number }[];
  pendingApprovals: number;
  recentResumes: { id: string; userName: string; status: ResumeStatus; updatedAt: string }[];
}

export interface ResumeApprovalListItem {
  id: string;
  resumeProfileId: string;
  userName: string;
  userEmail: string;
  requestedAt: string;
  requestedByName: string;
  requestNotes?: string;
  resumeStatus: ResumeStatus;
}

export const getResumeAdminStats = async (): Promise<ResumeAdminStats> => {
  return api.get<ResumeAdminStats>('/resumes/admin/stats');
};

export const getAdminPendingApprovals = async (): Promise<ResumeApprovalListItem[]> => {
  return api.get<ResumeApprovalListItem[]>('/resumes/admin/pending-approvals');
};

export const adminApproveResume = async (
  approvalId: string,
  reviewedByUserId: string,
  reviewNotes?: string
): Promise<void> => {
  return api.post<void>(`/resumes/admin/approve/${approvalId}`, {
    reviewedByUserId,
    reviewNotes
  });
};

export const adminRejectResume = async (
  approvalId: string,
  reviewedByUserId: string,
  reviewNotes?: string
): Promise<void> => {
  return api.post<void>(`/resumes/admin/reject/${approvalId}`, {
    reviewedByUserId,
    reviewNotes
  });
};

export const bulkApproveResumes = async (
  approvalIds: string[],
  reviewedByUserId: string,
  reviewNotes?: string
): Promise<{ processed: number; total: number }> => {
  return api.post<{ processed: number; total: number }>('/resumes/admin/bulk-approve', {
    approvalIds,
    reviewedByUserId,
    reviewNotes
  });
};
