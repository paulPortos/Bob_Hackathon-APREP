'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import type { RunEvaluationRequest } from '@/types';

interface EvaluationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

const steps = [
  { number: 1, label: 'Questions' },
  { number: 2, label: 'Options' },
  { number: 3, label: 'Review' },
];

export default function EvaluationWizard({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: EvaluationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [includeTraitTests, setIncludeTraitTests] = useState(true);
  const [traitTestCount, setTraitTestCount] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['question-slots', projectId],
    queryFn: () => apiClient.getQuestionSlots(projectId),
    enabled: isOpen,
  });
  const { data: prompt, isLoading: promptLoading } = useQuery({
    queryKey: ['prompt', projectId],
    queryFn: () => apiClient.getPrompt(projectId),
    enabled: isOpen,
    retry: false,
  });

  useEffect(() => {
    if (isOpen && prompt?.id && prompt.content.trim()) setSelectedPromptId(prompt.id);
  }, [isOpen, prompt]);

  const selectedSlot = slots?.find((slot) => slot.id === selectedSlotId);
  const totalTests = (selectedSlot?.questions.length || 0) + (includeTraitTests ? traitTestCount : 0);

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedSlotId('');
    setSelectedPromptId('');
    setIncludeTraitTests(true);
    setTraitTestCount(5);
    onClose();
  };

  const closeWizard = () => {
    if (isRunning) return;
    resetWizard();
  };

  const runEvaluationMutation = useMutation({
    mutationFn: () => {
      const payload: RunEvaluationRequest = {
        slot_id: selectedSlotId,
        prompt_id: selectedPromptId,
        include_trait_tests: includeTraitTests,
        trait_test_count: traitTestCount,
      };
      return apiClient.runEvaluation(projectId, payload);
    },
    onSuccess: () => {
      setIsRunning(false);
      toast.success('Evaluation completed');
      onSuccess();
      resetWizard();
    },
    onError: (error) => {
      setIsRunning(false);
      toast.error(getApiErrorMessage(error, 'Failed to run evaluation'));
    },
  });

  const canContinue = currentStep === 1 ? Boolean(selectedSlotId) : Boolean(selectedPromptId);

  return (
    <Modal isOpen={isOpen} onClose={closeWizard} title="Configure evaluation" size="lg">
      <div className="max-h-[calc(100svh-10rem)] overflow-y-auto px-1 pb-1 pr-2">
        <div className="grid grid-cols-3 gap-2" aria-label="Evaluation setup progress">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isComplete = currentStep > step.number;
            return (
              <div
                key={step.number}
                className={`rounded-xl border px-2 py-2.5 transition sm:px-3 ${
                  isActive
                    ? 'border-sky-300 bg-sky-50'
                    : isComplete
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-slate-200 bg-white'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-semibold ${
                      isActive
                        ? 'bg-sky-700 text-white'
                        : isComplete
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : step.number}
                  </span>
                  <span
                    className={`min-w-0 truncate text-[10px] font-semibold sm:text-xs ${
                      isActive ? 'text-sky-900' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="min-h-[320px] py-6">
          {currentStep === 1 && (
            <section>
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">Choose a question set</h3>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Every question in the selected set will be sent to the agent in its saved order.
              </p>

              {slotsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-sky-700" />
                </div>
              ) : slots?.length ? (
                <div className="mt-5 space-y-2.5">
                  {slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <label
                        key={slot.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 ${
                          isSelected
                            ? 'border-sky-400 bg-sky-50/70'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="slot"
                          value={slot.id}
                          checked={isSelected}
                          onChange={(event) => setSelectedSlotId(event.target.value)}
                          className="sr-only"
                        />
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" strokeWidth={2.5} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{slot.name}</span>
                            {slot.is_auto_generated && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                <Sparkles className="h-3 w-3" /> Generated
                              </span>
                            )}
                          </div>
                          {slot.description && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{slot.description}</p>
                          )}
                          <p className="mt-2 text-xs font-medium text-slate-400">
                            {slot.questions.length} {slot.questions.length === 1 ? 'question' : 'questions'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <ListChecks className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No question sets available</p>
                  <p className="mt-1 text-xs text-slate-500">Create a question set before starting an evaluation.</p>
                </div>
              )}
            </section>
          )}

          {currentStep === 2 && (
            <section className="space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">Set evaluation context</h3>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  The saved prompt provides the expected behavior. Optional probes test common risk areas.
                </p>
              </div>

              {promptLoading ? (
                <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ) : prompt?.content?.trim() ? (
                <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                      <FileText className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">Current agent prompt</h4>
                        <CheckCircle2 className="h-4 w-4 text-sky-700" />
                      </div>
                      <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                        {prompt.content}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-500">Used for prompt-adherence scoring</p>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <span>Add an agent prompt before running an evaluation.</span>
                </div>
              )}

              <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Behavior probes</h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Add built-in security, honesty, and prompt-adherence questions.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeTraitTests}
                    onClick={() => setIncludeTraitTests((current) => !current)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                      includeTraitTests ? 'bg-sky-700' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        includeTraitTests ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                    <span className="sr-only">Include behavior probes</span>
                  </button>
                </div>

                {includeTraitTests && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="trait-test-count" className="text-sm font-medium text-slate-700">
                        Additional probes
                      </label>
                      <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-950 px-2 text-sm font-semibold text-white">
                        {traitTestCount}
                      </span>
                    </div>
                    <input
                      id="trait-test-count"
                      type="range"
                      min="1"
                      max="10"
                      value={traitTestCount}
                      onChange={(event) => setTraitTestCount(Number(event.target.value))}
                      className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-700"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                )}
              </article>
            </section>
          )}

          {currentStep === 3 && (
            <section>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-sky-700" strokeWidth={1.8} />
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">Review the run</h3>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Confirm the scope before APREP starts calling the endpoint.
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
                  <div className="bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Question set</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedSlot?.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedSlot?.questions.length || 0} saved questions</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Behavior probes</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {includeTraitTests ? `${traitTestCount} included` : 'Not included'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Optional adversarial checks</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Prompt context</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Current prompt</p>
                    <p className="mt-1 text-xs text-slate-500">Used for adherence scoring</p>
                  </div>
                  <div className="bg-slate-950 p-4 text-white">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total endpoint calls</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{totalTests}</p>
                    <p className="mt-1 text-xs text-slate-400">One call per test</p>
                  </div>
                </div>
              </div>

              {isRunning && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-700" />
                  <div>
                    <p className="text-sm font-semibold text-sky-950">Evaluation in progress</p>
                    <p className="mt-0.5 text-xs text-sky-700">Keep this window open while responses are collected.</p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-1 pt-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex sm:min-w-24">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep((step) => step - 1)}
                disabled={isRunning}
                className="w-full rounded-xl text-slate-600 hover:bg-slate-100 sm:w-auto"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeWizard}
              disabled={isRunning}
              className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 sm:flex-none"
            >
              Cancel
            </Button>
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep((step) => step + 1)}
                disabled={!canContinue}
                className="flex-1 rounded-xl bg-slate-950 hover:bg-slate-800 focus:ring-slate-500 sm:flex-none"
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setIsRunning(true);
                  runEvaluationMutation.mutate();
                }}
                disabled={isRunning}
                isLoading={isRunning}
                className="flex-1 rounded-xl bg-slate-950 hover:bg-slate-800 focus:ring-slate-500 sm:flex-none"
              >
                <Play className="mr-1.5 h-4 w-4" />
                Run evaluation
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
