'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import { QuestionSlot, CreateQuestionSlotRequest, UpdateQuestionSlotRequest } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingSlot?: QuestionSlot | null;
}

interface QuestionInput {
  question_text: string;
  expected_answer: string;
  order: number;
}

export default function QuestionSlotModal({
  isOpen,
  onClose,
  projectId,
  existingSlot,
}: QuestionSlotModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { question_text: '', expected_answer: '', order: 1 },
  ]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (existingSlot) {
      setName(existingSlot.name);
      setDescription(existingSlot.description || '');
      setQuestions(
        existingSlot.questions.map((q) => ({
          question_text: q.question_text,
          expected_answer: q.expected_answer || '',
          order: q.order,
        }))
      );
    } else {
      setName('');
      setDescription('');
      setQuestions([{ question_text: '', expected_answer: '', order: 1 }]);
    }
  }, [existingSlot, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateQuestionSlotRequest) =>
      apiClient.createQuestionSlot(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] });
      toast.success('Question slot created successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create question slot');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateQuestionSlotRequest) =>
      apiClient.updateQuestionSlot(existingSlot!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-slots', projectId] });
      toast.success('Question slot updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update question slot');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Slot name is required');
      return;
    }

    const validQuestions = questions.filter(q => q.question_text.trim());
    if (validQuestions.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    const data = {
      name,
      description: description || undefined,
      questions: validQuestions,
    };

    if (existingSlot) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast.error('Maximum 10 questions allowed');
      return;
    }
    setQuestions([
      ...questions,
      { question_text: '', expected_answer: '', order: questions.length + 1 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('At least one question is required');
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    // Reorder
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: keyof QuestionInput, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingSlot ? 'Edit Question Slot' : 'Create Question Slot'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            label="Slot Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Basic Tests"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder="Brief description of this question slot"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Questions
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addQuestion}
              disabled={questions.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Question {index + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <Input
                    label="Question Text"
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    placeholder="Enter your question"
                    required
                  />
                  <Input
                    label="Expected Answer (Optional)"
                    value={question.expected_answer}
                    onChange={(e) => updateQuestion(index, 'expected_answer', e.target.value)}
                    placeholder="Expected answer for reference"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {existingSlot ? 'Update' : 'Create'} Slot
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob