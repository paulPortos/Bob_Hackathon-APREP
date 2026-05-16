'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { apiClient } from '@/lib/api';
import { RunEvaluationRequest, QuestionSlot, Prompt } from '@/types';
import { CheckCircle2, ChevronRight, Play } from 'lucide-react';

interface EvaluationWizardProps {
  projectId: string;
  onComplete?: () => void;
}

export default function EvaluationWizard({ projectId, onComplete }: EvaluationWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [includeTraitTests, setIncludeTraitTests] = useState(true);
  const [traitTestCount, setTraitTestCount] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();

  // Fetch question slots
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['question-slots', projectId],
    queryFn: () => apiClient.getQuestionSlots(projectId),
  });

  // Fetch prompt
  const { data: prompt } = useQuery({
    queryKey: ['prompt', projectId],
    queryFn: () => apiClient.getPrompt(projectId),
    retry: false,
  });

  const runMutation = useMutation({
    mutationFn: (data: RunEvaluationRequest) =>
      apiClient.runEvaluation(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', projectId] });
      setIsRunning(false);
      toast.success('Evaluation completed successfully!');
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    },
    onError: (error: any) => {
      setIsRunning(false);
      toast.error(error.response?.data?.detail || 'Failed to run evaluation');
    },
  });

  const handleNext = () => {
    if (step === 1 && !selectedSlotId) {
      toast.error('Please select a question slot');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleRunEvaluation = () => {
    setIsRunning(true);
    const data: RunEvaluationRequest = {
      slot_id: selectedSlotId,
      prompt_id: selectedPromptId || undefined,
      include_trait_tests: includeTraitTests,
      trait_test_count: includeTraitTests ? traitTestCount : undefined,
    };
    runMutation.mutate(data);
  };

  const selectedSlot = slots?.find(s => s.id === selectedSlotId);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {s === 1 ? 'Select Slot' : s === 2 ? 'Configure' : 'Review'}
                </span>
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-4 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        {/* Step 1: Select Question Slot */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Select Question Slot</h2>
            <p className="text-gray-600 mb-6">
              Choose which question slot to use for this evaluation
            </p>

            {slotsLoading ? (
              <Spinner />
            ) : slots && slots.length > 0 ? (
              <div className="space-y-3">
                {slots.map((slot) => (
                  <label
                    key={slot.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
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
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{slot.name}</h3>
                        {slot.description && (
                          <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          {slot.questions.length} questions
                          {slot.is_auto_generated && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              AI Generated
                            </span>
                          )}
                        </p>
                      </div>
                      {selectedSlotId === slot.id && (
                        <CheckCircle2 className="h-6 w-6 text-primary-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No question slots available. Please create one first.
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={handleNext} disabled={!selectedSlotId}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Options */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Configure Options</h2>
            <p className="text-gray-600 mb-6">
              Set up evaluation parameters
            </p>

            <div className="space-y-6">
              {/* Prompt Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Selection
                </label>
                {prompt ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Current Prompt</span>
                      <span className="text-xs text-gray-500">
                        {prompt.file_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{prompt.content}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No prompt available</p>
                )}
              </div>

              {/* Trait Tests */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={includeTraitTests}
                    onChange={(e) => setIncludeTraitTests(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include Trait Tests
                  </span>
                </label>

                {includeTraitTests && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Trait Tests: {traitTestCount}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={traitTestCount}
                      onChange={(e) => setTraitTestCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Run */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Review & Run</h2>
            <p className="text-gray-600 mb-6">
              Review your selections before running the evaluation
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Question Slot</h3>
                <p className="text-gray-900">{selectedSlot?.name}</p>
                <p className="text-sm text-gray-600">{selectedSlot?.questions.length} questions</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Prompt</h3>
                <p className="text-gray-900">{prompt ? 'Current prompt' : 'No prompt'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Trait Tests</h3>
                <p className="text-gray-900">
                  {includeTraitTests ? `Yes (${traitTestCount} tests)` : 'No'}
                </p>
              </div>
            </div>

            {isRunning ? (
              <div className="text-center py-8">
                <Spinner size="lg" />
                <p className="text-lg font-medium text-gray-900 mt-4">Running evaluation...</p>
                <p className="text-sm text-gray-600 mt-2">This may take a few minutes</p>
              </div>
            ) : (
              <div className="flex justify-between">
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleRunEvaluation} size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Run Evaluation
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob