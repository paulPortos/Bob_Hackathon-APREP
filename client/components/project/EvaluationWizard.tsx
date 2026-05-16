'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { ChevronLeft, ChevronRight, Play, CheckCircle } from 'lucide-react';
import type { QuestionSlot, Prompt, RunEvaluationRequest } from '@/types';

interface EvaluationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export default function EvaluationWizard({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: EvaluationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [includeTraitTests, setIncludeTraitTests] = useState(true);
  const [traitTestCount, setTraitTestCount] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch question slots
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['question-slots', projectId],
    queryFn: () => apiClient.getQuestionSlots(projectId),
    enabled: isOpen,
  });

  // Fetch prompt
  const { data: prompt, isLoading: promptLoading } = useQuery({
    queryKey: ['prompt', projectId],
    queryFn: () => apiClient.getPrompt(projectId),
    enabled: isOpen,
    retry: false,
  });

  useEffect(() => {
    if (isOpen && prompt?.id) {
      setSelectedPromptId(prompt.id);
    }
  }, [isOpen, prompt?.id]);

  const selectedSlot = slots?.find(s => s.id === selectedSlotId);

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
      toast.success('Evaluation completed successfully!');
      onSuccess();
      handleClose();
      // Redirect to history tab after 1 second
      setTimeout(() => {
        router.push(`/project/${projectId}?tab=history`);
      }, 1000);
    },
    onError: (error) => {
      setIsRunning(false);
      toast.error(getApiErrorMessage(error, 'Failed to run evaluation'));
    },
  });

  const handleClose = () => {
    if (!isRunning) {
      setCurrentStep(1);
      setSelectedSlotId('');
      setSelectedPromptId('');
      setIncludeTraitTests(true);
      setTraitTestCount(5);
      onClose();
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRunEvaluation = () => {
    setIsRunning(true);
    runEvaluationMutation.mutate();
  };

  const canProceedStep1 = selectedSlotId !== '';
  const canProceedStep2 = Boolean(prompt && selectedPromptId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Run Evaluation"
      size="lg"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === currentStep
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : step < currentStep
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-400'
              }`}>
                {step < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-xs text-gray-600">
          <span className={currentStep === 1 ? 'font-semibold text-primary-600' : ''}>
            Select Slot
          </span>
          <span className={currentStep === 2 ? 'font-semibold text-primary-600' : ''}>
            Configure
          </span>
          <span className={currentStep === 3 ? 'font-semibold text-primary-600' : ''}>
            Review & Run
          </span>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Select Question Slot */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Question Slot</h3>
              <p className="text-sm text-gray-600">
                Choose which question slot to use for this evaluation
              </p>

              {slotsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {slots.map((slot) => (
                    <label
                      key={slot.id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedSlotId === slot.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.id}
                        checked={selectedSlotId === slot.id}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">{slot.name}</div>
                        {slot.description && (
                          <div className="text-sm text-gray-600 mt-1">{slot.description}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{slot.questions.length} questions</span>
                          {slot.is_auto_generated && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                              AI Generated
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No question slots available</p>
                  <p className="text-sm mt-1">Create a question slot first</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure Options */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Configure Evaluation Options</h3>

              {/* Prompt Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Prompt Context
                </label>
                {promptLoading ? (
                  <div className="text-sm text-gray-500">Loading prompt...</div>
                ) : prompt ? (
                  <div className="space-y-2">
                    <label className="flex items-start p-3 border-2 border-primary-600 bg-primary-50 rounded-lg">
                      <input
                        type="radio"
                        name="prompt"
                        value={prompt.id}
                        checked={selectedPromptId === prompt.id}
                        onChange={(e) => setSelectedPromptId(e.target.value)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Use Current Agent Prompt</div>
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {prompt.content.substring(0, 100)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Required evaluator context for prompt-adherence scoring.
                        </div>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                    Upload an agent prompt before running an evaluation.
                  </div>
                )}
              </div>

              {/* Trait Tests */}
              <div className="border-t pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="includeTraitTests"
                    checked={includeTraitTests}
                    onChange={(e) => setIncludeTraitTests(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="includeTraitTests" className="font-medium text-gray-900 cursor-pointer">
                      Include Trait Tests
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Test additional traits like security, honesty, and speed
                    </p>
                  </div>
                </div>

                {includeTraitTests && (
                  <div className="ml-7 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Trait Tests
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={traitTestCount}
                        onChange={(e) => setTraitTestCount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <span className="text-2xl font-bold text-primary-600 w-12 text-center">
                        {traitTestCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Additional questions to test security, honesty, and other traits
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Run */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review & Run Evaluation</h3>
              <p className="text-sm text-gray-600">
                Review your selections before running the evaluation
              </p>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Question Slot</div>
                  <div className="mt-1 font-medium text-gray-900">{selectedSlot?.name}</div>
                  <div className="text-sm text-gray-600">{selectedSlot?.questions.length} questions</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-xs font-medium text-gray-500 uppercase">Prompt</div>
                  <div className="mt-1 text-sm text-gray-900">
                    Using current agent prompt as evaluator context
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-xs font-medium text-gray-500 uppercase">Trait Tests</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {includeTraitTests ? `Yes (${traitTestCount} additional tests)` : 'No'}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-xs font-medium text-gray-500 uppercase">Total Tests</div>
                  <div className="mt-1 text-2xl font-bold text-primary-600">
                    {(selectedSlot?.questions.length || 0) + (includeTraitTests ? traitTestCount : 0)}
                  </div>
                </div>
              </div>

              {isRunning && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Running evaluation...</p>
                      <p className="text-xs text-blue-700">This may take a few moments</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={isRunning}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isRunning}
            >
              Cancel
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleRunEvaluation}
                disabled={isRunning}
                isLoading={isRunning}
              >
                <Play className="h-4 w-4 mr-2" />
                Run Evaluation
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Made with Bob
