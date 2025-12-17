import { api, ApiError } from '../lib/api-client';
import { logger } from './loggingService';

const SALESOPS_COMPONENT = 'salesOpsService';

// Helper to log salesops service errors with context
function logSalesOpsError(operation: string, error: unknown, context?: Record<string, unknown>): void {
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

  logger.error(`SalesOps ${operation} failed`, errorDetails, SALESOPS_COMPONENT);
}

// Helper to build query string from params
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================================
// Enums
// ============================================================================

export enum OpportunityType {
  NewBusiness = 0,
  Recompete = 1,
  TaskOrder = 2,
  Modification = 3,
  Option = 4,
}

export enum GrowthType {
  NewBusiness = 0,
  Expansion = 1,
  Renewal = 2,
}

export enum AcquisitionType {
  FullAndOpen = 0,
  SmallBusiness = 1,
  EightASetAside = 2,
  SDVOSB = 3,
  WOSB = 4,
  HUBZone = 5,
  EightADirectAward = 6,
  SoleSource = 7,
  Other = 99,
}

export enum SalesContractType {
  FirmFixedPrice = 0,
  TimeAndMaterials = 1,
  CostPlus = 2,
  CostPlusFixedFee = 3,
  CostPlusIncentiveFee = 4,
  CostPlusAwardFee = 5,
  IDIQ = 6,
  BPA = 7,
  Hybrid = 8,
  Other = 99,
}

export enum OpportunityResult {
  Won = 0,
  Lost = 1,
  NoBid = 2,
  Cancelled = 3,
  Withdrawn = 4,
}

export enum RfiStatus {
  NotApplicable = 0,
  Pending = 1,
  Submitted = 2,
  Responded = 3,
}

export enum BidDecision {
  Pending = 0,
  Bid = 1,
  NoBid = 2,
  ConditionalBid = 3,
}

export enum BiddingEntityRole {
  Prime = 0,
  Subcontractor = 1,
}

// ============================================================================
// Sales Opportunity Types
// ============================================================================

export interface SalesOpportunity {
  id: string;
  tenantId: string;
  opportunityNumber: string;
  name: string;
  description?: string;

  // Relationships
  accountId?: string;
  account?: SalesAccount;
  biddingEntityId?: string;
  biddingEntity?: BiddingEntity;
  contractVehicleId?: string;
  contractVehicle?: ContractVehicle;
  primaryContactId?: string;
  primaryContact?: SalesContact;
  ownerId: string;
  owner?: { id: string; email: string; displayName?: string };
  stageId: string;
  stage?: SalesStage;
  lossReasonId?: string;
  lossReason?: LossReason;

  // Classification
  type: OpportunityType;
  growthType: GrowthType;
  acquisitionType: string;  // Dynamic picklist value
  contractType: string;     // Dynamic picklist value
  opportunityStatus?: string; // Dynamic picklist value
  portfolio?: string;         // Dynamic picklist value
  bidDecision: BidDecision;

  // Business Line
  primaryBusinessLine?: string;
  capability?: string;
  capabilityBusinessLine?: string;

  // Financials
  amount: number;
  totalContractValue: number;
  probabilityPercent: number;
  probabilityGoPercent?: number;
  targetGrossMarginPercent?: number;
  targetGrossMarginAmount?: number;
  targetOperatingIncomePercent?: number;
  targetOperatingIncomeAmount?: number;
  includedInForecast: boolean;
  revenueStream?: string;

  // Key Dates
  closeDate: string;
  closeFiscalYear?: string;
  closeFiscalQuarter?: string;
  rfiStatus: RfiStatus;
  plannedRfiSubmissionDate?: string;
  actualRfiSubmissionDate?: string;
  plannedRfpReleaseDate?: string;
  actualRfpReleaseDate?: string;
  plannedProposalSubmissionDate?: string;
  actualProposalSubmissionDate?: string;
  projectStartDate?: string;
  projectFinishDate?: string;
  durationMonths?: number;
  opportunityTerms?: string;

  // Contract Details
  solicitationNumber?: string;
  primaryNaicsCode?: string;
  costpointProjectCode?: string;
  incumbentContractNumber?: string;
  incumbent?: string;
  incumbentAwardDate?: string;
  incumbentExpireDate?: string;
  isDirectAward: boolean;
  isFrontDoor: boolean;
  proposalId?: string;
  masterContractId?: string;
  masterContractTitle?: string;
  placeOfPerformance?: string;

  // Priority & Strategy
  priority?: string;
  nextStep?: string;
  solutionDetails?: string;

  // Win/Loss
  result?: OpportunityResult;
  customerFeedback?: string;
  winningPriceTcv?: number;
  winningCompetitor?: string;

  // Lead Source
  leadSource?: string;
  govWinId?: string;
  opportunityLink?: string;
  bAndPCode?: string;
  responseFolder?: string;

  // Related collections
  teamMembers?: OpportunityTeamMember[];
  contactRoles?: OpportunityContactRole[];
  capabilities?: OpportunityCapability[];
  notes?: OpportunityNote[];

  // Computed
  weightedAmount: number;
  weightedTcv: number;

  // Audit
  createdAt: string;
  createdByUserId?: string;
  updatedAt?: string;
  updatedByUserId?: string;
}

export interface OpportunityListDto {
  id: string;
  opportunityNumber: string;
  name: string;
  accountName?: string;
  accountId?: string;
  stageName: string;
  stageId: string;
  stageColor?: string;
  ownerName: string;
  ownerId: string;
  amount: number;
  totalContractValue: number;
  probabilityPercent: number;
  weightedAmount: number;
  closeDate: string;
  closeFiscalYear?: string;
  type: OpportunityType;
  result?: OpportunityResult;
  biddingEntityName?: string;
  // Key dates for calendar view
  plannedRfiSubmissionDate?: string;
  actualRfiSubmissionDate?: string;
  plannedRfpReleaseDate?: string;
  actualRfpReleaseDate?: string;
  plannedProposalSubmissionDate?: string;
  actualProposalSubmissionDate?: string;
  projectStartDate?: string;
  projectFinishDate?: string;
}

export interface CreateOpportunityDto {
  name: string;
  description?: string;
  accountId?: string;
  biddingEntityId?: string;
  contractVehicleId?: string;
  primaryContactId?: string;
  ownerId?: string;
  stageId: string;
  type?: OpportunityType;
  growthType?: GrowthType;
  acquisitionType?: string;  // Dynamic picklist value
  contractType?: string;     // Dynamic picklist value
  opportunityStatus?: string; // Dynamic picklist value
  portfolio?: string;         // Dynamic picklist value
  amount: number;
  totalContractValue?: number;
  probabilityPercent?: number;
  closeDate: string;
  closeFiscalYear?: string;
  closeFiscalQuarter?: string;
  includedInForecast?: boolean;
}

export interface UpdateOpportunityDto {
  name?: string;
  description?: string;
  accountId?: string;
  biddingEntityId?: string;
  contractVehicleId?: string;
  primaryContactId?: string;
  ownerId?: string;
  stageId?: string;
  type?: OpportunityType;
  growthType?: GrowthType;
  acquisitionType?: string;   // Dynamic picklist value
  contractType?: string;      // Dynamic picklist value
  opportunityStatus?: string; // Dynamic picklist value
  portfolio?: string;         // Dynamic picklist value
  amount?: number;
  totalContractValue?: number;
  probabilityPercent?: number;
  closeDate?: string;
  closeFiscalYear?: string;
  closeFiscalQuarter?: string;
  includedInForecast?: boolean;
  result?: OpportunityResult;
  lossReasonId?: string;
  customerFeedback?: string;
}

export interface PipelineSummary {
  stageId: string;
  stageName: string;
  sortOrder: number;
  color?: string;
  count: number;
  totalAmount: number;
  weightedAmount: number;
  totalTcv: number;
}

// Related entities for opportunities
export interface OpportunityTeamMember {
  id: string;
  opportunityId: string;
  userId: string;
  user?: { id: string; email: string; displayName?: string };
  role?: string;
  isPrimary: boolean;
  notes?: string;
}

export interface OpportunityContactRole {
  id: string;
  opportunityId: string;
  contactId: string;
  contact?: SalesContact;
  role?: string;
  isPrimary: boolean;
  notes?: string;
}

export interface OpportunityCapability {
  id: string;
  opportunityId: string;
  capabilityBusinessLine?: string;
  capability?: string;
  parentCapability?: string;
  percentage?: number;
  allocatedAmount?: number;
  weightedAmount?: number;
}

export interface LossReason {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ContractVehicle {
  id: string;
  tenantId: string;
  name: string;
  contractNumber?: string;
  description?: string;
  vehicleType?: string;
  issuingAgency?: string;
  awardDate?: string;
  startDate?: string;
  endDate?: string;
  expirationDate?: string;
  ceilingValue?: number;
  awardedValue?: number;
  remainingValue?: number;
  isActive: boolean;
  eligibilityNotes?: string;
  biddingEntityId?: string;
  biddingEntity?: BiddingEntity;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContractVehicleDto {
  name: string;
  contractNumber?: string;
  description?: string;
  vehicleType?: string;
  issuingAgency?: string;
  awardDate?: string;
  startDate?: string;
  endDate?: string;
  expirationDate?: string;
  ceilingValue?: number;
  awardedValue?: number;
  eligibilityNotes?: string;
  biddingEntityId?: string;
}

export interface UpdateContractVehicleDto {
  name?: string;
  contractNumber?: string;
  description?: string;
  vehicleType?: string;
  issuingAgency?: string;
  awardDate?: string;
  startDate?: string;
  endDate?: string;
  expirationDate?: string;
  ceilingValue?: number;
  awardedValue?: number;
  eligibilityNotes?: string;
  biddingEntityId?: string;
  isActive?: boolean;
}

// ============================================================================
// Sales Stage Types
// ============================================================================

export interface SalesStage {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  defaultProbability: number;
  color?: string;
  isActive: boolean;
  isWonStage: boolean;
  isLostStage: boolean;
  isClosedStage: boolean;
}

export interface CreateStageDto {
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
  defaultProbability?: number;
  color?: string;
  isWonStage?: boolean;
  isLostStage?: boolean;
  isClosedStage?: boolean;
}

export interface UpdateStageDto {
  name?: string;
  code?: string;
  description?: string;
  sortOrder?: number;
  defaultProbability?: number;
  color?: string;
  isActive?: boolean;
  isWonStage?: boolean;
  isLostStage?: boolean;
  isClosedStage?: boolean;
}

// ============================================================================
// Picklist Types
// ============================================================================

export interface SalesPicklistValue {
  id: string;
  tenantId: string;
  picklistDefinitionId: string;
  value: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  color?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesPicklistDefinition {
  id: string;
  tenantId: string;
  picklistName: string;
  displayLabel: string;
  description?: string;
  isSystemPicklist: boolean;
  allowMultiple: boolean;
  entityType?: string;
  fieldName?: string;
  isActive: boolean;
  sortOrder: number;
  values: SalesPicklistValue[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePicklistDto {
  picklistName: string;
  displayLabel: string;
  description?: string;
  entityType?: string;
  fieldName?: string;
  isSystemPicklist?: boolean;
  allowMultiple?: boolean;
  sortOrder?: number;
}

export interface UpdatePicklistDto {
  displayLabel?: string;
  description?: string;
  entityType?: string;
  fieldName?: string;
  allowMultiple?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreatePicklistValueDto {
  value: string;
  label?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdatePicklistValueDto {
  label?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// Sales Account Types
// ============================================================================

export interface SalesAccount {
  id: string;
  tenantId: string;
  name: string;
  acronym?: string;
  description?: string;
  parentAccountId?: string;
  parentAccount?: SalesAccount;
  accountType?: string;
  federalDepartment?: string;
  portfolio?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  website?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAccountDto {
  name: string;
  acronym?: string;
  description?: string;
  parentAccountId?: string;
  accountType?: string;
  federalDepartment?: string;
  portfolio?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

export interface UpdateAccountDto {
  name?: string;
  acronym?: string;
  description?: string;
  parentAccountId?: string;
  accountType?: string;
  federalDepartment?: string;
  portfolio?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  website?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================================================
// Sales Contact Types
// ============================================================================

export interface SalesContact {
  id: string;
  tenantId: string;
  accountId?: string;
  account?: SalesAccount;
  firstName: string;
  lastName: string;
  fullName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  linkedInUrl?: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateContactDto {
  accountId?: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  linkedInUrl?: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  notes?: string;
}

export interface UpdateContactDto {
  accountId?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  linkedInUrl?: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================================================
// Bidding Entity Types
// ============================================================================

export interface BiddingEntity {
  id: string;
  tenantId: string;
  name: string;
  legalName?: string;
  shortName?: string;
  dunsNumber?: string;
  cageCode?: string;
  ueiNumber?: string;
  taxId?: string;
  // SBA 8(a) Program
  is8a: boolean;
  sbaEntryDate?: string;
  sbaExpirationDate?: string;
  sbaGraduationDate?: string;
  // Certifications
  isSmallBusiness: boolean;
  isSDVOSB: boolean;
  isVOSB: boolean;
  isWOSB: boolean;
  isEDWOSB: boolean;
  isHUBZone: boolean;
  isSDB: boolean;
  // Address
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Status
  isActive: boolean;
  notes?: string;
  // Computed
  isSbaActive: boolean;
  daysUntilSbaExpiration?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBiddingEntityDto {
  name: string;
  legalName?: string;
  shortName?: string;
  dunsNumber?: string;
  cageCode?: string;
  ueiNumber?: string;
  taxId?: string;
  is8a?: boolean;
  sbaEntryDate?: string;
  sbaExpirationDate?: string;
  sbaGraduationDate?: string;
  isSmallBusiness?: boolean;
  isSDVOSB?: boolean;
  isVOSB?: boolean;
  isWOSB?: boolean;
  isEDWOSB?: boolean;
  isHUBZone?: boolean;
  isSDB?: boolean;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}

export interface UpdateBiddingEntityDto {
  name?: string;
  legalName?: string;
  shortName?: string;
  dunsNumber?: string;
  cageCode?: string;
  ueiNumber?: string;
  taxId?: string;
  is8a?: boolean;
  sbaEntryDate?: string;
  sbaExpirationDate?: string;
  sbaGraduationDate?: string;
  isSmallBusiness?: boolean;
  isSDVOSB?: boolean;
  isVOSB?: boolean;
  isWOSB?: boolean;
  isEDWOSB?: boolean;
  isHUBZone?: boolean;
  isSDB?: boolean;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface OpportunityListResponse {
  items: OpportunityListDto[];
  total: number;
}

// ============================================================================
// Opportunity Service Functions
// ============================================================================

export async function getOpportunities(params?: {
  search?: string;
  stageId?: string;
  ownerId?: string;
  accountId?: string;
  result?: OpportunityResult;
  skip?: number;
  take?: number;
}): Promise<OpportunityListResponse> {
  try {
    return await api.get<OpportunityListResponse>(`/salesops/opportunities${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getOpportunities', error, params);
    throw error;
  }
}

export async function getOpportunity(id: string): Promise<SalesOpportunity> {
  try {
    return await api.get<SalesOpportunity>(`/salesops/opportunities/${id}`);
  } catch (error) {
    logSalesOpsError('getOpportunity', error, { id });
    throw error;
  }
}

export async function createOpportunity(data: CreateOpportunityDto): Promise<SalesOpportunity> {
  try {
    return await api.post<SalesOpportunity>('/salesops/opportunities', data);
  } catch (error) {
    logSalesOpsError('createOpportunity', error);
    throw error;
  }
}

export async function updateOpportunity(id: string, data: UpdateOpportunityDto): Promise<void> {
  try {
    await api.put(`/salesops/opportunities/${id}`, data);
  } catch (error) {
    logSalesOpsError('updateOpportunity', error, { id });
    throw error;
  }
}

export async function deleteOpportunity(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/opportunities/${id}`);
  } catch (error) {
    logSalesOpsError('deleteOpportunity', error, { id });
    throw error;
  }
}

export async function getPipelineSummary(): Promise<PipelineSummary[]> {
  try {
    return await api.get<PipelineSummary[]>('/salesops/opportunities/pipeline-summary');
  } catch (error) {
    logSalesOpsError('getPipelineSummary', error);
    throw error;
  }
}

// ============================================================================
// Stage Service Functions
// ============================================================================

export async function getStages(includeInactive = false): Promise<SalesStage[]> {
  try {
    const params = includeInactive ? { includeInactive: true } : undefined;
    return await api.get<SalesStage[]>(`/salesops/stages${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getStages', error);
    throw error;
  }
}

export async function getStage(id: string): Promise<SalesStage> {
  try {
    return await api.get<SalesStage>(`/salesops/stages/${id}`);
  } catch (error) {
    logSalesOpsError('getStage', error, { id });
    throw error;
  }
}

export async function createStage(data: CreateStageDto): Promise<SalesStage> {
  try {
    return await api.post<SalesStage>('/salesops/stages', data);
  } catch (error) {
    logSalesOpsError('createStage', error);
    throw error;
  }
}

export async function updateStage(id: string, data: UpdateStageDto): Promise<void> {
  try {
    await api.put(`/salesops/stages/${id}`, data);
  } catch (error) {
    logSalesOpsError('updateStage', error, { id });
    throw error;
  }
}

export async function deleteStage(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/stages/${id}`);
  } catch (error) {
    logSalesOpsError('deleteStage', error, { id });
    throw error;
  }
}

export async function reorderStages(stageIds: string[]): Promise<void> {
  try {
    await api.put('/salesops/stages/reorder', stageIds);
  } catch (error) {
    logSalesOpsError('reorderStages', error);
    throw error;
  }
}

export async function seedDefaultStages(): Promise<SalesStage[]> {
  try {
    return await api.post<SalesStage[]>('/salesops/stages/seed-defaults');
  } catch (error) {
    logSalesOpsError('seedDefaultStages', error);
    throw error;
  }
}

// ============================================================================
// Account Service Functions
// ============================================================================

export async function getAccounts(params?: {
  search?: string;
  accountType?: string;
  includeInactive?: boolean;
}): Promise<SalesAccount[]> {
  try {
    return await api.get<SalesAccount[]>(`/salesops/accounts${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getAccounts', error, params);
    throw error;
  }
}

export async function getAccount(id: string): Promise<SalesAccount> {
  try {
    return await api.get<SalesAccount>(`/salesops/accounts/${id}`);
  } catch (error) {
    logSalesOpsError('getAccount', error, { id });
    throw error;
  }
}

export async function createAccount(data: CreateAccountDto): Promise<SalesAccount> {
  try {
    return await api.post<SalesAccount>('/salesops/accounts', data);
  } catch (error) {
    logSalesOpsError('createAccount', error);
    throw error;
  }
}

export async function updateAccount(id: string, data: UpdateAccountDto): Promise<void> {
  try {
    await api.put(`/salesops/accounts/${id}`, data);
  } catch (error) {
    logSalesOpsError('updateAccount', error, { id });
    throw error;
  }
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/accounts/${id}`);
  } catch (error) {
    logSalesOpsError('deleteAccount', error, { id });
    throw error;
  }
}

// ============================================================================
// Bidding Entity Service Functions
// ============================================================================

export async function getBiddingEntities(params?: {
  is8a?: boolean;
  includeInactive?: boolean;
}): Promise<BiddingEntity[]> {
  try {
    return await api.get<BiddingEntity[]>(`/salesops/bidding-entities${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getBiddingEntities', error, params);
    throw error;
  }
}

export async function getBiddingEntity(id: string): Promise<BiddingEntity> {
  try {
    return await api.get<BiddingEntity>(`/salesops/bidding-entities/${id}`);
  } catch (error) {
    logSalesOpsError('getBiddingEntity', error, { id });
    throw error;
  }
}

export async function createBiddingEntity(data: CreateBiddingEntityDto): Promise<BiddingEntity> {
  try {
    return await api.post<BiddingEntity>('/salesops/bidding-entities', data);
  } catch (error) {
    logSalesOpsError('createBiddingEntity', error);
    throw error;
  }
}

export async function updateBiddingEntity(id: string, data: UpdateBiddingEntityDto): Promise<void> {
  try {
    await api.put(`/salesops/bidding-entities/${id}`, data);
  } catch (error) {
    logSalesOpsError('updateBiddingEntity', error, { id });
    throw error;
  }
}

export async function deleteBiddingEntity(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/bidding-entities/${id}`);
  } catch (error) {
    logSalesOpsError('deleteBiddingEntity', error, { id });
    throw error;
  }
}

export async function getExpiringBiddingEntities(daysThreshold: number = 90): Promise<BiddingEntity[]> {
  try {
    return await api.get<BiddingEntity[]>(`/salesops/bidding-entities/expiring?days=${daysThreshold}`);
  } catch (error) {
    logSalesOpsError('getExpiringBiddingEntities', error, { daysThreshold });
    throw error;
  }
}

// ============================================================================
// Contact Service Functions
// ============================================================================

export async function getContacts(params?: {
  search?: string;
  accountId?: string;
  includeInactive?: boolean;
}): Promise<SalesContact[]> {
  try {
    return await api.get<SalesContact[]>(`/salesops/contacts${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getContacts', error, params);
    throw error;
  }
}

export async function getContact(id: string): Promise<SalesContact> {
  try {
    return await api.get<SalesContact>(`/salesops/contacts/${id}`);
  } catch (error) {
    logSalesOpsError('getContact', error, { id });
    throw error;
  }
}

export async function createContact(data: CreateContactDto): Promise<SalesContact> {
  try {
    return await api.post<SalesContact>('/salesops/contacts', data);
  } catch (error) {
    logSalesOpsError('createContact', error);
    throw error;
  }
}

export async function updateContact(id: string, data: UpdateContactDto): Promise<void> {
  try {
    await api.put(`/salesops/contacts/${id}`, data);
  } catch (error) {
    logSalesOpsError('updateContact', error, { id });
    throw error;
  }
}

export async function deleteContact(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/contacts/${id}`);
  } catch (error) {
    logSalesOpsError('deleteContact', error, { id });
    throw error;
  }
}

// ============================================================================
// Picklist Service Functions
// ============================================================================

export async function getPicklists(params?: {
  includeInactive?: boolean;
}): Promise<SalesPicklistDefinition[]> {
  try {
    return await api.get<SalesPicklistDefinition[]>(`/salesops/picklists${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getPicklists', error, params);
    throw error;
  }
}

export async function getPicklist(id: string): Promise<SalesPicklistDefinition> {
  try {
    return await api.get<SalesPicklistDefinition>(`/salesops/picklists/${id}`);
  } catch (error) {
    logSalesOpsError('getPicklist', error, { id });
    throw error;
  }
}

export async function getPicklistByName(name: string): Promise<SalesPicklistDefinition> {
  try {
    return await api.get<SalesPicklistDefinition>(`/salesops/picklists/by-name/${name}`);
  } catch (error) {
    logSalesOpsError('getPicklistByName', error, { name });
    throw error;
  }
}

export async function getPicklistValues(name: string): Promise<SalesPicklistValue[]> {
  try {
    return await api.get<SalesPicklistValue[]>(`/salesops/picklists/by-name/${name}/values`);
  } catch (error) {
    logSalesOpsError('getPicklistValues', error, { name });
    throw error;
  }
}

export async function createPicklist(data: CreatePicklistDto): Promise<SalesPicklistDefinition> {
  try {
    return await api.post<SalesPicklistDefinition>('/salesops/picklists', data);
  } catch (error) {
    logSalesOpsError('createPicklist', error);
    throw error;
  }
}

export async function updatePicklist(id: string, data: UpdatePicklistDto): Promise<void> {
  try {
    await api.put(`/salesops/picklists/${id}`, data);
  } catch (error) {
    logSalesOpsError('updatePicklist', error, { id });
    throw error;
  }
}

export async function deletePicklist(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/picklists/${id}`);
  } catch (error) {
    logSalesOpsError('deletePicklist', error, { id });
    throw error;
  }
}

export async function addPicklistValue(picklistId: string, data: CreatePicklistValueDto): Promise<SalesPicklistValue> {
  try {
    return await api.post<SalesPicklistValue>(`/salesops/picklists/${picklistId}/values`, data);
  } catch (error) {
    logSalesOpsError('addPicklistValue', error, { picklistId });
    throw error;
  }
}

export async function updatePicklistValue(
  picklistId: string,
  valueId: string,
  data: UpdatePicklistValueDto
): Promise<void> {
  try {
    await api.put(`/salesops/picklists/${picklistId}/values/${valueId}`, data);
  } catch (error) {
    logSalesOpsError('updatePicklistValue', error, { picklistId, valueId });
    throw error;
  }
}

export async function reorderPicklistValues(picklistId: string, valueIds: string[]): Promise<void> {
  try {
    await api.put(`/salesops/picklists/${picklistId}/values/reorder`, valueIds);
  } catch (error) {
    logSalesOpsError('reorderPicklistValues', error, { picklistId });
    throw error;
  }
}

export async function deletePicklistValue(picklistId: string, valueId: string): Promise<void> {
  try {
    await api.delete(`/salesops/picklists/${picklistId}/values/${valueId}`);
  } catch (error) {
    logSalesOpsError('deletePicklistValue', error, { picklistId, valueId });
    throw error;
  }
}

export async function seedDefaultPicklists(): Promise<SalesPicklistDefinition[]> {
  try {
    return await api.post<SalesPicklistDefinition[]>('/salesops/picklists/seed-defaults', {});
  } catch (error) {
    logSalesOpsError('seedDefaultPicklists', error);
    throw error;
  }
}

// ============================================================================
// Contract Vehicle Service Functions
// ============================================================================

export async function getContractVehicles(params?: {
  search?: string;
  vehicleType?: string;
  includeInactive?: boolean;
}): Promise<ContractVehicle[]> {
  try {
    return await api.get<ContractVehicle[]>(`/salesops/contract-vehicles${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getContractVehicles', error, params);
    throw error;
  }
}

export async function getContractVehicle(id: string): Promise<ContractVehicle> {
  try {
    return await api.get<ContractVehicle>(`/salesops/contract-vehicles/${id}`);
  } catch (error) {
    logSalesOpsError('getContractVehicle', error, { id });
    throw error;
  }
}

export async function createContractVehicle(data: CreateContractVehicleDto): Promise<ContractVehicle> {
  try {
    return await api.post<ContractVehicle>('/salesops/contract-vehicles', data);
  } catch (error) {
    logSalesOpsError('createContractVehicle', error);
    throw error;
  }
}

export async function updateContractVehicle(id: string, data: UpdateContractVehicleDto): Promise<void> {
  try {
    await api.put(`/salesops/contract-vehicles/${id}`, data);
  } catch (error) {
    logSalesOpsError('updateContractVehicle', error, { id });
    throw error;
  }
}

export async function deleteContractVehicle(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/contract-vehicles/${id}`);
  } catch (error) {
    logSalesOpsError('deleteContractVehicle', error, { id });
    throw error;
  }
}

// ============================================================================
// Custom Field Types
// ============================================================================

export enum CustomFieldType {
  Text = 0,
  TextArea = 1,
  Number = 2,
  Currency = 3,
  Percent = 4,
  Date = 5,
  DateTime = 6,
  Checkbox = 7,
  Picklist = 8,
  MultiPicklist = 9,
  Lookup = 10,
  Url = 11,
  Email = 12,
  Phone = 13,
}

export interface CustomFieldDefinition {
  id: string;
  entityType: string;
  fieldName: string;
  displayLabel: string;
  fieldType: CustomFieldType;
  picklistOptions?: string; // JSON array for picklist/multi-picklist
  defaultValue?: string;
  isRequired: boolean;
  isSearchable: boolean;
  isVisibleInList: boolean;
  section?: string;
  helpText?: string;
  sortOrder: number;
  isActive: boolean;
  lookupEntityType?: string;
}

export interface CustomFieldValue {
  id: string;
  fieldDefinitionId: string;
  fieldName: string;
  displayLabel: string;
  fieldType: CustomFieldType;
  entityType: string;
  entityId: string;
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  boolValue?: boolean;
  picklistValue?: string;
  lookupValue?: string;
}

export interface CreateCustomFieldDto {
  entityType: string;
  fieldName: string;
  displayLabel: string;
  fieldType: CustomFieldType;
  picklistOptions?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isSearchable?: boolean;
  isVisibleInList?: boolean;
  section?: string;
  helpText?: string;
  sortOrder?: number;
  lookupEntityType?: string;
}

export interface UpdateCustomFieldDto {
  displayLabel?: string;
  picklistOptions?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isSearchable?: boolean;
  isVisibleInList?: boolean;
  section?: string;
  helpText?: string;
  sortOrder?: number;
  isActive?: boolean;
  lookupEntityType?: string;
}

export interface SetCustomFieldValueDto {
  fieldDefinitionId: string;
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  boolValue?: boolean;
  picklistValue?: string;
  lookupValue?: string;
}

// ============================================================================
// Custom Field Service Functions
// ============================================================================

export async function getCustomFieldDefinitions(params?: {
  entityType?: string;
  includeInactive?: boolean;
}): Promise<CustomFieldDefinition[]> {
  try {
    return await api.get<CustomFieldDefinition[]>(`/salesops/customfields/definitions${buildQueryString(params)}`);
  } catch (error) {
    logSalesOpsError('getCustomFieldDefinitions', error, params);
    throw error;
  }
}

export async function getCustomFieldDefinition(id: string): Promise<CustomFieldDefinition> {
  try {
    return await api.get<CustomFieldDefinition>(`/salesops/customfields/definitions/${id}`);
  } catch (error) {
    logSalesOpsError('getCustomFieldDefinition', error, { id });
    throw error;
  }
}

export async function createCustomFieldDefinition(data: CreateCustomFieldDto): Promise<CustomFieldDefinition> {
  try {
    return await api.post<CustomFieldDefinition>('/salesops/customfields/definitions', data);
  } catch (error) {
    logSalesOpsError('createCustomFieldDefinition', error);
    throw error;
  }
}

export async function updateCustomFieldDefinition(id: string, data: UpdateCustomFieldDto): Promise<void> {
  try {
    await api.put(`/salesops/customfields/definitions/${id}`, data);
  } catch (error) {
    logSalesOpsError('updateCustomFieldDefinition', error, { id });
    throw error;
  }
}

export async function deleteCustomFieldDefinition(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/customfields/definitions/${id}`);
  } catch (error) {
    logSalesOpsError('deleteCustomFieldDefinition', error, { id });
    throw error;
  }
}

export async function reorderCustomFieldDefinitions(fieldIds: string[]): Promise<void> {
  try {
    await api.put('/salesops/customfields/definitions/reorder', fieldIds);
  } catch (error) {
    logSalesOpsError('reorderCustomFieldDefinitions', error);
    throw error;
  }
}

export async function getCustomFieldValues(entityType: string, entityId: string): Promise<CustomFieldValue[]> {
  try {
    return await api.get<CustomFieldValue[]>(`/salesops/customfields/values/${entityType}/${entityId}`);
  } catch (error) {
    logSalesOpsError('getCustomFieldValues', error, { entityType, entityId });
    throw error;
  }
}

export async function setCustomFieldValues(entityType: string, entityId: string, values: SetCustomFieldValueDto[]): Promise<void> {
  try {
    await api.put(`/salesops/customfields/values/${entityType}/${entityId}`, values);
  } catch (error) {
    logSalesOpsError('setCustomFieldValues', error, { entityType, entityId });
    throw error;
  }
}

export async function deleteCustomFieldValue(id: string): Promise<void> {
  try {
    await api.delete(`/salesops/customfields/values/${id}`);
  } catch (error) {
    logSalesOpsError('deleteCustomFieldValue', error, { id });
    throw error;
  }
}

export async function getCustomFieldSections(entityType: string): Promise<string[]> {
  try {
    return await api.get<string[]>(`/salesops/customfields/sections/${entityType}`);
  } catch (error) {
    logSalesOpsError('getCustomFieldSections', error, { entityType });
    throw error;
  }
}

export async function seedDefaultFieldDefinitions(): Promise<{ created: number; existing: number }> {
  try {
    return await api.post<{ created: number; existing: number }>('/salesops/customfields/definitions/seed', {});
  } catch (error) {
    logSalesOpsError('seedDefaultFieldDefinitions', error);
    throw error;
  }
}

// ============================================================================
// Opportunity Notes Types
// ============================================================================

export interface OpportunityNote {
  id: string;
  content: string;
  noteType?: string;
  createdAt: string;
  createdByUserId?: string;
  createdByUserName?: string;
}

export interface CreateNoteDto {
  content: string;
  noteType?: string;
}

export interface UpdateNoteDto {
  content: string;
  noteType?: string;
}

// ============================================================================
// Opportunity Team Member Types
// ============================================================================

export interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role?: string;
  isPrimary: boolean;
  notes?: string;
}

export interface CreateTeamMemberDto {
  userId: string;
  role?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateTeamMemberDto {
  role?: string;
  isPrimary?: boolean;
  notes?: string;
}

// ============================================================================
// Opportunity Contact Role Types
// ============================================================================

export interface ContactRole {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTitle?: string;
  accountName?: string;
  role?: string;
  isPrimary: boolean;
  notes?: string;
}

export interface CreateContactRoleDto {
  contactId: string;
  role?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateContactRoleDto {
  role?: string;
  isPrimary?: boolean;
  notes?: string;
}

// ============================================================================
// Field History Types
// ============================================================================

export interface FieldHistory {
  id: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
  changedByUserId: string;
  changedByUserName?: string;
}

// ============================================================================
// Activity Feed Types
// ============================================================================

export interface ActivityFeedItem {
  id: string;
  type: 'note' | 'field_change';
  subtype?: string;
  content: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

// ============================================================================
// Opportunity Notes Service Functions
// ============================================================================

export async function getOpportunityNotes(opportunityId: string): Promise<OpportunityNote[]> {
  try {
    return await api.get<OpportunityNote[]>(`/salesops/opportunities/${opportunityId}/notes`);
  } catch (error) {
    logSalesOpsError('getOpportunityNotes', error, { opportunityId });
    throw error;
  }
}

export async function addOpportunityNote(opportunityId: string, data: CreateNoteDto): Promise<OpportunityNote> {
  try {
    return await api.post<OpportunityNote>(`/salesops/opportunities/${opportunityId}/notes`, data);
  } catch (error) {
    logSalesOpsError('addOpportunityNote', error, { opportunityId });
    throw error;
  }
}

export async function updateOpportunityNote(opportunityId: string, noteId: string, data: UpdateNoteDto): Promise<void> {
  try {
    await api.put(`/salesops/opportunities/${opportunityId}/notes/${noteId}`, data);
  } catch (error) {
    logSalesOpsError('updateOpportunityNote', error, { opportunityId, noteId });
    throw error;
  }
}

export async function deleteOpportunityNote(opportunityId: string, noteId: string): Promise<void> {
  try {
    await api.delete(`/salesops/opportunities/${opportunityId}/notes/${noteId}`);
  } catch (error) {
    logSalesOpsError('deleteOpportunityNote', error, { opportunityId, noteId });
    throw error;
  }
}

// ============================================================================
// Opportunity Team Members Service Functions
// ============================================================================

export async function getOpportunityTeamMembers(opportunityId: string): Promise<TeamMember[]> {
  try {
    return await api.get<TeamMember[]>(`/salesops/opportunities/${opportunityId}/team-members`);
  } catch (error) {
    logSalesOpsError('getOpportunityTeamMembers', error, { opportunityId });
    throw error;
  }
}

export async function addOpportunityTeamMember(opportunityId: string, data: CreateTeamMemberDto): Promise<TeamMember> {
  try {
    return await api.post<TeamMember>(`/salesops/opportunities/${opportunityId}/team-members`, data);
  } catch (error) {
    logSalesOpsError('addOpportunityTeamMember', error, { opportunityId });
    throw error;
  }
}

export async function updateOpportunityTeamMember(opportunityId: string, teamMemberId: string, data: UpdateTeamMemberDto): Promise<void> {
  try {
    await api.put(`/salesops/opportunities/${opportunityId}/team-members/${teamMemberId}`, data);
  } catch (error) {
    logSalesOpsError('updateOpportunityTeamMember', error, { opportunityId, teamMemberId });
    throw error;
  }
}

export async function removeOpportunityTeamMember(opportunityId: string, teamMemberId: string): Promise<void> {
  try {
    await api.delete(`/salesops/opportunities/${opportunityId}/team-members/${teamMemberId}`);
  } catch (error) {
    logSalesOpsError('removeOpportunityTeamMember', error, { opportunityId, teamMemberId });
    throw error;
  }
}

// ============================================================================
// Opportunity Contact Roles Service Functions
// ============================================================================

export async function getOpportunityContactRoles(opportunityId: string): Promise<ContactRole[]> {
  try {
    return await api.get<ContactRole[]>(`/salesops/opportunities/${opportunityId}/contact-roles`);
  } catch (error) {
    logSalesOpsError('getOpportunityContactRoles', error, { opportunityId });
    throw error;
  }
}

export async function addOpportunityContactRole(opportunityId: string, data: CreateContactRoleDto): Promise<ContactRole> {
  try {
    return await api.post<ContactRole>(`/salesops/opportunities/${opportunityId}/contact-roles`, data);
  } catch (error) {
    logSalesOpsError('addOpportunityContactRole', error, { opportunityId });
    throw error;
  }
}

export async function updateOpportunityContactRole(opportunityId: string, contactRoleId: string, data: UpdateContactRoleDto): Promise<void> {
  try {
    await api.put(`/salesops/opportunities/${opportunityId}/contact-roles/${contactRoleId}`, data);
  } catch (error) {
    logSalesOpsError('updateOpportunityContactRole', error, { opportunityId, contactRoleId });
    throw error;
  }
}

export async function removeOpportunityContactRole(opportunityId: string, contactRoleId: string): Promise<void> {
  try {
    await api.delete(`/salesops/opportunities/${opportunityId}/contact-roles/${contactRoleId}`);
  } catch (error) {
    logSalesOpsError('removeOpportunityContactRole', error, { opportunityId, contactRoleId });
    throw error;
  }
}

// ============================================================================
// Field History Service Functions
// ============================================================================

export async function getOpportunityFieldHistory(opportunityId: string, take = 50): Promise<FieldHistory[]> {
  try {
    return await api.get<FieldHistory[]>(`/salesops/opportunities/${opportunityId}/field-history?take=${take}`);
  } catch (error) {
    logSalesOpsError('getOpportunityFieldHistory', error, { opportunityId });
    throw error;
  }
}

// ============================================================================
// Activity Feed Service Functions
// ============================================================================

export async function getOpportunityActivityFeed(opportunityId: string, take = 50): Promise<ActivityFeedItem[]> {
  try {
    return await api.get<ActivityFeedItem[]>(`/salesops/opportunities/${opportunityId}/activity?take=${take}`);
  } catch (error) {
    logSalesOpsError('getOpportunityActivityFeed', error, { opportunityId });
    throw error;
  }
}

// ============================================================================
// Export all as salesOpsService object for convenience
// ============================================================================

export const salesOpsService = {
  // Opportunities
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getPipelineSummary,
  // Stages
  getStages,
  getStage,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  seedDefaultStages,
  // Accounts
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  // Bidding Entities
  getBiddingEntities,
  getBiddingEntity,
  createBiddingEntity,
  updateBiddingEntity,
  deleteBiddingEntity,
  getExpiringBiddingEntities,
  // Contacts
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  // Contract Vehicles
  getContractVehicles,
  getContractVehicle,
  createContractVehicle,
  updateContractVehicle,
  deleteContractVehicle,
  // Picklists
  getPicklists,
  getPicklist,
  getPicklistByName,
  getPicklistValues,
  createPicklist,
  updatePicklist,
  deletePicklist,
  addPicklistValue,
  updatePicklistValue,
  reorderPicklistValues,
  deletePicklistValue,
  seedDefaultPicklists,
  // Custom Fields
  getCustomFieldDefinitions,
  getCustomFieldDefinition,
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  reorderCustomFieldDefinitions,
  getCustomFieldValues,
  setCustomFieldValues,
  deleteCustomFieldValue,
  getCustomFieldSections,
  seedDefaultFieldDefinitions,
  // Opportunity Notes
  getOpportunityNotes,
  addOpportunityNote,
  updateOpportunityNote,
  deleteOpportunityNote,
  // Opportunity Team Members
  getOpportunityTeamMembers,
  addOpportunityTeamMember,
  updateOpportunityTeamMember,
  removeOpportunityTeamMember,
  // Opportunity Contact Roles
  getOpportunityContactRoles,
  addOpportunityContactRole,
  updateOpportunityContactRole,
  removeOpportunityContactRole,
  // Field History & Activity
  getOpportunityFieldHistory,
  getOpportunityActivityFeed,
};

export default salesOpsService;
