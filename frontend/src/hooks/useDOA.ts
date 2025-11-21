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
  });
};

export const useDOALetter = (id: string) => {
  return useQuery({
    queryKey: ['doaLetters', id],
    queryFn: () => doaService.getDOALetter(id),
    enabled: !!id,
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
  });
};
