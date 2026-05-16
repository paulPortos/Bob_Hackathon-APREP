'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import type { Prompt } from '@/types';

const promptSchema = z.object({
  content: z.string().min(10, 'Prompt must be at least 10 characters'),
  file_type: z.enum(['txt', 'md']),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingPrompt?: Prompt | null;
  onSuccess: () => void;
}

export default function PromptModal({
  isOpen,
  onClose,
  projectId,
  existingPrompt,
  onSuccess,
}: PromptModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      content: existingPrompt?.content || '',
      file_type: existingPrompt?.file_type || 'txt',
    },
  });

  const onSubmit = async (data: PromptFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.createOrUpdatePrompt(projectId, data);
      toast.success(existingPrompt ? 'Prompt updated successfully' : 'Prompt created successfully');
      onSuccess();
      onClose();
      reset();
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      toast.error(error.response?.data?.detail || 'Failed to save prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={existingPrompt ? 'Edit Prompt' : 'Upload Prompt'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* File Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="txt"
                {...register('file_type')}
                className="mr-2"
              />
              <span className="text-sm">Text (.txt)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="md"
                {...register('file_type')}
                className="mr-2"
              />
              <span className="text-sm">Markdown (.md)</span>
            </label>
          </div>
        </div>

        {/* Prompt Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Content
          </label>
          <textarea
            id="content"
            {...register('content')}
            rows={12}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your system prompt here...&#10;&#10;Example:&#10;You are a helpful AI assistant. Your role is to..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This prompt will be used as the system message for your AI agent during evaluations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {existingPrompt ? 'Update Prompt' : 'Save Prompt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob