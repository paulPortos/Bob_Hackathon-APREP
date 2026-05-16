'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { Sparkles } from 'lucide-react';

const generateSchema = z.object({
  count: z.number().min(1, 'At least 1 question required').max(10, 'Maximum 10 questions allowed'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  use_prompt: z.boolean(),
});

type GenerateFormData = z.infer<typeof generateSchema>;

interface GenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export default function GenerateQuestionsModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: GenerateQuestionsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      count: 5,
      purpose: '',
      use_prompt: true,
    },
  });

  const count = watch('count');

  const onSubmit = async (data: GenerateFormData) => {
    setIsGenerating(true);
    try {
      await apiClient.generateQuestions(projectId, data);
      toast.success('Questions generated successfully!');
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to generate questions'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      reset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Auto-Generate Questions with AI"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* AI Icon and Description */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">AI-Powered Question Generation</h4>
              <p className="text-sm text-gray-600">
                Our AI will analyze your purpose and optionally your prompt to generate relevant test questions.
              </p>
            </div>
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              id="count"
              min="1"
              max="10"
              {...register('count', { valueAsNumber: true })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <span className="text-2xl font-bold text-primary-600 w-12 text-center">
              {count}
            </span>
          </div>
          {errors.count && (
            <p className="mt-1 text-sm text-red-600">{errors.count.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Slide to select between 1 and 10 questions
          </p>
        </div>

        {/* Purpose */}
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
            Purpose *
          </label>
          <textarea
            id="purpose"
            {...register('purpose')}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
              errors.purpose ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe what you want to test...&#10;&#10;Example:&#10;Test the agent's ability to handle mathematical calculations and provide accurate results."
          />
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Be specific about what aspects you want to evaluate (minimum 10 characters)
          </p>
        </div>

        {/* Use Current Agent Prompt */}
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="use_prompt"
            {...register('use_prompt')}
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <div className="flex-1">
            <label htmlFor="use_prompt" className="text-sm font-medium text-gray-700 cursor-pointer">
              Use Current Agent Prompt
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Include your project's prompt in the AI context for more relevant questions
            </p>
          </div>
        </div>

        {/* Generating State */}
        {isGenerating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-6 w-6 text-blue-400 opacity-75" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">AI is generating questions...</p>
                <p className="text-xs text-blue-700">This may take a few moments</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isGenerating}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Questions
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob
