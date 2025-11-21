// Resume-specific types - separate file to work around module issues
export enum ResumeStatus {
  Draft = 0,
  Active = 1,
  UnderReview = 2,
  Approved = 3,
  Archived = 4,
}

export enum ResumeSectionType {
  Experience = 0,
  Education = 1,
  Skills = 2,
  Certifications = 3,
  Projects = 4,
  Awards = 5,
  Publications = 6,
}

export enum ResumeTemplateType {
  Default = 0,
  Technical = 1,
  Executive = 2,
  Academic = 3,
}

export interface ResumeProfile {
  id: string;
  tenantId: string;
  personId: string;
  resumeName: string;
  status: ResumeStatus;
  templateId?: string;
  currentVersionId?: string;
  isDefault: boolean;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResumeSection {
  id: string;
  resumeProfileId: string;
  type: ResumeSectionType;
  title: string;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ResumeEntry {
  id: string;
  resumeSectionId: string;
  title: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ResumeVersion {
  id: string;
  resumeProfileId: string;
  versionNumber: number;
  snapshotData: string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResumeDocument {
  id: string;
  tenantId: string;
  resumeProfileId: string;
  resumeVersionId?: string;
  fileName: string;
  fileExtension: string;
  storedFileId: string;
  generatedByUserId?: string;
  generatedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResumeApproval {
  id: string;
  resumeProfileId: string;
  requestedByUserId: string;
  reviewedByUserId?: string;
  status: string;
  requestNotes?: string;
  reviewNotes?: string;
  requestedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResumeTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: ResumeTemplateType;
  templateContent: string;
  storedFileId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateResumeSectionRequest {
  type: ResumeSectionType;
  title: string;
  displayOrder: number;
}

export interface UpdateResumeSectionRequest {
  title?: string;
  displayOrder?: number;
}
