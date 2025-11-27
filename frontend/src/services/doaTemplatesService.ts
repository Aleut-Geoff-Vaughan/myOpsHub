import { api } from '../lib/api-client';
import type {
  DOATemplate,
  CreateDOATemplateRequest,
  UpdateDOATemplateRequest,
} from '../types/doa';

export const doaTemplatesService = {
  // Get all DOA templates
  async getTemplates(): Promise<DOATemplate[]> {
    return await api.get<DOATemplate[]>('/doatemplates');
  },

  // Get a single DOA template by ID
  async getTemplate(id: string): Promise<DOATemplate> {
    return await api.get<DOATemplate>(`/doatemplates/${id}`);
  },

  // Create a new DOA template
  async createTemplate(request: CreateDOATemplateRequest): Promise<DOATemplate> {
    return await api.post<DOATemplate>('/doatemplates', request);
  },

  // Update an existing DOA template
  async updateTemplate(
    id: string,
    request: UpdateDOATemplateRequest
  ): Promise<void> {
    await api.put<void>(`/doatemplates/${id}`, request);
  },

  // Delete (soft delete) a DOA template
  async deleteTemplate(id: string): Promise<void> {
    await api.delete<void>(`/doatemplates/${id}`);
  },
};
