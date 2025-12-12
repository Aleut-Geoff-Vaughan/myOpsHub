import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackService } from '../services/feedbackService';
import { useAuthStore } from '../stores/authStore';
import type { CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackStatus, FeedbackType } from '../types/feedback';

const FEEDBACK_QUERY_KEY = 'feedback';

/**
 * Hook to get all feedback for the current tenant (admin view)
 */
export function useFeedbackList(status?: FeedbackStatus, type?: FeedbackType) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [FEEDBACK_QUERY_KEY, 'list', status, type],
    queryFn: () => feedbackService.getAll(status, type),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get feedback submitted by the current user
 */
export function useMyFeedback() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [FEEDBACK_QUERY_KEY, 'my'],
    queryFn: () => feedbackService.getMyFeedback(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get a specific feedback item
 */
export function useFeedbackById(id?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [FEEDBACK_QUERY_KEY, id],
    queryFn: () => feedbackService.getById(id!),
    enabled: !!id && isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to submit new feedback
 */
export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateFeedbackRequest) => feedbackService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDBACK_QUERY_KEY] });
    },
  });
}

/**
 * Hook to update feedback status (admin)
 */
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateFeedbackRequest }) =>
      feedbackService.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDBACK_QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete feedback
 */
export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feedbackService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDBACK_QUERY_KEY] });
    },
  });
}

/**
 * Hook to get feedback statistics
 */
export function useFeedbackStats() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [FEEDBACK_QUERY_KEY, 'stats'],
    queryFn: () => feedbackService.getStats(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
