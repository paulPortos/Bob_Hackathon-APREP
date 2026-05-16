'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { Prompt, CreatePromptRequest } from '@/types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingPrompt?: Prompt | null;
}

export default function PromptModal({
  isOpen,
  onClose,
  projectId,
  existingPrompt,
}: PromptModalProps) {
  const [content, setContent] = useState('');
  const [fileType, setFileType] = useState<'txt' | 'md'>('txt');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (existingPrompt) {
      setContent(existingPrompt.content);
      setFileType(existingPrompt.file_type as 'txt' | 'md');
    } else {
      setContent('');
      setFileType('txt');
    }
  }, [existingPrompt, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: CreatePromptRequest) =>
      apiClient.createOrUpdatePrompt(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt', projectId] });
      toast.success(existingPrompt ? 'Prompt updated successfully!' : 'Prompt created successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save prompt');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Prompt content cannot be empty');
      return;
    }
    mutation.mutate({ content, file_type: fileType });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingPrompt ? 'Edit Prompt' : 'Upload Prompt'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="txt"
                checked={fileType === 'txt'}
                onChange={(e) => setFileType(e.target.value as 'txt' | 'md')}
                className="mr-2"
              />
              Text (.txt)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="md"
                checked={fileType === 'md'}
                onChange={(e) => setFileType(e.target.value as 'txt' | 'md')}
                className="mr-2"
              />
              Markdown (.md)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            placeholder="Enter your prompt content here..."
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            {content.length} characters
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {existingPrompt ? 'Update' : 'Save'} Prompt
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob