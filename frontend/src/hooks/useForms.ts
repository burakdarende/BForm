import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import type { Form } from '../types';

// Get public forms
export const usePublicForms = () => {
  return useQuery('publicForms', () => api.forms.getPublic(), {
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get form by slug
export const useFormBySlug = (slug: string, enabled = true) => {
  return useQuery(
    ['form', slug],
    () => api.forms.getBySlug(slug),
    {
      enabled: enabled && !!slug,
      select: (response) => response.data,
      retry: 1,
    }
  );
};

// Get user's forms
export const useMyForms = () => {
  return useQuery('myForms', () => api.forms.getMy(), {
    select: (response) => response.data,
  });
};

// Create form
export const useCreateForm = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (formData: Partial<Form>) => api.forms.create(formData),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('myForms');
        toast.success('Form başarıyla oluşturuldu!');
        return response.data;
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Form oluşturulamadı';
        toast.error(message);
      },
    }
  );
};

// Update form
export const useUpdateForm = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, formData }: { id: string; formData: Partial<Form> }) =>
      api.forms.update(id, formData),
    {
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries('myForms');
        queryClient.invalidateQueries(['form', variables.id]);
        toast.success('Form başarıyla güncellendi!');
        return response.data;
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Form güncellenemedi';
        toast.error(message);
      },
    }
  );
};

// Delete form
export const useDeleteForm = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id: string) => api.forms.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myForms');
        toast.success('Form başarıyla silindi!');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Form silinemedi';
        toast.error(message);
      },
    }
  );
};

// Toggle form status
export const useToggleForm = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id: string) => api.forms.toggle(id),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('myForms');
        const message = response.data.message || 'Form durumu güncellendi';
        toast.success(message);
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Durum güncellenemedi';
        toast.error(message);
      },
    }
  );
};

// Submit form response
export const useSubmitResponse = () => {
  return useMutation(
    ({ slug, responses }: { slug: string; responses: any[] }) =>
      api.responses.submit(slug, responses),
    {
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Form gönderilemedi';
        toast.error(message);
      },
    }
  );
};

// Get form responses
export const useFormResponses = (formId: string, page = 1, limit = 10) => {
  return useQuery(
    ['formResponses', formId, page, limit],
    () => api.responses.getByForm(formId, page, limit),
    {
      enabled: !!formId,
      select: (response) => response.data,
      keepPreviousData: true,
    }
  );
};

// Get single response
export const useResponse = (responseId: string) => {
  return useQuery(
    ['response', responseId],
    () => api.responses.get(responseId),
    {
      enabled: !!responseId,
      select: (response) => response.data,
    }
  );
};

// Update response status
export const useUpdateResponseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ responseId, status, notes }: { responseId: string; status: string; notes?: string }) =>
      api.responses.updateStatus(responseId, status, notes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['response']);
        queryClient.invalidateQueries(['formResponses']);
        toast.success('Yanıt durumu güncellendi!');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Durum güncellenemedi';
        toast.error(message);
      },
    }
  );
};