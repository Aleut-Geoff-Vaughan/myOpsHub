import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doaService } from '../services/doaService';
import type {
  CreateDOALetterRequest,
  UpdateDOALetterRequest,
  SignatureRequest,
  ActivationRequest,
  DOAFilter,
} from '../types/doa';

export const useDOALetters = (filter: DOAFilter = 'all') => {
  return useQuery({
    queryKey: ['doaLetters', filter],
    queryFn: () => doaService.getDOALetters(filter),
    // Optimize: Add caching to prevent excessive refetching
    staleTime: 2 * 60 * 1000, // DOA letters don't change frequently - 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: false, // Use cached data if available and fresh
  });
};

export const useDOALetter = (id: string) => {
  return useQuery({
    queryKey: ['doaLetters', id],
    queryFn: () => doaService.getDOALetter(id),
    enabled: !!id,
    // Optimize: Add caching for individual DOA letter details
    staleTime: 3 * 60 * 1000, // Details can be cached longer
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateDOALetter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateDOALetterRequest) => doaService.createDOALetter(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doaLetters'] });
    },
  });
};

export const useUpdateDOALetter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDOALetterRequest }) =>
      doaService.updateDOALetter(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doaLetters'] });
    },
  });
};

export const useDeleteDOALetter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => doaService.deleteDOALetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doaLetters'] });
    },
  });
};

export const useSignDOALetter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SignatureRequest }) =>
      doaService.signDOALetter(id, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doaLetters'] });
      queryClient.invalidateQueries({ queryKey: ['doaLetters', variables.id] });
    },
  });
};

export const useRevokeDOALetter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => doaService.revokeDOALetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doaLetters'] });
    },
  });
};

export const useActivateDOALetter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ActivationRequest }) =>
      doaService.activateDOALetter(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doaLetters'] });
      queryClient.invalidateQueries({ queryKey: ['doaActivations'] });
    },
  });
};

export const useActiveActivations = (date?: string) => {
  return useQuery({
    queryKey: ['doaActivations', 'active', date],
    queryFn: () => doaService.getActiveActivations(date),
    // Optimize: Add caching for activations
    staleTime: 2 * 60 * 1000, // Activations don't change frequently - 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
