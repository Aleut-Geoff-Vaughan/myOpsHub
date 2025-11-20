// Enums
export enum PersonStatus {
  Active = 0,
  Inactive = 1,
  OnLeave = 2,
}

export enum PersonType {
  Employee = 0,
  Contractor = 1,
  Vendor = 2,
  External = 3,
}

export enum ProjectStatus {
  Draft = 0,
  Active = 1,
  Closed = 2,
}

export enum AssignmentStatus {
  Draft = 0,
  PendingApproval = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum BookingStatus {
  Reserved = 0,
  CheckedIn = 1,
  Completed = 2,
  Cancelled = 3,
  NoShow = 4,
}

export enum TenantStatus {
  Active = 0,
  Inactive = 1,
  Suspended = 2,
}

export enum SpaceType {
  Desk = 0,
  Office = 1,
  ConferenceRoom = 2,
  Huddle = 3,
  PhoneBooth = 4,
}

export enum WbsType {
  Billable = 0,
  NonBillable = 1,
  BidAndProposal = 2,
  Overhead = 3,
  GeneralAndAdmin = 4,
}

export enum WbsApprovalStatus {
  Draft = 0,
  PendingApproval = 1,
  Approved = 2,
  Rejected = 3,
  Suspended = 4,
  Closed = 5,
}

// Entities
export interface Person {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  laborCategory?: string;
  location?: string;
  status: PersonStatus;
  type: PersonType;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  programCode?: string;
  customer?: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  tenantId: string;
  personId: string;
  wbsElementId: string;
  projectRoleId: string;
  startDate: string;
  endDate: string;
  allocation: number;
  status: AssignmentStatus;
  approvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  spaceId: string;
  personId: string;
  startDatetime: string;
  endDatetime: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  code?: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export enum AppRole {
  // Tenant-Level Roles
  Employee = 0,
  ViewOnly = 1,
  TeamLead = 2,
  ProjectManager = 3,
  ResourceManager = 4,
  OfficeManager = 5,
  TenantAdmin = 6,
  Executive = 7,
  OverrideApprover = 8,
  // System-Level Roles
  SystemAdmin = 9,
  Support = 10,
  Auditor = 11,
}

export interface TenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  tenant?: Tenant;
  roles: AppRole[];
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  entraObjectId: string;
  isSystemAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  deactivatedAt?: string;
  deactivatedByUserId?: string;
  // Profile fields
  phoneNumber?: string;
  jobTitle?: string;
  department?: string;
  profilePhotoUrl?: string;
  // Navigation properties
  tenantMemberships: TenantMembership[];
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  totalCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Space {
  id: string;
  officeId: string;
  name: string;
  type: SpaceType;
  floor?: string;
  building?: string;
  capacity?: number;
  amenities?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
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
  notes?: string;
}
