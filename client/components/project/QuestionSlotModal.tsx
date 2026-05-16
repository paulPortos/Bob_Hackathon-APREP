'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import type { QuestionSlot } from '@/types';

const questionSchema = z.object({
  question_text: z.string().min(5, 'Question must be at least 5 characters'),
  expected_answer: z.string().optional(),
  order: z.number(),
});

const slotSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required').max(10, 'Maximum 10 questions allowed'),
});

type SlotFormData = z.infer<typeof slotSchema>;

interface QuestionSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingSlot?: QuestionSlot | null;
  onSuccess: () => void;
}

export default function QuestionSlotModal({
  isOpen,
  onClose,
  projectId,
  existingSlot,
  onSuccess,
}: QuestionSlotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: existingSlot
      ? {
          name: existingSlot.name,
          description: existingSlot.description || '',
          questions: existingSlot.questions.map((q, idx) => ({
            question_text: q.question_text,
            expected_answer: q.expected_answer || '',
            order: idx + 1,
          })),
        }
      : {
          name: '',
          description: '',
          questions: [{ question_text: '', expected_answer: '', order: 1 }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (data: SlotFormData) => {
    setIsSubmitting(true);
    try {
      if (existingSlot) {
        await apiClient.updateQuestionSlot(existingSlot.id, data);
        toast.success('Question slot updated successfully');
      } else {
        await apiClient.createQuestionSlot(projectId, data);
        toast.success('Question slot created successfully');
      }
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save question slot'));
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

  const addQuestion = () => {
    if (fields.length < 10) {
      append({ question_text: '', expected_answer: '', order: fields.length + 1 });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={existingSlot ? 'Edit Question Slot' : 'Create Question Slot'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Slot Name */}
        <Input
          label="Slot Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g., Basic Tests, Security Tests"
          required
        />

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            placeholder="Brief description of this question slot"
          />
        </div>

        {/* Questions */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Questions ({fields.length}/10)
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addQuestion}
              disabled={fields.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      {...register(`questions.${index}.question_text`)}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.questions?.[index]?.question_text
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter your question here"
                    />
                    {errors.questions?.[index]?.question_text && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.questions[index]?.question_text?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Expected Answer (Optional)
                    </label>
                    <input
                      type="text"
                      {...register(`questions.${index}.expected_answer`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Expected answer for comparison"
                    />
                  </div>

                  <input
                    type="hidden"
                    {...register(`questions.${index}.order`)}
                    value={index + 1}
                  />
                </div>
              </div>
            ))}
          </div>

          {errors.questions && typeof errors.questions.message === 'string' && (
            <p className="mt-2 text-sm text-red-600">{errors.questions.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {existingSlot ? 'Update Slot' : 'Create Slot'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob
