'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { GenerateQuestionsRequest } from '@/types';
import { Sparkles } from 'lucide-react';

interface GenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function GenerateQuestionsModal({
  isOpen,
  onClose,
  projectId,
}: GenerateQuestionsModalProps) {
  const [count, setCount] = useState(5);
  const [purpose, setPurpose] = useState('');
  const [usePrompt, setUsePrompt] = useState(true);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: GenerateQuestionsRequest) =>
      apiClient.generateQuestions(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] });
      toast.success('Questions generated successfully!');
      onClose();
      // Reset form
      setCount(5);
      setPurpose('');
      setUsePrompt(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate questions');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purpose.trim() || purpose.trim().length < 10) {
      toast.error('Purpose must be at least 10 characters');
      return;
    }

    mutation.mutate({
      count,
      purpose: purpose.trim(),
      use_prompt: usePrompt,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Questions with AI"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {mutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-blue-900">AI is generating questions...</p>
              <p className="text-xs text-blue-700 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={mutation.isPending}
            />
            <span className="text-lg font-semibold text-gray-900 w-8 text-center">
              {count}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Select between 1 and 10 questions
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder="Describe what you want to test. For example: 'Test the agent's ability to handle mathematical calculations' or 'Evaluate security awareness when handling sensitive data'"
            required
            minLength={10}
            disabled={mutation.isPending}
          />
          <p className="mt-1 text-xs text-gray-500">
            {purpose.length} / 10 characters minimum
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={usePrompt}
              onChange={(e) => setUsePrompt(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={mutation.isPending}
            />
            <span className="text-sm text-gray-700">
              Use current project prompt as context
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 ml-6">
            The AI will consider your project's prompt when generating questions
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Questions
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob