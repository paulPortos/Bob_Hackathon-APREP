'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Plus,
  Trash2,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import type { QuestionSlot } from '@/types';

const MAX_QUESTIONS = 10;

const questionSchema = z.object({
  question_text: z
    .string()
    .trim()
    .min(5, 'Enter a question with at least 5 characters')
    .max(5_000, 'Question is too long'),
  expected_answer: z.string().trim().max(10_000, 'Expected answer is too long').optional(),
  order: z.number(),
});

const slotSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters')
    .max(120, 'Keep the name under 120 characters'),
  description: z.string().trim().max(2_000, 'Keep the description under 2,000 characters').optional(),
  questions: z
    .array(questionSchema)
    .min(1, 'Add at least one question')
    .max(MAX_QUESTIONS, `You can add up to ${MAX_QUESTIONS} questions`),
});

type SlotFormData = z.infer<typeof slotSchema>;

interface QuestionSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingSlot?: QuestionSlot | null;
  onSuccess: () => void;
}

function getFormValues(existingSlot?: QuestionSlot | null): SlotFormData {
  if (!existingSlot) {
    return {
      name: '',
      description: '',
      questions: [{ question_text: '', expected_answer: '', order: 1 }],
    };
  }

  return {
    name: existingSlot.name,
    description: existingSlot.description || '',
    questions: existingSlot.questions.map((question, index) => ({
      question_text: question.question_text,
      expected_answer: question.expected_answer || '',
      order: index + 1,
    })),
  };
}

export default function QuestionSlotModal({
  isOpen,
  onClose,
  projectId,
  existingSlot,
  onSuccess,
}: QuestionSlotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerVisibility, setAnswerVisibility] = useState<Record<string, boolean>>({});

  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: getFormValues(existingSlot),
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  const description = watch('description') || '';
  const questionValues = watch('questions') || [];

  useEffect(() => {
    if (!isOpen) return;
    reset(getFormValues(existingSlot));
    setAnswerVisibility({});
  }, [existingSlot, isOpen, reset]);

  const onSubmit = async (data: SlotFormData) => {
    setIsSubmitting(true);
    const normalizedData = {
      ...data,
      description: data.description || undefined,
      questions: data.questions.map((question, index) => ({
        question_text: question.question_text,
        expected_answer: question.expected_answer || undefined,
        order: index + 1,
      })),
    };

    try {
      if (existingSlot) {
        await apiClient.updateQuestionSlot(existingSlot.id, normalizedData);
        toast.success('Question slot updated');
      } else {
        await apiClient.createQuestionSlot(projectId, normalizedData);
        toast.success('Question slot created');
      }
      onSuccess();
      onClose();
      reset(getFormValues(null));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save question slot'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset(getFormValues(existingSlot));
    setAnswerVisibility({});
    onClose();
  };

  const addQuestion = () => {
    if (fields.length >= MAX_QUESTIONS) return;
    const newIndex = fields.length;
    append(
      { question_text: '', expected_answer: '', order: newIndex + 1 },
      { shouldFocus: false }
    );
    window.requestAnimationFrame(() => setFocus(`questions.${newIndex}.question_text`));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={existingSlot ? 'Edit question slot' : 'Create question slot'}
      size="lg"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[calc(100svh-10rem)] space-y-6 overflow-y-auto px-1 pb-1 pr-2"
      >
        <p className="text-sm leading-6 text-slate-500">
          Group questions that test the same behavior, skill, or risk area.
        </p>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-slate-800">Set details</h3>
          </div>

          <div className="space-y-4">
            <Input
              label="Question set name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Security boundaries"
              autoFocus={!existingSlot}
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="slot-description" className="text-sm font-medium text-slate-700">
                  Purpose <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <span className="text-xs tabular-nums text-slate-400">
                  {description.length.toLocaleString()} / 2,000
                </span>
              </div>
              <textarea
                id="slot-description"
                {...register('description')}
                rows={2}
                className={`h-20 w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  errors.description
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
                }`}
                placeholder="What should this set verify?"
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Questions</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {fields.length} of {MAX_QUESTIONS}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {fields.map((field, index) => {
              const hasExpectedAnswer = Boolean(questionValues[index]?.expected_answer?.trim());
              const showExpectedAnswer = answerVisibility[field.id] ?? hasExpectedAnswer;

              return (
                <article
                  key={field.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-950 text-[11px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">Question {index + 1}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Move question ${index + 1} up`}
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        disabled={index === fields.length - 1}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Move question ${index + 1} down`}
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                          aria-label={`Delete question ${index + 1}`}
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 p-3.5">
                    <div>
                      <label
                        htmlFor={`question-${field.id}`}
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        Ask the agent
                      </label>
                      <textarea
                        id={`question-${field.id}`}
                        {...register(`questions.${index}.question_text`)}
                        rows={2}
                        className={`h-16 w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                          errors.questions?.[index]?.question_text
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                            : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
                        }`}
                        placeholder="Write one clear question…"
                      />
                      {errors.questions?.[index]?.question_text && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {errors.questions[index]?.question_text?.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setAnswerVisibility((current) => ({
                          ...current,
                          [field.id]: !showExpectedAnswer,
                        }))
                      }
                      className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left text-sm font-medium text-slate-500 transition hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      aria-expanded={showExpectedAnswer}
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 ${hasExpectedAnswer ? 'text-emerald-600' : 'text-slate-400'}`}
                          strokeWidth={1.8}
                        />
                        Expected answer <span className="font-normal text-slate-400">(optional)</span>
                      </span>
                      {showExpectedAnswer ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {showExpectedAnswer && (
                      <div>
                        <textarea
                          {...register(`questions.${index}.expected_answer`)}
                          rows={2}
                          className={`h-16 w-full resize-none rounded-xl border bg-emerald-50/30 px-3.5 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                            errors.questions?.[index]?.expected_answer
                              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                              : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100'
                          }`}
                          placeholder="What would a correct answer include?"
                        />
                        {errors.questions?.[index]?.expected_answer && (
                          <p className="mt-1.5 text-xs text-red-600">
                            {errors.questions[index]?.expected_answer?.message}
                          </p>
                        )}
                      </div>
                    )}

                    <input
                      type="hidden"
                      {...register(`questions.${index}.order`, { valueAsNumber: true })}
                      value={index + 1}
                    />
                  </div>
                </article>
              );
            })}

          </div>

          {errors.questions && typeof errors.questions.message === 'string' && (
            <p className="mt-2 text-xs text-red-600">{errors.questions.message}</p>
          )}
        </section>

        <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 border-t border-slate-100 bg-white/95 px-1 pb-1 pt-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={addQuestion}
            disabled={isSubmitting || fields.length >= MAX_QUESTIONS}
            className="rounded-xl border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus:ring-sky-400"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add question
          </Button>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="rounded-xl bg-slate-950 px-5 hover:bg-slate-800 focus:ring-slate-500"
            >
              {existingSlot ? 'Save changes' : 'Create question set'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
