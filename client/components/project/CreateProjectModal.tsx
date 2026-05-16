'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { validateUrl } from '@/lib/utils';

const projectSchema = z.object({
  name: z.string().optional(),
  endpoint_url: z.string().refine(validateUrl, {
    message: 'Must be a valid URL starting with http://, https://, ws://, or wss://',
  }),
  requires_token: z.boolean(),
  token: z.string().optional(),
  request_field_name: z.string().min(1, 'Required'),
  response_field_name: z.string().min(1, 'Required'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      requires_token: false,
      request_field_name: 'message',
      response_field_name: 'answer',
    },
  });

  const requiresToken = watch('requires_token');

  const handleFormSubmit = async (data: ProjectFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project" size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Project Name (Optional)"
          placeholder="My AI Agent"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Endpoint URL"
          placeholder="http://localhost:5000/chat"
          error={errors.endpoint_url?.message}
          {...register('endpoint_url')}
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requires_token"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            {...register('requires_token')}
          />
          <label htmlFor="requires_token" className="text-sm font-medium text-gray-700">
            Requires Authentication Token
          </label>
        </div>

        {requiresToken && (
          <Input
            label="Token"
            type="password"
            placeholder="Enter authentication token"
            error={errors.token?.message}
            {...register('token')}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Request Field Name"
            placeholder="message"
            error={errors.request_field_name?.message}
            {...register('request_field_name')}
          />

          <Input
            label="Response Field Name"
            placeholder="answer"
            error={errors.response_field_name?.message}
            {...register('response_field_name')}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob
