export enum DOAStatus {
  Draft = 0,
  PendingSignatures = 1,
  Active = 2,
  Expired = 3,
  Revoked = 4,
}

export enum SignatureRole {
  Delegator = 0,
  Designee = 1,
}

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface DigitalSignature {
  id: string;
  doaLetterId: string;
  signerUserId: string;
  role: SignatureRole;
  signatureData: string; // Base64 encoded image
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  isVerified: boolean;
  createdAt: string;
  signerUser?: User;
}

export interface DOAActivation {
  id: string;
  doaLetterId: string;
  tenantId: string;
  startDate: string; // DateOnly format YYYY-MM-DD
  endDate: string;
  reason: string;
  notes?: string;
  isActive: boolean;
  deactivatedAt?: string;
  deactivatedByUserId?: string;
  createdAt: string;
  updatedAt?: string;
  doaLetter?: DelegationOfAuthorityLetter;
}

export interface DelegationOfAuthorityLetter {
  id: string;
  tenantId: string;
  delegatorUserId: string;
  designeeUserId: string;
  letterContent: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  isFinancialAuthority: boolean;
  isOperationalAuthority: boolean;
  status: DOAStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  delegatorUser?: User;
  designeeUser?: User;
  signatures?: DigitalSignature[];
  activations?: DOAActivation[];
}

export interface CreateDOALetterRequest {
  designeeUserId: string;
  letterContent: string;
  effectiveStartDate: string; // ISO DateTime string
  effectiveEndDate: string;
  isFinancialAuthority: boolean;
  isOperationalAuthority: boolean;
  notes?: string;
}

export interface UpdateDOALetterRequest extends CreateDOALetterRequest {
  id: string;
}

export interface SignatureRequest {
  signatureData: string; // Base64 encoded canvas image
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivationRequest {
  startDate: string; // DateOnly format YYYY-MM-DD
  endDate: string;
  reason: string;
  notes?: string;
}

export type DOAFilter = 'created' | 'assigned' | 'all';
