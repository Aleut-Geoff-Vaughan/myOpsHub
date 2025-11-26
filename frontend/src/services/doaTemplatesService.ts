import { api } from '../lib/api-client';
import type {
  DOATemplate,
  CreateDOATemplateRequest,
  UpdateDOATemplateRequest,
} from '../types/doa';

export const doaTemplatesService = {
  // Get all DOA templates
  async getTemplates(): Promise<DOATemplate[]> {
    const response = await api.get('/doatemplates');
    return response.data;
  },

  // Get a single DOA template by ID
  async getTemplate(id: string): Promise<DOATemplate> {
    const response = await api.get(`/doatemplates/${id}`);
    return response.data;
  },

  // Create a new DOA template
  async createTemplate(request: CreateDOATemplateRequest): Promise<DOATemplate> {
    const response = await api.post('/doatemplates', request);
    return response.data;
  },

  // Update an existing DOA template
  async updateTemplate(
    id: string,
    request: UpdateDOATemplateRequest
  ): Promise<void> {
    await api.put(`/doatemplates/${id}`, request);
  },

  // Delete (soft delete) a DOA template
  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/doatemplates/${id}`);
  },
};
