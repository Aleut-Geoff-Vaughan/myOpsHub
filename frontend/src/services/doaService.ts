import { api } from '../lib/api-client';
import type {
  DelegationOfAuthorityLetter,
  CreateDOALetterRequest,
  UpdateDOALetterRequest,
  SignatureRequest,
  DOAFilter,
  DigitalSignature,
} from '../types/doa';

export const doaService = {
  /**
   * Get all DOA letters (filtered by created/assigned/all)
   */
  async getDOALetters(filter: DOAFilter = 'all'): Promise<DelegationOfAuthorityLetter[]> {
    const url = `/delegationofauthority?filter=${filter}`;
    return api.get<DelegationOfAuthorityLetter[]>(url);
  },

  /**
   * Get a specific DOA letter by ID
   */
  async getDOALetter(id: string): Promise<DelegationOfAuthorityLetter> {
    return api.get<DelegationOfAuthorityLetter>(`/delegationofauthority/${id}`);
  },

  /**
   * Create a new DOA letter (draft status)
   */
  async createDOALetter(
    request: CreateDOALetterRequest
  ): Promise<DelegationOfAuthorityLetter> {
    return api.post<DelegationOfAuthorityLetter>('/delegationofauthority', request);
  },

  /**
   * Update an existing DOA letter (draft only)
   */
  async updateDOALetter(id: string, request: UpdateDOALetterRequest): Promise<void> {
    await api.put(`/delegationofauthority/${id}`, request);
  },

  /**
   * Delete a DOA letter (draft only)
   */
  async deleteDOALetter(id: string): Promise<void> {
    await api.delete(`/delegationofauthority/${id}`);
  },

  /**
   * Sign a DOA letter (delegator or designee)
   */
  async signDOALetter(id: string, request: SignatureRequest): Promise<DigitalSignature> {
    return api.post<DigitalSignature>(`/delegationofauthority/${id}/sign`, request);
  },

  /**
   * Revoke an active DOA letter
   */
  async revokeDOALetter(id: string): Promise<void> {
    await api.post(`/delegationofauthority/${id}/revoke`);
  },

  /**
   * Get Active DOA letters whose effective dates overlap with a date range
   */
  async getActiveLettersInRange(startDate: string, endDate: string): Promise<DelegationOfAuthorityLetter[]> {
    return api.get<DelegationOfAuthorityLetter[]>(
      `/delegationofauthority/letters/range?startDate=${startDate}&endDate=${endDate}`
    );
  },
};
