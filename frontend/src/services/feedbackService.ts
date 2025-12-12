import { api } from '../lib/api-client';
import type {
  Feedback,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackStats,
  FeedbackStatus,
  FeedbackType,
} from '../types/feedback';

const BASE_URL = '/feedback';

export const feedbackService = {
  // Get all feedback for the current tenant (admin view)
  getAll: async (status?: FeedbackStatus, type?: FeedbackType): Promise<Feedback[]> => {
    const params = new URLSearchParams();
    if (status !== undefined) params.append('status', status.toString());
    if (type !== undefined) params.append('type', type.toString());
    const query = params.toString();
    return api.get<Feedback[]>(`${BASE_URL}${query ? `?${query}` : ''}`);
  },

  // Get feedback submitted by the current user
  getMyFeedback: async (): Promise<Feedback[]> => {
    return api.get<Feedback[]>(`${BASE_URL}/my`);
  },

  // Get a specific feedback item
  getById: async (id: string): Promise<Feedback> => {
    return api.get<Feedback>(`${BASE_URL}/${id}`);
  },

  // Submit new feedback
  create: async (request: CreateFeedbackRequest): Promise<Feedback> => {
    return api.post<Feedback>(BASE_URL, request);
  },

  // Update feedback status and admin notes (admin only)
  update: async (id: string, request: UpdateFeedbackRequest): Promise<void> => {
    return api.put<void>(`${BASE_URL}/${id}`, request);
  },

  // Update AI conversation history
  updateAiConversation: async (
    id: string,
    aiConversationHistory?: string,
    refinedRequirements?: string
  ): Promise<void> => {
    return api.patch<void>(`${BASE_URL}/${id}/ai-conversation`, {
      aiConversationHistory,
      refinedRequirements,
    });
  },

  // Delete feedback
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`${BASE_URL}/${id}`);
  },

  // Get feedback statistics
  getStats: async (): Promise<FeedbackStats> => {
    return api.get<FeedbackStats>(`${BASE_URL}/stats`);
  },
};
