import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getPipelineSummary,
  getStages,
  getStage,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  seedDefaultStages,
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getBiddingEntities,
  getBiddingEntity,
  createBiddingEntity,
  updateBiddingEntity,
  deleteBiddingEntity,
  getExpiringBiddingEntities,
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContractVehicles,
  getContractVehicle,
  createContractVehicle,
  updateContractVehicle,
  deleteContractVehicle,
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
  // Notes, Team Members, Contact Roles, Activity
  getOpportunityNotes,
  addOpportunityNote,
  updateOpportunityNote,
  deleteOpportunityNote,
  getOpportunityTeamMembers,
  addOpportunityTeamMember,
  updateOpportunityTeamMember,
  removeOpportunityTeamMember,
  getOpportunityContactRoles,
  addOpportunityContactRole,
  updateOpportunityContactRole,
  removeOpportunityContactRole,
  getOpportunityFieldHistory,
  getOpportunityActivityFeed,
  type OpportunityResult,
  type CreateOpportunityDto,
  type UpdateOpportunityDto,
  type CreateStageDto,
  type UpdateStageDto,
  type CreateAccountDto,
  type UpdateAccountDto,
  type CreateBiddingEntityDto,
  type UpdateBiddingEntityDto,
  type CreateContactDto,
  type UpdateContactDto,
  type CreateContractVehicleDto,
  type UpdateContractVehicleDto,
  type CreatePicklistDto,
  type UpdatePicklistDto,
  type CreatePicklistValueDto,
  type UpdatePicklistValueDto,
  type CreateCustomFieldDto,
  type UpdateCustomFieldDto,
  type SetCustomFieldValueDto,
  type CreateNoteDto,
  type UpdateNoteDto,
  type CreateTeamMemberDto,
  type UpdateTeamMemberDto,
  type CreateContactRoleDto,
  type UpdateContactRoleDto,
} from '../services/salesOpsService';

// ============================================================================
// Query Keys
// ============================================================================

export const salesOpsKeys = {
  all: ['salesops'] as const,
  // Opportunities
  opportunities: () => [...salesOpsKeys.all, 'opportunities'] as const,
  opportunitiesList: (filters?: Record<string, unknown>) =>
    [...salesOpsKeys.opportunities(), 'list', filters] as const,
  opportunity: (id: string) => [...salesOpsKeys.opportunities(), id] as const,
  pipelineSummary: () => [...salesOpsKeys.opportunities(), 'pipeline-summary'] as const,
  // Stages
  stages: () => [...salesOpsKeys.all, 'stages'] as const,
  stagesList: (includeInactive?: boolean) =>
    [...salesOpsKeys.stages(), 'list', { includeInactive }] as const,
  stage: (id: string) => [...salesOpsKeys.stages(), id] as const,
  // Accounts
  accounts: () => [...salesOpsKeys.all, 'accounts'] as const,
  accountsList: (filters?: Record<string, unknown>) =>
    [...salesOpsKeys.accounts(), 'list', filters] as const,
  account: (id: string) => [...salesOpsKeys.accounts(), id] as const,
  // Bidding Entities
  biddingEntities: () => [...salesOpsKeys.all, 'bidding-entities'] as const,
  biddingEntitiesList: (filters?: Record<string, unknown>) =>
    [...salesOpsKeys.biddingEntities(), 'list', filters] as const,
  biddingEntity: (id: string) => [...salesOpsKeys.biddingEntities(), id] as const,
  expiringBiddingEntities: (days: number) =>
    [...salesOpsKeys.biddingEntities(), 'expiring', days] as const,
  // Contacts
  contacts: () => [...salesOpsKeys.all, 'contacts'] as const,
  contactsList: (filters?: Record<string, unknown>) =>
    [...salesOpsKeys.contacts(), 'list', filters] as const,
  contact: (id: string) => [...salesOpsKeys.contacts(), id] as const,
  // Contract Vehicles
  contractVehicles: () => [...salesOpsKeys.all, 'contract-vehicles'] as const,
  contractVehiclesList: (filters?: Record<string, unknown>) =>
    [...salesOpsKeys.contractVehicles(), 'list', filters] as const,
  contractVehicle: (id: string) => [...salesOpsKeys.contractVehicles(), id] as const,
  // Picklists
  picklists: () => [...salesOpsKeys.all, 'picklists'] as const,
  picklistsList: (includeInactive?: boolean) =>
    [...salesOpsKeys.picklists(), 'list', { includeInactive }] as const,
  picklist: (id: string) => [...salesOpsKeys.picklists(), id] as const,
  picklistByName: (name: string) => [...salesOpsKeys.picklists(), 'by-name', name] as const,
  picklistValues: (name: string) => [...salesOpsKeys.picklists(), 'values', name] as const,
  // Custom Fields
  customFields: () => [...salesOpsKeys.all, 'custom-fields'] as const,
  customFieldsList: (entityType?: string, includeInactive?: boolean) =>
    [...salesOpsKeys.customFields(), 'list', { entityType, includeInactive }] as const,
  customField: (id: string) => [...salesOpsKeys.customFields(), id] as const,
  customFieldValues: (entityType: string, entityId: string) =>
    [...salesOpsKeys.customFields(), 'values', entityType, entityId] as const,
  customFieldSections: (entityType: string) =>
    [...salesOpsKeys.customFields(), 'sections', entityType] as const,
};

// ============================================================================
// Opportunity Hooks
// ============================================================================

export function useOpportunities(params?: {
  search?: string;
  stageId?: string;
  ownerId?: string;
  accountId?: string;
  result?: OpportunityResult;
  skip?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: salesOpsKeys.opportunitiesList(params),
    queryFn: () => getOpportunities(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useOpportunity(id: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.opportunity(id!),
    queryFn: () => getOpportunity(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePipelineSummary() {
  return useQuery({
    queryKey: salesOpsKeys.pipelineSummary(),
    queryFn: getPipelineSummary,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOpportunityDto) => createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.opportunities() });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOpportunityDto }) =>
      updateOpportunity(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.opportunity(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.opportunitiesList() });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.pipelineSummary() });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.opportunities() });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.pipelineSummary() });
    },
  });
}

// ============================================================================
// Stage Hooks
// ============================================================================

export function useStages(includeInactive = false) {
  return useQuery({
    queryKey: salesOpsKeys.stagesList(includeInactive),
    queryFn: () => getStages(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes (stages don't change often)
  });
}

export function useStage(id: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.stage(id!),
    queryFn: () => getStage(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStageDto) => createStage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.stages() });
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStageDto }) =>
      updateStage(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.stage(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.stagesList() });
    },
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.stages() });
    },
  });
}

export function useReorderStages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stageIds: string[]) => reorderStages(stageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.stages() });
    },
  });
}

export function useSeedDefaultStages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedDefaultStages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.stages() });
    },
  });
}

// ============================================================================
// Account Hooks
// ============================================================================

export function useAccounts(params?: {
  search?: string;
  accountType?: string;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: salesOpsKeys.accountsList(params),
    queryFn: () => getAccounts(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.account(id!),
    queryFn: () => getAccount(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountDto) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.accounts() });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountDto }) =>
      updateAccount(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.account(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.accountsList() });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.accounts() });
    },
  });
}

// ============================================================================
// Bidding Entity Hooks
// ============================================================================

export function useBiddingEntities(params?: {
  is8a?: boolean;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: salesOpsKeys.biddingEntitiesList(params),
    queryFn: () => getBiddingEntities(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useBiddingEntity(id: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.biddingEntity(id!),
    queryFn: () => getBiddingEntity(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useExpiringBiddingEntities(daysThreshold = 90) {
  return useQuery({
    queryKey: salesOpsKeys.expiringBiddingEntities(daysThreshold),
    queryFn: () => getExpiringBiddingEntities(daysThreshold),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateBiddingEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBiddingEntityDto) => createBiddingEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.biddingEntities() });
    },
  });
}

export function useUpdateBiddingEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBiddingEntityDto }) =>
      updateBiddingEntity(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.biddingEntity(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.biddingEntitiesList() });
    },
  });
}

export function useDeleteBiddingEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBiddingEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.biddingEntities() });
    },
  });
}

// ============================================================================
// Contact Hooks
// ============================================================================

export function useContacts(params?: {
  search?: string;
  accountId?: string;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: salesOpsKeys.contactsList(params),
    queryFn: () => getContacts(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.contact(id!),
    queryFn: () => getContact(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactDto) => createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contacts() });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      updateContact(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contact(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contactsList() });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contacts() });
    },
  });
}

// ============================================================================
// Contract Vehicle Hooks
// ============================================================================

export function useContractVehicles(params?: {
  search?: string;
  vehicleType?: string;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: salesOpsKeys.contractVehiclesList(params),
    queryFn: () => getContractVehicles(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useContractVehicle(id: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.contractVehicle(id!),
    queryFn: () => getContractVehicle(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateContractVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContractVehicleDto) => createContractVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contractVehicles() });
    },
  });
}

export function useUpdateContractVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractVehicleDto }) =>
      updateContractVehicle(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contractVehicle(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contractVehiclesList() });
    },
  });
}

export function useDeleteContractVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContractVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.contractVehicles() });
    },
  });
}

// ============================================================================
// Picklist Hooks
// ============================================================================

export function usePicklists(params?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: salesOpsKeys.picklistsList(params?.includeInactive),
    queryFn: () => getPicklists(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - picklists don't change often
  });
}

export function usePicklist(id: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.picklist(id!),
    queryFn: () => getPicklist(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePicklistByName(name: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.picklistByName(name!),
    queryFn: () => getPicklistByName(name!),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get just the values for a picklist - ideal for dropdowns
 */
export function usePicklistValues(name: string | undefined) {
  return useQuery({
    queryKey: salesOpsKeys.picklistValues(name!),
    queryFn: () => getPicklistValues(name!),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePicklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePicklistDto) => createPicklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklists() });
    },
  });
}

export function useUpdatePicklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePicklistDto }) =>
      updatePicklist(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklist(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklistsList() });
    },
  });
}

export function useDeletePicklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePicklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklists() });
    },
  });
}

export function useAddPicklistValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ picklistId, data }: { picklistId: string; data: CreatePicklistValueDto }) =>
      addPicklistValue(picklistId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklist(variables.picklistId) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklistsList() });
      // Also invalidate any cached values
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklists() });
    },
  });
}

export function useUpdatePicklistValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      picklistId,
      valueId,
      data,
    }: {
      picklistId: string;
      valueId: string;
      data: UpdatePicklistValueDto;
    }) => updatePicklistValue(picklistId, valueId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklist(variables.picklistId) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklistsList() });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklists() });
    },
  });
}

export function useReorderPicklistValues() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ picklistId, valueIds }: { picklistId: string; valueIds: string[] }) =>
      reorderPicklistValues(picklistId, valueIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklist(variables.picklistId) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklists() });
    },
  });
}

export function useDeletePicklistValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ picklistId, valueId }: { picklistId: string; valueId: string }) =>
      deletePicklistValue(picklistId, valueId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklist(variables.picklistId) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklistsList() });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklists() });
    },
  });
}

export function useSeedDefaultPicklists() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => seedDefaultPicklists(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.picklists() });
    },
  });
}

// ============================================================================
// Custom Field Hooks
// ============================================================================

export function useCustomFieldDefinitions(params?: {
  entityType?: string;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: salesOpsKeys.customFieldsList(params?.entityType, params?.includeInactive),
    queryFn: () => getCustomFieldDefinitions(params),
  });
}

export function useCustomFieldDefinition(id?: string) {
  return useQuery({
    queryKey: salesOpsKeys.customField(id || ''),
    queryFn: () => getCustomFieldDefinition(id!),
    enabled: !!id,
  });
}

export function useCreateCustomFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomFieldDto) => createCustomFieldDefinition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.customFields() });
    },
  });
}

export function useUpdateCustomFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomFieldDto }) =>
      updateCustomFieldDefinition(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.customField(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.customFields() });
    },
  });
}

export function useDeleteCustomFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomFieldDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.customFields() });
    },
  });
}

export function useReorderCustomFieldDefinitions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldIds: string[]) => reorderCustomFieldDefinitions(fieldIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.customFields() });
    },
  });
}

export function useCustomFieldValues(entityType: string, entityId?: string) {
  return useQuery({
    queryKey: salesOpsKeys.customFieldValues(entityType, entityId || ''),
    queryFn: () => getCustomFieldValues(entityType, entityId!),
    enabled: !!entityId,
  });
}

export function useSetCustomFieldValues() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      values,
    }: {
      entityType: string;
      entityId: string;
      values: SetCustomFieldValueDto[];
    }) => setCustomFieldValues(entityType, entityId, values),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: salesOpsKeys.customFieldValues(variables.entityType, variables.entityId),
      });
    },
  });
}

export function useDeleteCustomFieldValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomFieldValue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.customFields() });
    },
  });
}

export function useCustomFieldSections(entityType: string) {
  return useQuery({
    queryKey: salesOpsKeys.customFieldSections(entityType),
    queryFn: () => getCustomFieldSections(entityType),
    enabled: !!entityType,
  });
}

export function useSeedDefaultFieldDefinitions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedDefaultFieldDefinitions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOpsKeys.customFields() });
    },
  });
}

// ============================================================================
// Opportunity Notes Hooks
// ============================================================================

export function useOpportunityNotes(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['salesops', 'opportunities', opportunityId, 'notes'],
    queryFn: () => getOpportunityNotes(opportunityId!),
    enabled: !!opportunityId,
  });
}

export function useAddOpportunityNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, data }: { opportunityId: string; data: CreateNoteDto }) =>
      addOpportunityNote(opportunityId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'notes'],
      });
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'activity'],
      });
    },
  });
}

export function useUpdateOpportunityNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opportunityId,
      noteId,
      data,
    }: {
      opportunityId: string;
      noteId: string;
      data: UpdateNoteDto;
    }) => updateOpportunityNote(opportunityId, noteId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'notes'],
      });
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'activity'],
      });
    },
  });
}

export function useDeleteOpportunityNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, noteId }: { opportunityId: string; noteId: string }) =>
      deleteOpportunityNote(opportunityId, noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'notes'],
      });
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'activity'],
      });
    },
  });
}

// ============================================================================
// Opportunity Team Members Hooks
// ============================================================================

export function useOpportunityTeamMembers(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['salesops', 'opportunities', opportunityId, 'team-members'],
    queryFn: () => getOpportunityTeamMembers(opportunityId!),
    enabled: !!opportunityId,
  });
}

export function useAddOpportunityTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, data }: { opportunityId: string; data: CreateTeamMemberDto }) =>
      addOpportunityTeamMember(opportunityId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'team-members'],
      });
    },
  });
}

export function useUpdateOpportunityTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opportunityId,
      teamMemberId,
      data,
    }: {
      opportunityId: string;
      teamMemberId: string;
      data: UpdateTeamMemberDto;
    }) => updateOpportunityTeamMember(opportunityId, teamMemberId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'team-members'],
      });
    },
  });
}

export function useRemoveOpportunityTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, teamMemberId }: { opportunityId: string; teamMemberId: string }) =>
      removeOpportunityTeamMember(opportunityId, teamMemberId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'team-members'],
      });
    },
  });
}

// ============================================================================
// Opportunity Contact Roles Hooks
// ============================================================================

export function useOpportunityContactRoles(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['salesops', 'opportunities', opportunityId, 'contact-roles'],
    queryFn: () => getOpportunityContactRoles(opportunityId!),
    enabled: !!opportunityId,
  });
}

export function useAddOpportunityContactRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, data }: { opportunityId: string; data: CreateContactRoleDto }) =>
      addOpportunityContactRole(opportunityId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'contact-roles'],
      });
    },
  });
}

export function useUpdateOpportunityContactRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opportunityId,
      contactRoleId,
      data,
    }: {
      opportunityId: string;
      contactRoleId: string;
      data: UpdateContactRoleDto;
    }) => updateOpportunityContactRole(opportunityId, contactRoleId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'contact-roles'],
      });
    },
  });
}

export function useRemoveOpportunityContactRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      opportunityId,
      contactRoleId,
    }: {
      opportunityId: string;
      contactRoleId: string;
    }) => removeOpportunityContactRole(opportunityId, contactRoleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['salesops', 'opportunities', variables.opportunityId, 'contact-roles'],
      });
    },
  });
}

// ============================================================================
// Field History & Activity Feed Hooks
// ============================================================================

export function useOpportunityFieldHistory(opportunityId: string | undefined, take = 50) {
  return useQuery({
    queryKey: ['salesops', 'opportunities', opportunityId, 'field-history', take],
    queryFn: () => getOpportunityFieldHistory(opportunityId!, take),
    enabled: !!opportunityId,
  });
}

export function useOpportunityActivityFeed(opportunityId: string | undefined, take = 50) {
  return useQuery({
    queryKey: ['salesops', 'opportunities', opportunityId, 'activity', take],
    queryFn: () => getOpportunityActivityFeed(opportunityId!, take),
    enabled: !!opportunityId,
  });
}
