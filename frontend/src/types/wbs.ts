// WBS-specific types - separate file to work around Vite cache issues
import type { Project, User } from './api';

export enum WbsType {
  Billable = 0,
  NonBillable = 1,
  Internal = 2,
  Overhead = 3,
}

export enum WbsApprovalStatus {
  Draft = 0,
  PendingApproval = 1,
  Approved = 2,
  Rejected = 3,
  Suspended = 4,
  Closed = 5,
}

export enum WbsStatus {
  Draft = 0,
  Active = 1,
  Closed = 2,
}

export interface WbsElement {
  id: string;
  tenantId: string;
  projectId: string;
  code: string;
  description: string;
  validFrom: string;
  validTo?: string;
  startDate: string;
  endDate?: string;
  type: WbsType;
  status: WbsStatus;
  isBillable: boolean;
  ownerUserId?: string;
  approverUserId?: string;
  approvalStatus: WbsApprovalStatus;
  approvalNotes?: string;
  approvedAt?: string;
  project?: Project;
  owner?: User;
  approver?: User;
  createdAt: string;
  updatedAt: string;
}

export interface WbsChangeHistory {
  id: string;
  wbsElementId: string;
  changedByUserId: string;
  changedAt: string;
  changeType: string;
  oldValues?: string;
  newValues?: string;
  notes?: string;
  changedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRequest {
  userId: string;
  notes?: string;
}
